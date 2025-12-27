require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= LEAD STORAGE ================= */

const LEADS_FILE = path.join(__dirname, "leads.json");

function saveLead(data) {
  let leads = [];
  if (fs.existsSync(LEADS_FILE)) {
    leads = JSON.parse(fs.readFileSync(LEADS_FILE));
  }
  leads.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

/* ================= CONTACT FORM ================= */

app.post("/api/contact", async (req, res) => {
  const { name, company, email, phone, service, message, source } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  try {
    /* ---------- 1. ADMIN EMAIL ---------- */
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Unica Media Website",
          email: process.env.FROM_EMAIL
        },
        to: [{ email: process.env.RECEIVER_EMAIL }],
        replyTo: { email, name },
        subject: `New Website Enquiry (${source || "Website"})`,
        htmlContent: `
          <h2>New Enquiry Received</h2>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Company</strong></td><td>${company || "-"}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${phone || "-"}</td></tr>
            <tr><td><strong>Service</strong></td><td>${service || "-"}</td></tr>
            <tr><td><strong>Source</strong></td><td>${source || "-"}</td></tr>
            <tr><td><strong>Message</strong></td><td>${message}</td></tr>
          </table>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json"
        }
      }
    );

    /* ---------- 2. AUTO-REPLY EMAIL ---------- */
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Unica Media",
          email: process.env.FROM_EMAIL
        },
        to: [{ email, name }],
        subject: "We’ve received your enquiry – Unica Media",
        htmlContent: `
          <p>Hi ${name},</p>

          <p>Thank you for reaching out to <strong>Unica Media</strong>.</p>

          <p>We’ve received your enquiry regarding <strong>${service || "our services"}</strong>.
          Our team will review your message and get back to you shortly.</p>

          <p>If your matter is urgent, feel free to reply to this email.</p>

          <br />
          <p>Best regards,<br />
          <strong>Unica Media</strong><br />
          Film Production Audit & Advisory</p>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json"
        }
      }
    );

    /* ---------- 3. STORE LEAD ---------- */
    saveLead({ name, company, email, phone, service, message, source });

    res.json({ success: true });

  } catch (error) {
    console.error("Brevo API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to process request" });
  }
});

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.send("Unica Media backend is running.");
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
