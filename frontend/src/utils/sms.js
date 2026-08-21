const { mainDb } = require("../config/prisma");

// Helper to send SMS via SMSEthiopia API
async function sendSMS(phone, message, sampleId, type) {
  try {
    // 1. Strict safeguard: check if SMS already sent for this sample with this message type
    if (sampleId) {
      const checkLog = await mainDb.sentSmsLog.findUnique({
        where: {
          blood_sample_id_message_type: {
            blood_sample_id: sampleId,
            message_type: type,
          },
        },
      });

      if (checkLog) {
        console.log(
          `[SMS Safeguard] Blocked duplicate SMS of type '${type}' for sample ${sampleId}`,
        );
        return { success: false, reason: "Duplicate prevented" };
      }
    }

    const apiKey = process.env.SMS_ETHIOPIA_KEY;

    // Mock send if key is mock-key or not configured
    if (!apiKey || apiKey === "mock-key") {
      console.log(`\n======================================================`);
      console.log(`[SMS ETHIOPIA MOCK SEND]`);
      console.log(`Phone: ${phone}`);
      console.log(`Message: "${message}"`);
      console.log(`Type: ${type}`);
      console.log(`======================================================\n`);

      // Write to sent logs if sampleId is provided
      if (sampleId) {
        await mainDb.sentSmsLog.create({
          data: {
            phone,
            blood_sample_id: sampleId,
            message_type: type,
          },
        });
      }
      return { success: true, mock: true };
    }

    // Call real SMSEthiopia API
    const response = await fetch("https://smsethiopia.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        KEY: apiKey,
      },
      body: JSON.stringify({
        msisdn: phone.replace("+", "").replace(/^0/, "251"),
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} response: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("[SMSEthiopia Response]:", data);

    // Save log if sampleId is provided
    if (sampleId) {
      await mainDb.sentSmsLog.create({
        data: {
          phone,
          blood_sample_id: sampleId,
          message_type: type,
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[SMS Send Error]:", err.message);

    // Add to SmsQueue for offline/delivery retry queue
    try {
      await mainDb.smsQueue.create({
        data: {
          phone,
          message,
          status: "failed",
          last_error: err.message,
        },
      });
      console.log(
        `[SMS Queue] Enqueued failed SMS to ${phone} for later retry.`,
      );
    } catch (queueErr) {
      console.error("[SMS Queue DB Save Error]:", queueErr.message);
    }

    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };
