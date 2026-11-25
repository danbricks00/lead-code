/**
 * Smart Email Validation + Autocorrect Utility
 * Handles common typos and supports NZ/UK/AU domains with MX checking
 */

import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS functions for async/await
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolve4 = promisify(dns.resolve4);

// Common typo corrections for popular email providers
const commonProviders = {
  // Gmail typos
  "gamil": "gmail",
  "gmal": "gmail", 
  "gmial": "gmail",
  "gnail": "gmail",
  "gmai": "gmail",
  "gmaill": "gmail",
  "gmaile": "gmail",
  "gmiall": "gmail",

  // Outlook typos
  "outllook": "outlook",
  "otlook": "outlook",
  "outlok": "outlook",
  "outllok": "outlook",
  "outloook": "outlook",
  "outlok": "outlook",
  "outlokk": "outlook",
  "outllok": "outlook",

  // Hotmail typos
  "hotmial": "hotmail",
  "hotmil": "hotmail",
  "hotmai": "hotmail",
  "htomail": "hotmail",
  "hotameil": "hotmail",
  "hotmaill": "hotmail",
  "hotmaile": "hotmail",

  // Yahoo typos
  "yaho": "yahoo",
  "yhoo": "yahoo",
  "yahoos": "yahoo",
  "yhaoo": "yahoo",
  "yaoo": "yahoo",
  "yahooo": "yahoo",
  "yahooe": "yahoo",

  // NZ ISP addresses (keep as-is)
  "xtra": "xtra",           // xtra.co.nz
  "vodafone": "vodafone",   // vodafone.co.nz
  "btinternet": "btinternet", // btinternet.co.uk
  "orcon": "orcon",         // orcon.net.nz
  "slingshot": "slingshot", // slingshot.co.nz
  "spark": "spark",         // spark.co.nz
  
  // NZ ISP common typos
  "xtr": "xtra",
  "xtraa": "xtra",
  "vodaphone": "vodafone",
  "voda": "vodafone",
  "sparkk": "spark",
  "sparknz": "spark",
  "slinghot": "slingshot",
  "orconn": "orcon",

  // AU ISP addresses (keep as-is)
  "bigpond": "bigpond",     // bigpond.com.au
  "optus": "optus",         // optusnet.com.au
  "telstra": "telstra",     // telstra.com.au
  "iinet": "iinet",         // iinet.net.au
  "tpg": "tpg",             // tpg.com.au
  "dodo": "dodo",           // dodo.com.au
  "exetel": "exetel",       // exetel.com.au
  "internode": "internode", // internode.on.net
  
  // AU ISP common typos
  "bigpon": "bigpond",
  "bigpnd": "bigpond",
  "bigpnd": "bigpond",
  "optusnet": "optus",
  "optusn": "optus",
  "telstr": "telstra",
  "telstr": "telstra",
  "iinet": "iinet",
  "iinet": "iinet",
  "tpgg": "tpg",
  "dodoo": "dodo",
  "exetl": "exetel",
  "internod": "internode"
};

/**
 * List of disposable/temporary email domains to block
 * These are commonly used for spam and should be rejected
 */
