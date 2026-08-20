const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route files
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const stationRoutes = require('./routes/station');
const labRoutes = require('./routes/lab');
const warehouseRoutes = require('./routes/warehouse');
const hospitalRoutes = require('./routes/hospital');
const donorRoutes = require('./routes/donor');
const hmsRoutes = require('./routes/hms');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/hms', hmsRoutes);

// Root heartbeat route
app.get('/', (req, res) => {
  res.json({ message: 'Blood Bank Hub & Emergency API Server is Online' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// WebSocket configuration wrapper
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('[WebSocket] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[WebSocket] Client disconnected:', socket.id);
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  
  // Background reminders scheduler
  const { mainDb } = require('./config/prisma');
  const { sendSMS } = require('./utils/sms');

  async function runAutoReminders() {
    try {
      console.log('[Scheduler] Running 3-month donation reminders check...');
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const donors = await mainDb.donor.findMany({
        where: {
          last_donation_date: {
            lte: ninetyDaysAgo
          }
        }
      });

      for (const donor of donors) {
        const lastSample = await mainDb.bloodSample.findFirst({
          where: { fayda_id: donor.fayda_id },
          orderBy: { collected_at: 'desc' }
        });
        if (!lastSample) continue;

        const existingReminderLog = await mainDb.sentSmsLog.findUnique({
          where: {
            blood_sample_id_message_type: {
              blood_sample_id: lastSample.id,
              message_type: 'reminder'
            }
          }
        });
        if (existingReminderLog) continue;

        const reminderMessage = `Dear ${donor.name}, 3 months have passed since your last blood donation! You are now eligible to donate again. Please visit a collection station to save lives. - Blood Bank Hub`;
        await sendSMS(donor.phone, reminderMessage, lastSample.id, 'reminder');
        console.log(`[Scheduler] Sent 3-month reminder SMS to ${donor.name}`);
      }
    } catch (err) {
      console.error('[Scheduler Error] Failed to execute auto-reminders:', err.message);
    }
  }

  // Check every 24 hours
  setInterval(runAutoReminders, 24 * 60 * 60 * 1000);
  // Also run once 5 seconds after startup to verify it works in logs
  setTimeout(runAutoReminders, 5000);

  // Background blood bag expiration validator
  async function runAutoExpiryCheck() {
    try {
      console.log('[Scheduler] Running blood bag expiration check (35-day limit)...');
      const thirtyFiveDaysAgo = new Date();
      thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);

      // 1. Discard all blood samples older than 35 days that are not already discarded
      const expiredBags = await mainDb.bloodSample.updateMany({
        where: {
          collected_at: {
            lte: thirtyFiveDaysAgo
          },
          status: {
            notIn: ['discarded']
          }
        },
        data: {
          status: 'discarded',
          health_notes: 'Automatically discarded: Expired (exceeded 35 days shelf life)'
        }
      });

      if (expiredBags.count > 0) {
        console.log(`[Scheduler] Automatically expired and discarded ${expiredBags.count} blood bags.`);
      } else {
        console.log('[Scheduler] Expiration check completed. No expired bags found.');
      }

      // 2. Alert inventory (via WebSockets) for blood bags with exactly 5 days left until expiration (collected between 30 and 31 days ago)
      const fiveDaysBeforeExpiry = new Date();
      fiveDaysBeforeExpiry.setDate(fiveDaysBeforeExpiry.getDate() - 30);
      const sixDaysBeforeExpiry = new Date();
      sixDaysBeforeExpiry.setDate(sixDaysBeforeExpiry.getDate() - 31);

      const expiringBags = await mainDb.bloodSample.findMany({
        where: {
          collected_at: {
            lte: fiveDaysBeforeExpiry,
            gte: sixDaysBeforeExpiry
          },
          status: {
            in: ['collected', 'validated', 'pending_lab']
          }
        }
      });

      for (const bag of expiringBags) {
        const warningMsg = `⚠️ [EXPIRY ALERT]: Blood bag ID ${bag.id.substring(0, 8)} (${bag.blood_type}) is expiring in 5 days! Please prioritize usage/dispatch of this bag beforehand.`;
        io.emit('expiry_warning', {
          id: bag.id,
          blood_type: bag.blood_type,
          message: warningMsg
        });
        console.log(`[Scheduler] Broadcasted 5-day expiry warning for bag ID: ${bag.id}`);
      }
    } catch (err) {
      console.error('[Scheduler Error] Expiration check failed:', err.message);
    }
  }

  // Check bag expiry every 24 hours, and run once 8 seconds after startup
  setInterval(runAutoExpiryCheck, 24 * 60 * 60 * 1000);
  setTimeout(runAutoExpiryCheck, 8000);

  // Background SMS retry queue worker
  async function runSmsQueueWorker() {
    try {
      const failedSms = await mainDb.smsQueue.findMany({
        where: {
          status: 'failed',
          retry_count: { lt: 5 }
        }
      });

      if (failedSms.length === 0) return;

      console.log(`[SMS Queue Worker] Found ${failedSms.length} messages in retry queue.`);
      const apiKey = process.env.SMS_ETHIOPIA_KEY;

      for (const sms of failedSms) {
        try {
          console.log(`[SMS Queue Worker] Retrying SMS delivery to ${sms.phone}...`);
          
          if (!apiKey || apiKey === 'mock-key') {
            await mainDb.smsQueue.update({
              where: { id: sms.id },
              data: { status: 'sent', retry_count: sms.retry_count + 1 }
            });
            console.log(`[SMS Queue Worker] Successfully sent (mocked) message ID: ${sms.id}`);
            continue;
          }

          const response = await fetch('https://smsethiopia.com/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'KEY': apiKey
            },
            body: JSON.stringify({
              msisdn: sms.phone.replace('+', '').replace(/^0/, '251'),
              text: sms.message
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} response: ${errorText}`);
          }

          await mainDb.smsQueue.update({
            where: { id: sms.id },
            data: { status: 'sent', retry_count: sms.retry_count + 1 }
          });
          console.log(`[SMS Queue Worker] Successfully sent message ID: ${sms.id}`);
        } catch (retryErr) {
          console.error(`[SMS Queue Worker] Retry failed for ID: ${sms.id}:`, retryErr.message);
          await mainDb.smsQueue.update({
            where: { id: sms.id },
            data: { 
              retry_count: sms.retry_count + 1,
              last_error: retryErr.message
            }
          });
        }
      }
    } catch (err) {
      console.error('[SMS Queue Worker Error]:', err.message);
    }
  }

  // Run SMS retry worker immediately, and then every 30 seconds
  runSmsQueueWorker();
  setInterval(runSmsQueueWorker, 30000);
});

