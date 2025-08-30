import { google } from "googleapis";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  const { action } = req.query;

  if (!action) {
    return res.status(400).json({ ok: false, error: "Missing action parameter" });
  }

  try {
    //
    // 🔹 Zone Lookup Action
    //
    if (action === "zone") {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ ok: false, error: "Missing address parameter" });
      }

      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const sheetId = process.env.GOOGLE_SHEET_ID;
      const range = "Zone!A:C";
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, error: "No data found in sheet" });
      }

      const suburbRow = rows.find(
        (row) => row[0]?.toLowerCase() === address.toLowerCase()
      );

      if (!suburbRow) {
        return res.status(404).json({ ok: false, error: "No matching suburb found" });
      }

      return res.status(200).json({
        ok: true,
        suburb: suburbRow[0],
        area: suburbRow[1],
        postcode: suburbRow[2],
      });
    }

    //
    // 🔹 Contact Form Action
    //
    if (action === "contact") {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed for Contact Form`);
      }

      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: "Missing required fields" });
      }

      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: process.env.CONTACT_TO,
        subject: "New Contact Form Submission",
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<p><b>Name:</b> ${name}</p>
               <p><b>Email:</b> ${email}</p>
               <p><b>Message:</b><br/>${message.replace(/\n/g, "<br/>")}</p>`,
      });

      return res.status(200).json({
        ok: true,
        message: "Message sent successfully",
      });
    }

    //
    // 🔹 Unknown Action
    //
    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