const disposableDomains = [
  "mailinator.com", "yopmail.com", "10minutemail.com",
  "guerrillamail.com", "temp-mail.org", "fakemail.net",
  "trashmail.com", "getnada.com", "dispostable.com", "mintemail.com",
  // Additional domains
  "0815.ru", "0clickemail.com", "0wnd.net", "0wnd.org",
  "20minutemail.com", "2prong.com", "30minutemail.com", "4warding.com",
  "4warding.net", "4warding.org", "60minutemail.com", "675hosting.com",
  "675hosting.net", "675hosting.org", "6url.com", "75hosting.com",
  "75hosting.net", "75hosting.org", "7tags.com", "9ox.net",
  "a-bc.net", "afrobacon.com", "ajaxapp.net", "amilegit.com",
  "amiri.net", "amiriindustries.com", "anonbox.net", "anonymbox.com",
  "antichef.com", "antichef.net", "antispam.de", "beefmilk.com",
  "binkmail.com", "bio-muesli.net", "bobmail.info", "bofthew.com",
  "brefmail.com", "broadbandninja.com", "bsnow.net", "bugmenot.com",
  "bumpymail.com", "casualdx.com", "centermail.com", "centermail.net",
  "chogmail.com", "choicemail1.com", "cool.fr.nf", "correo.blogos.net",
  "cosmorph.com", "courriel.fr.nf", "courrieltemporaire.com", "cubiclink.com",
  "curryworld.de", "cust.in", "dacoolest.com", "dandikmail.com",
  "dayrep.com", "deadaddress.com", "deadspam.com", "despam.it",
  "despammed.com", "devnullmail.com", "dfgh.net", "digitalsanctuary.com",
  "discardmail.com", "discardmail.de", "disposableaddress.com", "disposeamail.com",
  "disposemail.com", "dodgeit.com", "dodgit.com", "dodgit.org",
  "donemail.ru", "dontreg.com", "dontsendmespam.de", "dump-email.info",
  "dumpandjunk.com", "dumpmail.de", "dumpyemail.com", "e4ward.com",
  "email60.com", "emaildienst.de", "emailias.com", "emailigo.de",
  "gmailnator.com", "maildrop.cc", "33mail.com",
  // Note: ProtonMail (pm.me, proton.me, protonmail.ch, protonmail.com) removed - legitimate email provider
  // Additional temporary email domains
  "1secmail.com", "1secmail.net", "1secmail.org",
  "addy.io", "altmails.com", "anonaddy.com", "anonaddy.me",
  "burnermail.io", "cryptogmail.com", "duck.com",
  "emailnator.com", "emailondeck.com", "emailtemp.org",
  "fakermail.com", "fastmail.com", "firemail.cc",
  "forwardemail.net", "getairmail.com", "hide.biz.st",
  "hidemail.pro", "inboxalias.com", "inboxkitten.com",
  "instant-mail.de", "kopeechka.store", "mail.tm",
  "mailforspam.com", "mailpoof.com", "mailsac.com",
  "mohmal.com", "mohmal.im", "mohmal.in",
  "moakt.co", "moakt.ws", "muellmail.com",
  "nada.email", "nada.ltd", "notmyemail.tech",
  "onetimeemail.net", "pokemail.net", "privymail.com",
  "quickmail.best", "randomail.net", "receivemail.org",
  "sharklasers.com", "simplelogin.co", "simplelogin.io",
  "spambox.xyz", "spamgourmet.com", "spamgourmet.net",
  "spamhereplease.com", "spammail.xyz", "tempemail.co",
  "tempmail.dev", "tempmail.plus", "tempmailo.com",
  "tempr.email", "throwawaymail.com", "throwmail.app",
  "tmpmail.org", "trashmail.io", "trashmail.ws",
  "vomoto.com", "wegwerfmail.de", "wegwerfmail.net",
  "yomail.info", "zeroe.ml"
];

/**
 * Checks if an email domain is in the disposable domains list
 * @param {string} email - Email to check
 * @returns {boolean} - True if domain is disposable
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const trimmedEmail = email.trim().toLowerCase();
  const parts = trimmedEmail.split("@");
  
  if (parts.length !== 2) return false;
  
  const domain = parts[1].toLowerCase();
  return disposableDomains.includes(domain);
}

/**
 * Validates email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid format
 */
export function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex - more permissive than strict RFC
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Autocorrects common email provider typos
 * @param {string} email - Email to autocorrect
 * @returns {string} - Corrected email
 */
export function autocorrectEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  const trimmedEmail = email.trim().toLowerCase();
  const parts = trimmedEmail.split("@");
  
  if (parts.length !== 2) return email;
  
  const [local, domain] = parts;
  const domainParts = domain.split(".");
  
  if (domainParts.length < 2) return email;
  
  const provider = domainParts[0].toLowerCase();
  const tld = domainParts.slice(1).join(".");
  
  const correctedProvider = commonProviders[provider] || provider;
  
  // Only return corrected email if provider was actually corrected
  if (correctedProvider !== provider) {
    return `${local}@${correctedProvider}.${tld}`;
  }
  
  return email;
}

/**
 * Checks MX/DNS records for domain validation
 * @param {string} domain - Domain to check
 * @returns {Promise<object>} - MX check result
 */
export async function checkDomainMX(domain) {
  try {
    // Try MX record first
    const mxRecords = await dnsResolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return {
        hasMX: true,
        hasDNS: true,
        mxRecords: mxRecords,
        error: null
      };
    }
  } catch (mxError) {
    // If MX fails, try A record as fallback
    try {
      const aRecords = await dnsResolve4(domain);
      if (aRecords && aRecords.length > 0) {
        return {
          hasMX: false,
          hasDNS: true,
          aRecords: aRecords,
          error: null
        };
      }
    } catch (aError) {
      return {
        hasMX: false,
        hasDNS: false,
        error: `No MX or A records found for ${domain}`
      };
    }
  }
  
  return {
    hasMX: false,
    hasDNS: false,
    error: `No MX or A records found for ${domain}`
  };
}

