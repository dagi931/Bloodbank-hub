const { mainDb } = require("../config/prisma");

async function logAction(userId, action, details, ipAddress = "127.0.0.1") {
  try {
    await mainDb.auditLog.create({
      data: {
        user_id: userId,

        action,

        details,

        ip_address: ipAddress,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOGGER ERROR]:", err.message);
  }
}

module.exports = { logAction };
