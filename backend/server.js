require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

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
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Unica Media Website",
          email: "dkk080504@gmail.com"
        },
        to: [
          { email: process.env.RECEIVER_EMAIL }
        ],
        replyTo: {
          email: email,
          name: name
        },
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

    res.json({ success: true });

  } catch (error) {
    console.error("Brevo API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send email" });
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