/**
 * Validates and autocorrects email with optional MX checking
 * @param {string} email - Email to validate and correct
 * @param {boolean} checkMX - Whether to perform MX/DNS check
 * @returns {Promise<object>} - Validation result with corrections and MX status
 */
export async function validateAndCorrectEmail(email, checkMX = true) {
  const originalEmail = email?.trim();
  
  if (!originalEmail) {
    return {
      isValid: false,
      originalEmail: originalEmail,
      correctedEmail: null,
      needsCorrection: false,
      error: 'Email is required',
      mxValid: null,
      mxError: null,
      isDisposable: false
    };
  }
  
  // Check if format is valid
  if (!isValidEmailFormat(originalEmail)) {
    return {
      isValid: false,
      originalEmail: originalEmail,
      correctedEmail: null,
      needsCorrection: false,
      error: 'Invalid email format. Please enter a valid email address.',
      mxValid: null,
      mxError: null,
      isDisposable: false
    };
  }
  
  // Check for disposable/temporary email domains BEFORE autocorrect
  // This prevents spam from disposable email services
  if (isDisposableEmail(originalEmail)) {
    return {
      isValid: false,
      originalEmail: originalEmail,
      correctedEmail: null,
      needsCorrection: false,
      error: '⚠️ Temporary or disposable email addresses are not allowed. Please use a personal or business email (e.g. name@gmail.com, name@outlook.com).',
      mxValid: null,
      mxError: null,
      isDisposable: true
    };
  }
  
  // Try to autocorrect
  const correctedEmail = autocorrectEmail(originalEmail);
  const needsCorrection = correctedEmail.toLowerCase() !== originalEmail.toLowerCase();
  
  // Check disposable domains again on corrected email (in case autocorrect changed domain)
  if (isDisposableEmail(correctedEmail)) {
    return {
      isValid: false,
      originalEmail: originalEmail,
      correctedEmail: correctedEmail,
      needsCorrection: needsCorrection,
      error: '⚠️ Temporary or disposable email addresses are not allowed. Please use a personal or business email (e.g. name@gmail.com, name@outlook.com).',
      mxValid: null,
      mxError: null,
      isDisposable: true
    };
  }
  
  // Extract domain for MX check
  const domain = correctedEmail.split('@')[1];
  let mxResult = { hasMX: null, hasDNS: null, error: null };
  
  // Perform MX check if requested
  if (checkMX && domain) {
    try {
      mxResult = await checkDomainMX(domain);
    } catch (error) {
      mxResult = {
        hasMX: false,
        hasDNS: false,
        error: `MX check failed: ${error.message}`
      };
    }
  }
  
  return {
    isValid: true,
    originalEmail: originalEmail,
    correctedEmail: correctedEmail,
    needsCorrection: needsCorrection,
    error: null,
    mxValid: mxResult.hasMX || mxResult.hasDNS,
    mxError: mxResult.error,
    domain: domain,
    isDisposable: false
  };
}

/**
 * Logs email validation results
 * @param {string} prefix - Log prefix (e.g., 'EMAIL_VALIDATION')
 * @param {object} result - Validation result
 * @param {string} context - Additional context
 */
export function logEmailValidation(prefix, result, context = '') {
  const logData = {
    tag: `${prefix}_RESULT`,
    originalEmail: result.originalEmail,
    correctedEmail: result.correctedEmail,
    needsCorrection: result.needsCorrection,
    isValid: result.isValid,
    error: result.error,
    context: context,
    timestamp: new Date().toISOString()
  };

  // Add MX information if available
  if (result.mxValid !== null) {
    logData.mxValid = result.mxValid;
    logData.domain = result.domain;
  }
  
  if (result.mxError) {
    logData.mxError = result.mxError;
  }

  console.log(JSON.stringify(logData));

  // Log MX warnings separately if domain has no DNS
  if (result.mxValid === false && result.mxError) {
    console.log(JSON.stringify({
      tag: `${prefix}_MX_WARN`,
      email: result.correctedEmail,
      domain: result.domain,
      error: result.mxError,
      context: context,
      timestamp: new Date().toISOString()
    }));
  }
}
