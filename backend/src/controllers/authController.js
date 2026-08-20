const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { mainDb } = require("../config/prisma");
const { JWT_SECRET } = require("../middleware/auth");

// Helper to send transactional email using Brevo API
async function sendBrevoEmail(toEmail, code) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(
      `[Brevo Mock] No API Key set. Email to: ${toEmail} Code: ${code}`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Blood Bank Hub",
          email: "dagiderbe59@gmail.com",
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: "Blood Bank Hub - Email Verification Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto; background-color: #fafafa;">
            <h2 style="color: #ef233c; text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Blood Bank Hub</h2>
            <p style="font-size: 1rem; color: #333; line-height: 1.5;">Welcome to the Blood Bank & Emergency Response System!</p>
            <p style="font-size: 0.95rem; color: #555;">Use the following 6-digit verification code to complete your donor registration:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 28px; font-weight: 800; background: #ffffff; border: 1px dashed #ef233c; color: #ef233c; padding: 12px 24px; border-radius: 6px; letter-spacing: 4px; display: inline-block; font-family: monospace;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 0.8rem; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 15px; margin-top: 25px;">
              This code will expire in 10 minutes. If you did not request this registry profile, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brevo Error Response]:", errorText);
    } else {
      console.log(
        `[Brevo Email Sent] Verification code ${code} sent to ${toEmail}`,
      );
    }
  } catch (err) {
    console.error("[Brevo Email Send Error]:", err.message);
  }
}

async function sendForgotPasswordEmail(toEmail, code) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(
      `[Brevo Mock] No API Key set. Forgot Password Email to: ${toEmail} Code: ${code}`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Blood Bank Hub",
          email: "dagiderbe59@gmail.com",
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: "Blood Bank Hub - Password Reset Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto; background-color: #fafafa;">
            <h2 style="color: #ef233c; text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Blood Bank Hub</h2>
            <p style="font-size: 1rem; color: #333; line-height: 1.5;">You requested a password reset for your donor profile.</p>
            <p style="font-size: 0.95rem; color: #555;">Use the following 6-digit verification code to complete your password reset:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 28px; font-weight: 800; background: #ffffff; border: 1px dashed #ef233c; color: #ef233c; padding: 12px 24px; border-radius: 6px; letter-spacing: 4px; display: inline-block; font-family: monospace;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 0.8rem; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 15px; margin-top: 25px;">
              This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brevo Error Response]:", errorText);
    } else {
      console.log(
        `[Brevo Email Sent] Password reset code ${code} sent to ${toEmail}`,
      );
    }
  } catch (err) {
    console.error("[Brevo Email Send Error]:", err.message);
  }
}

// 1. Request verification: enter email -> sends 6-digit code
async function registerVerifyEmail(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if user already exists
    const userExists = await mainDb.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save code to database (upsert if they retry)
    await mainDb.emailVerification.upsert({
      where: { email },
      update: { code, expires_at: expiresAt, verified: false },
      create: { email, code, expires_at: expiresAt, verified: false },
    });

    // Send transactional email via Brevo
    await sendBrevoEmail(email, code);

    // Also fallback to print in server console log for debug
    console.log(`\n======================================================`);
    console.log(`[EMAIL SYSTEM VERIFICATION MOCK]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`======================================================\n`);

    res.json({
      message: "Verification code sent to email successfully.",
      code, // return in response for easy testing/automated scripts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during verification request" });
  }
}

// 2. Verify code
async function verifyCode(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required" });
  }

  try {
    const record = await mainDb.emailVerification.findUnique({
      where: { email },
    });
    if (!record) {
      return res
        .status(400)
        .json({ error: "No verification request found for this email" });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (new Date() > record.expires_at) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    // Update verified status
    await mainDb.emailVerification.update({
      where: { email },
      data: { verified: true },
    });

    res.json({ message: "Email verified successfully", verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during code verification" });
  }
}

// 3. Complete registration
async function registerComplete(req, res) {
  const {
    email,
    password,
    role,
    entityName,
    faydaId,
    name,
    phone,
    dob,
    gender,
    address,
    bloodType,
  } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password, and role are required" });
  }

  try {
    if (role === "donor") {
      // Confirm email verification was completed
      const record = await mainDb.emailVerification.findUnique({
        where: { email },
      });
      if (!record || !record.verified) {
        return res.status(400).json({
          error:
            "Email has not been verified yet. Run verification step first.",
        });
      }
    }

    const userCheck = await mainDb.user.findUnique({ where: { email } });
    if (userCheck) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Set entity name depending on role
    const finalEntityName =
      role === "donor" ? name : entityName || `${role.toUpperCase()} Entity`;

    // Only donors are auto-approved (validated via email). Workstations are pending admin approval.
    const status = role === "donor" ? "approved" : "pending";
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the User in database
    const newUser = await mainDb.user.create({
      data: {
        email,
        password_hash: passwordHash,
        role,
        status,
        entity_name: finalEntityName,
      },
    });

    // If role is donor, set up donor profile in PostgreSQL
    if (role === "donor") {
      const finalFaydaId =
        faydaId || `ET-${Math.floor(100000 + Math.random() * 900000)}`;
      const parsedDob = dob ? new Date(dob) : new Date("1995-01-01");

      // Check if donor is already in database (FAYDA registry import)
      const existingDonor = await mainDb.donor.findFirst({
        where: {
          OR: [{ fayda_id: finalFaydaId }, { phone: phone || "" }],
        },
      });

      if (existingDonor) {
        // Link existing profile to this user account
        await mainDb.donor.update({
          where: { fayda_id: existingDonor.fayda_id },
          data: {
            user_id: newUser.id,
            // Update details if they weren't in registry before
            name: name || existingDonor.name,
            dob: dob ? parsedDob : existingDonor.dob,
            gender: gender || existingDonor.gender,
            address: address || existingDonor.address,
            blood_type: bloodType || existingDonor.blood_type || "UNKNOWN",
          },
        });
      } else {
        // Create new donor profile
        await mainDb.donor.create({
          data: {
            fayda_id: finalFaydaId,
            name: name || "Anonymous Donor",
            phone:
              phone ||
              `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
            dob: parsedDob,
            gender: gender || "Male",
            address: address || "Addis Ababa",
            blood_type: bloodType || "UNKNOWN",
            points: 0,
            user_id: newUser.id,
          },
        });
      }
    }

    // Clear verification record
    if (role === "donor") {
      await mainDb.emailVerification.delete({ where: { email } });
    }

    res.status(201).json({
      message:
        status === "approved"
          ? "Registration successful"
          : "Registration pending Admin approval",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        entity_name: newUser.entity_name,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error during registration completion" });
  }
}

