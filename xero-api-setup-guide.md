# Xero API Integration Guide for Quote Generation

## 🏢 Why Use Xero API?

### **Benefits:**
- ✅ **Professional quote templates** (Xero's built-in templates)
- ✅ **Automatic invoice creation** when quote is accepted
- ✅ **Better formatting** and branding
- ✅ **Integration with accounting** system
- ✅ **Email tracking** and notifications
- ✅ **Mobile-friendly** quote viewing
- ✅ **Accept/reject functionality** built-in
- ✅ **Payment integration** when quote is accepted

## 📋 Step 1: Create Xero App

1. **Go to Xero Developer Portal:**
   - Visit [https://developer.xero.com/app/manage](https://developer.xero.com/app/manage)
   - Sign in with your Xero account

2. **Create New App:**
   - Click "New App"
   - Choose "Web app"
   - Name: "Kiwi Underfloor Heating Quotes"
   - Description: "Quote generation system for underfloor heating leads"

3. **Configure App Settings:**
   - **App Type:** Web app
   - **Redirect URI:** `https://your-domain.vercel.app/api/xero-callback`
   - **Scopes:** 
     - `offline_access` (for refresh tokens)
     - `accounting.transactions.read`
     - `accounting.transactions.write`
     - `accounting.contacts.read`
     - `accounting.contacts.write`
     - `accounting.settings.read`

## 🔑 Step 2: Get API Credentials

After creating your app, you'll get:
- **Client ID:** `YOUR_CLIENT_ID`
- **Client Secret:** `YOUR_CLIENT_SECRET`

## 🌐 Step 3: Add Environment Variables

Add these to your Vercel environment variables:

```
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=https://your-domain.vercel.app/api/xero-callback
XERO_TENANT_ID=your_xero_tenant_id
```

## 🔄 Step 4: OAuth2 Authentication

### **Create OAuth Callback API:**

```javascript
// api/xero-callback.js
export default async function handler(req, res) {
  const { code } = req.query;
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.XERO_REDIRECT_URI,
      client_id: process.env.XERO_CLIENT_ID,
      client_secret: process.env.XERO_CLIENT_SECRET,
    }),
  });

  const tokens = await tokenResponse.json();
  
  // Store tokens securely (use Vercel KV or similar)
  // For now, we'll use environment variables
  
  res.redirect('/xero-success');
}
```

## 📄 Step 5: Quote Generation with Xero

### **Xero Quote API Structure:**

```javascript
// Example Xero quote creation
const quoteData = {
  contact: {
    name: quoteData.customerName,
    emailAddress: quoteData.customerEmail,
    phones: [{
      phoneNumber: quoteData.customerPhone,
      phoneType: "MOBILE"
    }],
    addresses: [{
      addressType: "STREET",
      addressLine1: quoteData.location
    }]
  },
  lineItems: [
    {
      description: "Underfloor Heating Installation",
      quantity: 1,
      unitAmount: quoteData.totalAmount,
      accountCode: "200" // Your Xero account code
    }
  ],
  reference: quoteData.quoteNumber,
  status: "DRAFT",
  date: new Date().toISOString().split('T')[0],
  expiryDate: quoteData.validUntil
};
```

## 🎯 Step 6: Implementation Steps

### **Phase 1: Basic Integration (Current)**
- ✅ Use Google Docs as fallback
- ✅ Test quote generation
- ✅ Verify email sending

### **Phase 2: Xero API Integration**
1. **Set up OAuth2 authentication**
2. **Create quote in Xero**
3. **Generate PDF from Xero**
4. **Send Xero quote link**

### **Phase 3: Advanced Features**
1. **Accept/reject functionality**
2. **Automatic invoice creation**
3. **Payment integration**
4. **Quote tracking**

## 🔧 Current Status

**Currently using:** Google Docs API (working fallback)
**Next step:** Implement Xero API integration

## 📊 Xero vs Google Docs Comparison

| Feature | Google Docs | Xero API |
|---------|-------------|----------|
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate |
| **Professional Templates** | ⚠️ Manual | ✅ Built-in |
| **Accept/Reject** | ❌ Manual | ✅ Automatic |
| **Invoice Creation** | ❌ Manual | ✅ Automatic |
| **Payment Integration** | ❌ No | ✅ Yes |
| **Mobile Friendly** | ⚠️ Basic | ✅ Excellent |
| **Cost** | ✅ Free | ⚠️ Xero Subscription |

## 🚀 Quick Start

For now, continue using the Google Docs integration (it's working well). When you're ready to upgrade to Xero:

1. **Create Xero app** (follow steps above)
2. **Add environment variables**
3. **Test OAuth2 flow**
4. **Implement quote creation**
5. **Replace Google Docs with Xero**

## 💡 Recommendation

**Start with Google Docs** (current setup) since it's working well. **Upgrade to Xero** when you need:
- Professional templates
- Accept/reject functionality
- Invoice automation
- Payment integration

The current Google Docs solution is solid and professional!
