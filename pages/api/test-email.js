// pages/api/test-email.js - Test email API
import { sendEmail } from '../../lib/emailHelper.js';

export default async function handler(req, res) {
    const { GMAIL_USER, GMAIL_APP_PASSWORD, ADMIN_EMAIL } = process.env;

    if (req.method === 'POST') {
        try {
            console.log("📧 Starting test email...");
            
            // Environment checks
            console.log("🔧 Environment variables check:", {
                GMAIL_USER: GMAIL_USER || "MISSING",
                GMAIL_APP_PASSWORD: GMAIL_APP_PASSWORD ? "SET" : "MISSING",
                ADMIN_EMAIL: ADMIN_EMAIL || "MISSING"
            });

            if (!ADMIN_EMAIL) {
      console.error("❌ ADMIN_EMAIL not configured");
      return res.status(500).json({
        success: false,
        error: "ADMIN_EMAIL not configured"
      });
    }

    const testSubject = "🧪 Test Email - Kiwi Trade System";
    const testHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin: 20px 0;">Test Email from Kiwi Trade System</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Test Time:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</p>
          <p><strong>System:</strong> Kiwi Trade Lead Management</p>
          <p><strong>Status:</strong> Email system is working correctly</p>
          <p>If you receive this email, the Gmail SMTP configuration is working properly.</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated test email. Please ignore.
          </p>
        </div>
      </div>
    `;

    console.log(`📤 Sending test email to: ${process.env.ADMIN_EMAIL}`);
    const result = await sendEmail(process.env.ADMIN_EMAIL, testSubject, testHtml);
    
    if (result.success) {
      console.log(`✅ Test email sent successfully, msgId: ${result.messageId}`);
      return res.status(200).json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
        to: process.env.ADMIN_EMAIL
      });
    } else {
      console.error(`❌ Test email failed: ${result.error}`);
      return res.status(500).json({
        success: false,
        error: "Test email failed",
        details: result.error
      });
    }

  } catch (error) {
    console.error('Failed to send test email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
} else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
}
