import { addQuote, getQuoteById, updateQuoteStatus, getAllQuotes, getQuotesByCustomer, getQuotesByTradesman } from './quote-database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePostRequest(req, res);
      case 'GET':
        return await handleGetRequest(req, res);
      case 'PUT':
        return await handlePutRequest(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Quote API error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote operation failed',
      details: error.message
    });
  }
}

async function handlePostRequest(req, res) {
  const { action } = req.query;
  const { body } = req;

  switch (action) {
    case 'generate':
      return await generateQuote(req, res);
    case 'list':
      return await listQuotes(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action specified' });
  }
}

async function handleGetRequest(req, res) {
  const { quoteId, customerEmail, tradesmanEmail } = req.query;

  if (quoteId) {
    return await getQuote(req, res);
  } else if (customerEmail) {
    return await getCustomerQuotes(req, res);
  } else if (tradesmanEmail) {
    return await getTradesmanQuotes(req, res);
  } else {
    return await getAllQuotesList(req, res);
  }
}

async function handlePutRequest(req, res) {
  const { action } = req.query;
  
  switch (action) {
    case 'status':
      return await updateQuote(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action specified' });
  }
}

async function generateQuote(req, res) {
  try {
    const {
      leadId,
      customerEmail,
      customerName,
      serviceType,
      projectDetails,
      quoteAmount,
      assignedTradesman
    } = req.body;

    console.log('📝 Generating quote for:', customerEmail);

    if (!customerEmail || !customerName || !serviceType || !quoteAmount) {
      return res.status(400).json({
        success: false,
        error: 'Customer email, name, service type, and quote amount are required'
      });
    }

    const quoteData = {
      leadId,
      customerEmail,
      customerName,
      serviceType,
      projectDetails: projectDetails || '',
      quoteAmount: parseFloat(quoteAmount),
      assignedTradesman: assignedTradesman || ''
    };

    const newQuote = await addQuote(quoteData);

    if (newQuote) {
      console.log('✅ Quote generated successfully:', newQuote.quoteId);
      return res.json({
        success: true,
        message: 'Quote generated successfully',
        quote: newQuote
      });
    } else {
      console.log('❌ Failed to generate quote');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate quote'
      });
    }
  } catch (error) {
    console.error('❌ Generate quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote generation failed',
      details: error.message
    });
  }
}

async function getQuote(req, res) {
  try {
    const { quoteId } = req.query;
    console.log('📋 Getting quote:', quoteId);

    if (!quoteId) {
      return res.status(400).json({
        success: false,
        error: 'Quote ID is required'
      });
    }

    const quote = await getQuoteById(quoteId);

    if (quote) {
      console.log('✅ Quote retrieved:', quote.quoteId);
      return res.json({
        success: true,
        quote: quote
      });
    } else {
      console.log('❌ Quote not found:', quoteId);
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }
  } catch (error) {
    console.error('❌ Get quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quote',
      details: error.message
    });
  }
}

async function updateQuote(req, res) {
  try {
    const { quoteId } = req.query;
    const { status, response } = req.body;

    console.log('📝 Updating quote status:', { quoteId, status });

    if (!quoteId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Quote ID and status are required'
      });
    }

    const updatedQuote = await updateQuoteStatus(quoteId, status, response);

    if (updatedQuote) {
      console.log('✅ Quote status updated:', quoteId, status);
      return res.json({
        success: true,
        message: 'Quote status updated successfully',
        quote: updatedQuote
      });
    } else {
      console.log('❌ Failed to update quote status:', quoteId);
      return res.status(500).json({
        success: false,
        error: 'Failed to update quote status'
      });
    }
  } catch (error) {
    console.error('❌ Update quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote update failed',
      details: error.message
    });
  }
}

async function listQuotes(req, res) {
  try {
    const { filter, value } = req.body;
    console.log('📋 Listing quotes with filter:', filter, value);

    let quotes = [];

    switch (filter) {
      case 'customer':
        quotes = await getQuotesByCustomer(value);
        break;
      case 'tradesman':
        quotes = await getQuotesByTradesman(value);
        break;
      case 'status':
        const allQuotes = await getAllQuotes();
        quotes = allQuotes.filter(quote => quote.status === value);
        break;
      default:
        quotes = await getAllQuotes();
    }

    console.log(`✅ Retrieved ${quotes.length} quotes`);
    return res.json({
      success: true,
      quotes: quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('❌ List quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list quotes',
      details: error.message
    });
  }
}

async function getCustomerQuotes(req, res) {
  try {
    const { customerEmail } = req.query;
    console.log('📋 Getting customer quotes:', customerEmail);

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Customer email is required'
      });
    }

    const quotes = await getQuotesByCustomer(customerEmail);
    console.log(`✅ Retrieved ${quotes.length} quotes for customer`);

    return res.json({
      success: true,
      quotes: quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('❌ Get customer quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer quotes',
      details: error.message
    });
  }
}

async function getTradesmanQuotes(req, res) {
  try {
    const { tradesmanEmail } = req.query;
    console.log('📋 Getting tradesman quotes:', tradesmanEmail);

    if (!tradesmanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Tradesman email is required'
      });
    }

    const quotes = await getQuotesByTradesman(tradesmanEmail);
    console.log(`✅ Retrieved ${quotes.length} quotes for tradesman`);

    return res.json({
      success: true,
      quotes: quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('❌ Get tradesman quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tradesman quotes',
      details: error.message
    });
  }
}

async function getAllQuotesList(req, res) {
  try {
    console.log('📋 Getting all quotes');
    const quotes = await getAllQuotes();
    console.log(`✅ Retrieved ${quotes.length} total quotes`);

    return res.json({
      success: true,
      quotes: quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('❌ Get all quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quotes',
      details: error.message
    });
  }
} 