// 4. Login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await mainDb.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        error: `Your account status is currently ${user.status}. Please contact an administrator.`,
      });
    }

    // Attach donor profile ID/fayda_id if donor
    let donorProfile = null;
    if (user.role === "donor") {
      donorProfile = await mainDb.donor.findUnique({
        where: { user_id: user.id },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        entity_name: user.entity_name,
        fayda_id: donorProfile ? donorProfile.fayda_id : null,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        entity_name: user.entity_name,
        donor: donorProfile,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
}
// 5. Get current profile
async function getProfile(req, res) {
  try {
    const user = await mainDb.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        entity_name: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let donorProfile = null;
    if (user.role === "donor") {
      donorProfile = await mainDb.donor.findUnique({
        where: { user_id: user.id },
      });
    }

    res.json({
      user: {
        ...user,
        donor: donorProfile,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error retrieving profile" });
  }
}

// 6. FAYDA ID Lookup for registration demographics pre-population
async function faydaLookup(req, res) {
  const { faydaId } = req.params;
  try {
    const donor = await mainDb.donor.findUnique({
      where: { fayda_id: faydaId },
    });
    if (!donor) {
      return res.status(404).json({
        error: "FAYDA National ID not found. Please fill in details manually.",
      });
    }
    // Check if donor is already linked to a user account
    if (donor.user_id) {
      return res.status(400).json({
        error: "This FAYDA ID is already linked to an existing user account.",
      });
    }
    res.json(donor);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error during FAYDA profile retrieval." });
  }
}
// 7. Request password reset or reset ticket
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await mainDb.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ error: "No account registered with this email address." });
    }

    if (user.role === "donor") {
      // Donors use verification code reset flow
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      await mainDb.emailVerification.upsert({
        where: { email },
        update: { code, expires_at: expiresAt, verified: false },
        create: { email, code, expires_at: expiresAt, verified: false },
      });

      await sendForgotPasswordEmail(email, code);

      console.log(`\n======================================================`);
      console.log(`[PASSWORD RESET CODE MOCK]`);
      console.log(`To: ${email}`);
      console.log(`Reset Code: ${code}`);
      console.log(`Expires in: 10 minutes`);
      console.log(`======================================================\n`);

      return res.json({
        role: "donor",
        message: "Verification code sent to your email successfully.",
        code, // return in response for easy testing
      });
    } else {
      // Other roles use Admin reset ticket flow
      // Avoid duplicate pending requests
      const existingTicket = await mainDb.passwordResetRequest.findFirst({
        where: { user_id: user.id, status: "pending" },
      });

      if (existingTicket) {
        return res.json({
          role: user.role,
          message:
            "A password reset request is already pending with the system administrator. Please contact them.",
        });
      }

      await mainDb.passwordResetRequest.create({
        data: {
          user_id: user.id,
          email: user.email,
          role: user.role,
          entity_name: user.entity_name,
          status: "pending",
        },
      });

      return res.json({
        role: user.role,
        message:
          "A request has been sent to the system administrator to reset your password. Please contact the administrator.",
      });
    }
  } catch (err) {
    console.error("[authController] forgotPassword error:", err);
    res
      .status(500)
      .json({ error: "Server error during password reset request." });
  }
}

// 8. Donor reset password using code
async function resetPasswordDonor(req, res) {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, code, and newPassword are required" });
  }

  try {
    const record = await mainDb.emailVerification.findUnique({
      where: { email },
    });
    if (!record) {
      return res
        .status(400)
        .json({ error: "No verification request found for this email" });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (new Date() > record.expires_at) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await mainDb.user.update({
      where: { email },
      data: { password_hash: passwordHash },
    });

    // Clear verification record
    await mainDb.emailVerification.delete({ where: { email } });

    res.json({
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("[authController] resetPasswordDonor error:", err);
    res.status(500).json({ error: "Server error during password reset." });
  }
}

module.exports = {
  registerVerifyEmail,
  verifyCode,
  registerComplete,
  login,
  getProfile,
  faydaLookup,
  forgotPassword,
  resetPasswordDonor,
};
