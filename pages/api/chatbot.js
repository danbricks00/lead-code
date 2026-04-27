// pages/api/chatbot.js - Chatbot API endpoint
const chatbotRateLimitStore = new Map();
const CHATBOT_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const lastRequestAt = chatbotRateLimitStore.get(clientIp) || 0;

    if (now - lastRequestAt < CHATBOT_RATE_LIMIT_WINDOW_MS) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again in a minute.'
      });
    }

    chatbotRateLimitStore.set(clientIp, now);

    // Clean up stale entries to keep memory usage bounded.
    for (const [ip, timestamp] of chatbotRateLimitStore.entries()) {
      if (now - timestamp >= CHATBOT_RATE_LIMIT_WINDOW_MS) {
        chatbotRateLimitStore.delete(ip);
      }
    }

    const { message } = req.body;
    const cc = (process.env.TRADESPERSON_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    const bcc = (process.env.TRADES_LEAD_BCC || process.env.ADMIN_EMAIL || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log("🤖 Chatbot received message:", message);
    console.log(`🤖 Chatbot lead routing (used by /api/lead-intake): cc=${cc || 'none'} bcc=${bcc || 'none'}`);

    // Simple chatbot logic - you can expand this
    let response;

    // Check if this is a timeline-related question or response
    if (message.toLowerCase().includes('timeframe') || 
        message.toLowerCase().includes('timeline') || 
        message.toLowerCase().includes('when') ||
        message.toLowerCase().includes('time')) {
      
      // Return timeline options as buttons
      response = {
        success: true,
        type: 'timeline',
        question: 'When do you need the work done?',
        options: [
          { label: 'ASAP', value: 'ASAP' },
          { label: '1–2 Weeks', value: '1-2 Weeks' },
          { label: '1 Month+', value: '1 Month+' }
        ]
      };
    } else if (message.toLowerCase().includes('budget') || 
               message.toLowerCase().includes('cost') ||
               message.toLowerCase().includes('price')) {
      
      // Return budget options as buttons
      response = {
        success: true,
        type: 'budget',
        question: 'What is your budget range?',
        options: [
          { label: '< $500', value: '< $500' },
          { label: '$500–$1000', value: '$500–$1000' },
          { label: '$1000+', value: '$1000+' }
        ]
      };
    } else if (message.toLowerCase().includes('service') || 
               message.toLowerCase().includes('what') ||
               message.toLowerCase().includes('help')) {
      
      // Return service options as buttons
      response = {
        success: true,
        type: 'options',
        question: 'What service do you need?',
        options: [
          { label: 'Underfloor Heating', value: 'underfloor_heating' },
          { label: 'Kitchen Renovation', value: 'kitchen_renovation' },
          { label: 'Bathroom Renovation', value: 'bathroom_renovation' },
          { label: 'Plumbing', value: 'plumbing' },
          { label: 'Electrical', value: 'electrical' },
          { label: 'Other', value: 'other' }
        ]
      };
    } else {
      // Default text response
      response = {
        success: true,
        type: 'text',
        response: 'Thank you for your message. How can I help you with your project today?'
      };
    }

    console.log("🤖 Chatbot response:", response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Chatbot API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
