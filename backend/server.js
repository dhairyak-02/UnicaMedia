require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= SMTP CONFIG ================= */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/* ================= CONTACT FORM ENDPOINT ================= */

app.post("/api/contact", async (req, res) => {
  const {
    name,
    company,
    email,
    phone,
    service,
    message,
    source
  } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  try {
    await transporter.sendMail({
      from: `"Unica Media Website" <${process.env.SMTP_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `New Website Enquiry (${source || "Website"})`,
      html: `
        <h2>New Enquiry Received</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Company</strong></td><td>${company || "-"}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone || "-"}</td></tr>
          <tr><td><strong>Service</strong></td><td>${service || "-"}</td></tr>
          <tr><td><strong>Source</strong></td><td>${source || "Unknown"}</td></tr>
          <tr><td><strong>Message</strong></td><td>${message}</td></tr>
        </table>
      `
    });

    res.json({ success: true });

  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

/* ================= HEALTH CHECK (RENDER) ================= */

app.get("/", (req, res) => {
  res.send("Unica Media backend is running.");
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
