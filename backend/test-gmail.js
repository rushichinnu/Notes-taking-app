// Use default import for nodemailer 7.x
const nodemailer = require("nodemailer").default || require("nodemailer");
require("dotenv").config();

async function testGmail() {
  console.log("Testing Gmail SMTP connection...");
  console.log("Email User:", process.env.EMAIL_USER);
  console.log("Email Host:", process.env.EMAIL_HOST);
  console.log("Email Port:", process.env.EMAIL_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // Test connection
    console.log("Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ Gmail SMTP connection successful");

    // Send test email
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email - Notes App",
      text: "This is a test email. If you receive this, your Gmail SMTP is working!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email Success!</h2>
          <p>If you receive this email, your Gmail SMTP configuration is working correctly.</p>
          <p>Your Notes App can now send OTP verification emails.</p>
        </div>
      `,
    });

    console.log("✅ Test email sent successfully:", info.messageId);
    console.log(
      "Check your email inbox (and spam folder) for the test message."
    );
  } catch (error) {
    console.error("❌ Gmail SMTP error:", error.message);

    // Common error solutions
    if (error.message.includes("Invalid login")) {
      console.log("💡 Solution: Check your Gmail app password in .env file");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Solution: Check internet connection or try port 465");
    }

    console.error("Full error details:", error);
  }
}

testGmail()
  .then(() => {
    console.log("Test completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
