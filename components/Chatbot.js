import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatMessage from './ChatMessage';
import { parseRoomNumber, handleRoomNumberInput } from '../utils/roomValidation';

// Email validation utility (inline for frontend)
const commonProviders = {
  // Gmail typos
  "gamil": "gmail", "gmal": "gmail", "gmial": "gmail", "gnail": "gmail", "gmai": "gmail",
  // Outlook typos
  "outllook": "outlook", "otlook": "outlook", "outlok": "outlook", "outllok": "outlook",
  // Hotmail typos
  "hotmial": "hotmail", "hotmil": "hotmail", "hotmai": "hotmail", "htomail": "hotmail",
  // Yahoo typos
  "yaho": "yahoo", "yhoo": "yahoo", "yahoos": "yahoo", "yhaoo": "yahoo", "yaoo": "yahoo",
  
  // NZ ISP domains and typos
  "xtra": "xtra", "xtr": "xtra", "xtraa": "xtra",
  "vodafone": "vodafone", "vodaphone": "vodafone", "voda": "vodafone",
  "spark": "spark", "sparkk": "spark", "sparknz": "spark",
  "slingshot": "slingshot", "slinghot": "slingshot",
  "orcon": "orcon", "orconn": "orcon",
  
  // AU ISP domains and typos (NEW)
  "bigpond": "bigpond", "bigpon": "bigpond", "bigpnd": "bigpond",
  "optus": "optus", "optusnet": "optus", "optusn": "optus",
  "telstra": "telstra", "telstr": "telstra",
  "iinet": "iinet",
  "tpg": "tpg", "tpgg": "tpg",
  "dodo": "dodo", "dodoo": "dodo",
  "exetel": "exetel", "exetl": "exetel",
  "internode": "internode", "internod": "internode"
};

// Add this list of disposable domains
const disposableDomains = [
  "mailinator.com", "yopmail.com", "10minutemail.com",
  "guerrillamail.com", "temp-mail.org", "fakemail.net",
  "trashmail.com", "getnada.com", "dispostable.com", "mintemail.com",
  // Additional domains to add
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
  "gmailnator.com", "maildrop.cc", "33mail.com", "e4ward.com",
  "pm.me", "proton.me", "protonmail.ch", "protonmail.com",
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

function validateEmailFrontend(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: "Please enter an email address" };
  }
  const trimmedEmail = email.trim().toLowerCase();

  // Stricter regex for validation - allows for domains like .co.nz
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email. The domain should only contain letters, numbers, and hyphens (e.g., name@example.com or name@example.co.nz)." };
  }
  
  // Check for disposable domains
  const parts = trimmedEmail.split("@");
  const [local, domain] = parts;
  const domainParts = domain.split(".");
  const provider = domainParts[0].toLowerCase();
  const tld = domainParts.slice(1).join(".");
  
  // Check if domain is in the disposable domains list
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: "⚠️ Temporary or disposable email addresses are not allowed. Please use a personal or business email (e.g. name@gmail.com, name@outlook.com)." };
  }
  
  // Check for common typos
  const correctedProvider = commonProviders[provider] || provider;
  
  if (correctedProvider !== provider) {
    const correctedEmail = `${local}@${correctedProvider}.${tld}`;
    return { valid: true, corrected: correctedEmail };
  }
  
  return { valid: true };
}

function autocorrectEmail(email) {
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
  if (correctedProvider !== provider) {
    return `${local}@${correctedProvider}.${tld}`;
  }
  return email;
}

const ProgressBar = ({ steps, currentStep, isCompleted, totalQuestions = 10, answered = 0, styles }) => {
    const progressPercentage = isCompleted ? 100 : Math.round((answered / totalQuestions) * 100);
    return (
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBarOuter}>
          <div 
            id="progressInner" 
            style={{
              ...styles.progressBarInner, 
              width: `${progressPercentage}%`
            }} 
            role="progressbar" 
            aria-valuemin="0" 
            aria-valuemax="100" 
            aria-valuenow={progressPercentage}
          ></div>
        </div>
        <div style={styles.progressLabel} id="progressLabel">
          {progressPercentage}% complete
        </div>
        <div style={styles.progressBarSteps}>
          {steps.map((step, index) => (
            <div key={index} style={{
              ...styles.progressStep,
              color: isCompleted || index <= currentStep ? '#4caf50' : '#ccc'
            }}>
              {isCompleted || index < currentStep ? '✔' : '●'} {step}
            </div>
          ))}
        </div>
      </div>
    );
  };

const Chatbot = ({ handleClose, handleReset }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState('welcome');
  const [leadData, setLeadData] = useState({ rooms: [] });
  const [zoneData, setZoneData] = useState([]); // Simplified to a single array of {suburb, area}
  const [suburbSearch, setSuburbSearch] = useState('');
  const [suburbSuggestions, setSuburbSuggestions] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [editingField, setEditingField] = useState(null); // Track which field is being edited
  const [emailCorrection, setEmailCorrection] = useState(null); // Track email correction suggestion
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 }); // Track window size for responsive styles
  const messagesEndRef = useRef(null);

  const progressSteps = ["Project Details", "Your Details", "Review & Submit"];
  const [progressStep, setProgressStep] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  
  // Calculate total questions dynamically based on room count
  const calculateTotalQuestions = () => {
    if (!leadData.roomCount) return 8; // Default if no room count yet
    
    const baseQuestions = 7; // ask_room_count, ask_timeline, ask_first_name, ask_last_name, ask_phone, ask_suburb, ask_email
    const roomQuestions = leadData.roomCount * 2; // ask_room_name + ask_room_dimensions for each room
    const finalSteps = 2; // review_data + submit (these don't call updateProgress but are part of the total flow)
    return baseQuestions + roomQuestions + finalSteps;
  };
  
  const totalQuestions = calculateTotalQuestions();

  // Update progress when room count changes
  useEffect(() => {
    // Recalculate total questions when room count changes
    const newTotal = calculateTotalQuestions();
    console.log(`🔄 Room count changed to ${leadData.roomCount}, new total questions: ${newTotal}`);
    // Don't update answeredQuestions here, just let the component re-render with new total
  }, [leadData.roomCount]);

  // Initial welcome message and window resize listener
  useEffect(() => {
    // Ensure proper viewport meta tag for mobile
    const ensureViewportMeta = () => {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    };
    
    ensureViewportMeta();
    
    // Set initial window size
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    
    // Handle keyboard open/close on mobile
    const handleKeyboardToggle = () => {
      // Small delay to allow viewport to adjust
      setTimeout(updateWindowSize, 100);
    };
    
    // Listen for viewport changes (keyboard open/close)
    window.addEventListener('resize', handleKeyboardToggle);
    window.addEventListener('orientationchange', handleKeyboardToggle);
    
    // This effect runs only once on component mount
    const startConversation = () => {
        addMessage("👋 Welcome to Heat.nz! We'll ask a couple of questions to prepare your underfloor heating quote.");
        
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            nextStep('ask_room_count');
        }, 2000);
    };

    startConversation();

    const fetchZones = async () => {
        try {
          const response = await fetch('/api/zone'); // Fetches ALL zones on init
          const data = await response.json();
          if (data.success && Array.isArray(data.rows)) {
            // Store as a flat array for easier searching
            setZoneData(data.rows); 
          } else {
            console.error("Zone API did not return a successful array of rows:", data);
          }
        } catch (error) {
          console.error("Failed to fetch zone data", error);
        }
      };
  
      fetchZones();
      
      // Cleanup listeners
      return () => {
        window.removeEventListener('resize', updateWindowSize);
        window.removeEventListener('resize', handleKeyboardToggle);
        window.removeEventListener('orientationchange', handleKeyboardToggle);
      };
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // Function to update progress after each question
  const updateProgress = () => {
    setAnsweredQuestions(prev => {
      const newCount = Math.min(totalQuestions, prev + 1);
      console.log(`📊 Progress update: ${prev} → ${newCount} / ${totalQuestions} (${Math.round((newCount / totalQuestions) * 100)}%)`);
      return newCount;
    });
  };

  const addMessage = (content, isUser = false) => {
    setMessages(prev => [...prev, { id: Date.now(), content, isUser }]);
  };

  // Smart dimension parsing function with validation to prevent phone numbers
  const parseDimensions = (input) => {
    const originalInput = input;
    const cleanInput = input.toLowerCase().trim();
    
    // VALIDATION: Only allow digits, decimal points, 'x', 'm', and spaces
    const allowedChars = /^[0-9\.\sxm²2]*$/;
    if (!allowedChars.test(cleanInput)) {
      return null; // Invalid characters
    }
    
    // VALIDATION: Check for phone number patterns (8+ digits in a row)
    const phonePattern = /\d{8,}/;
    if (phonePattern.test(cleanInput)) {
      return null; // Looks like a phone number
    }
    
    // Pattern 1: Square meter notation (e.g., "12m2", "12m²", "25.5m2", "25.5m²")
    const sqmNotationMatch = cleanInput.match(/^(\d+\.?\d*)\s*m[²2]\s*$/);
    if (sqmNotationMatch) {
      const sqm = parseFloat(sqmNotationMatch[1]);
      // VALIDATION: Maximum reasonable room size (1000 sqm)
      if (sqm > 1000) return null;
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: null,
        format: 'direct_sqm'
      };
    }
    
    // Pattern 2: Direct square meters (e.g., "25", "25.5", "25 sqm")
    const directSqmMatch = cleanInput.match(/^(\d+\.?\d*)\s*(?:sqm|sq\s*m|square\s*meters?)?\s*$/);
    if (directSqmMatch) {
      const sqm = parseFloat(directSqmMatch[1]);
      // VALIDATION: Maximum reasonable room size (1000 sqm)
      if (sqm > 1000) return null;
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: null,
        format: 'direct_sqm'
      };
    }
    
    // Pattern 3: Dimensions with units (e.g., "4m x 12m", "4.0m x 12.0m", "4.5m x 3.2m", "25.1m x 1.2m")
    const dimensionWithUnitsMatch = cleanInput.match(/^(\d+\.?\d*)\s*m\s*x\s*(\d+\.?\d*)\s*m\s*$/);
    if (dimensionWithUnitsMatch) {
      const width = parseFloat(dimensionWithUnitsMatch[1]);
      const length = parseFloat(dimensionWithUnitsMatch[2]);
      // VALIDATION: Maximum reasonable room dimensions (50m x 50m = 2500 sqm)
      if (width > 50 || length > 50) return null;
      const sqm = width * length;
      if (sqm > 1000) return null; // Additional total area check
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: { width, length },
        format: 'dimensions'
      };
    }
    
    // Pattern 4: Dimensions without units (e.g., "4 x 12", "4.0 x 12.0", "4.5 x 3.2", "25.01 x 1.02")
    const dimensionMatch = cleanInput.match(/^(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*$/);
    if (dimensionMatch) {
      const width = parseFloat(dimensionMatch[1]);
      const length = parseFloat(dimensionMatch[2]);
      // VALIDATION: Maximum reasonable room dimensions (50m x 50m = 2500 sqm)
      if (width > 50 || length > 50) return null;
      const sqm = width * length;
      if (sqm > 1000) return null; // Additional total area check
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: { width, length },
        format: 'dimensions'
      };
    }
    
    return null; // Invalid format
  };

  const nextStep = (next, delay = 1200, context = {}) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep(next);
        // Get the first name for personalization (from context or leadData)
        const firstName = context.firstName || leadData.firstName || '';
        
        // Trigger the question for the new step
        const questions = {
            ask_room_count: "How many areas are you planning to install underfloor heating in?",
            ask_room_name: `What is the name of room ${leadData.rooms.length + 1}? (e.g., Kitchen, Lounge)`,
            ask_room_dimensions: `What are the dimensions of the ${context.roomName || leadData.rooms[leadData.rooms.length - 1]?.name} in square meters? Please enter as square meters (e.g., 25) or dimensions (e.g., 10 x 5).`,
            ask_timeline: "What is your desired timeline for this project?",
            ask_timeline_details: "Could you please be more specific about your timeline?",
            pre_contact_details: "Great, that's all the project information we need. Now, let's get some contact details so we can send you the quote.",
            ask_first_name: "Perfect. What is your first name?",
            ask_last_name: firstName ? `Thanks ${firstName}! What is your last name?` : "What is your last name?",
            ask_phone: firstName ? `Great ${firstName}! What is your phone number?` : "What is your phone number?",
            ask_suburb: firstName ? `Awesome ${firstName}! What suburb is the job located in? Start typing and select from the list.` : "Great. What suburb is the job located in? Start typing and select from the list.",
            ask_street_address: firstName ? `Thanks ${firstName}. What is your street address?` : "What is your street address?",
            ask_email: firstName ? `Finally ${firstName}, what is your email address?` : "Finally, what is your email address?",
            review_data: "Please review all your information below. Click on any field to edit it, or click 'Submit Quote Request' if everything looks correct.",
        };
        if (questions[next]) {
            addMessage(questions[next]);
        }
        // Automatically move to the next logical step if needed
        if (next === 'start_questions') {
            // No need for an extra delay here, nextStep already has one.
            nextStep('ask_room_count');
        }
        if (next === 'pre_contact_details') {
            setTimeout(() => nextStep('ask_first_name'), 1200);
        }
    }, delay);
  };
  
  const handleLeadSubmission = async (finalData) => {
    setProgressStep(2);
    setIsLoading(true);
    addMessage("Thank you! We are submitting your request now...");

    try {
      // If this is an unlisted suburb, log it first
      if (finalData.isUnlistedSuburb) {
        try {
          const unlistedResponse = await fetch('/api/unlisted-suburb', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              suburbName: finalData.suburb,
              additionalInfo: `Customer provided suburb: ${finalData.suburb}`,
              customerName: `${finalData.customerFirstName} ${finalData.customerLastName}`,
              customerEmail: finalData.customerEmail,
              customerPhone: finalData.customerPhone,
              leadId: finalData.Lead,
              serviceType: 'Underfloor Heating',
              rooms: finalData.rooms,
              area: finalData.area,
              timeline: finalData.timeline
            }),
          });

          const unlistedResult = await unlistedResponse.json();
          if (unlistedResult.success) {
            console.log('✅ Unlisted suburb logged:', unlistedResult);
          }
        } catch (unlistedError) {
          console.error('❌ Failed to log unlisted suburb:', unlistedError);
          // Continue with normal lead submission even if unlisted suburb logging fails
        }
      }

      console.log('[CHATBOT] Submitting lead data:', finalData);
      console.log('[CHATBOT] Rooms data:', finalData.rooms);
      
      const response = await fetch('/api/lead-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        if (finalData.isUnlistedSuburb) {
          addMessage('✅ Thank you! Your quote request has been submitted. Since your suburb isn\'t in our current service list, we\'ll review your location and get back to you within 24 hours to confirm if we can service your area.');
        } else {
          addMessage('✅ Your lead has been submitted successfully! We will be in touch shortly.');
        }
        setIsCompleted(true);
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error("Lead submission failed:", error);
      addMessage(`❌ Sorry, there was an error: ${error.message}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = (currentStep, value) => {
    switch (currentStep) {
        case 'ask_room_count':
        case 'roomCount':
            const count = parseInt(value, 10);
            if (isNaN(count) || count <= 0) {
                return "Please enter a valid number.";
            }
            if (count >= 20) {
                return null; // Allow 20+ but will be handled in processing
            }
            return null;
        case 'ask_room_name':
            // Only allow predefined room names
            if (!ALLOWED_ROOMS.includes(value)) {
                return "Please select one of the provided room names.";
            }
            return null;
        case 'ask_room_dimensions':
            const parsed = parseDimensions(value);
            if (!parsed) {
                // Check for phone number pattern specifically
                const phonePattern = /\d{8,}/;
                if (phonePattern.test(value)) {
                    return "This looks like a phone number. Please enter room dimensions instead (e.g., 25 for 25m², 10 x 5 for 50m²).";
                }
                // Check for invalid characters
                const allowedChars = /^[0-9\.\sxm²2]*$/;
                if (!allowedChars.test(value.toLowerCase())) {
                    return "Please use only numbers (0-9), decimal points, 'x', 'm', and spaces.";
                }
                return "Please provide valid room dimensions (max 50m x 50m, 1000m²).";
            }
            return null;
        case 'ask_first_name':
            // Allow alphabet characters, hyphens, apostrophes, and periods (for initials like P.J)
            return /^[a-zA-Z'-\.]{2,}$/.test(value) ? null : "Please enter a valid first name (letters only, e.g., John, P.J, Mary-Jane).";
        case 'ask_last_name':
            // Allow alphabet characters, spaces, hyphens, apostrophes, and periods (for initials like P.J)
            return /^[a-zA-Z\s'-\.]{2,}$/.test(value) ? null : "Please enter a valid last name (letters only, e.g., Smith, P.J, O'Connor).";
        case 'ask_phone':
            // Allow only numbers and + sign, 8-10 digits total
            const cleanPhone = value.replace(/[\s()-]/g, ''); // Remove spaces, parentheses, hyphens
            const phoneRegex = /^\+?[0-9]{8,10}$/;
            return phoneRegex.test(cleanPhone) ? null : "Please enter a valid phone number (8-10 digits, + allowed for international).";
        case 'ask_suburb':
            // Allow any suburb input - we'll handle unlisted suburbs separately
            return value.trim().length > 0 ? null : "Please enter a suburb name.";
        case 'ask_email':
            const emailValidation = validateEmailFrontend(value);
            return emailValidation.valid ? null : emailValidation.error;
        case 'confirm_email_correction':
            // Accept yes/no responses
            const lowerValue = value.toLowerCase().trim();
            return ['yes', 'y', 'no', 'n'].includes(lowerValue) ? null : "Please type 'yes' or 'no'.";
        default:
            return null; // No validation for other steps like area/suburb selection
    }
  };

  const processUserInput = (input) => {
    const validationError = validateInput(step, input);
    if (validationError) {
        addMessage(validationError);
        return;
    }

    switch (step) {
        case 'ask_room_count':
            const roomCount = parseInt(input, 10);
            setLeadData(prev => ({ ...prev, roomCount }));
            
            if (roomCount >= 20) {
                addMessage("For projects with 20 or more rooms, please use our Contact Us page to submit a detailed quote enquiry. This will ensure we can provide you with a comprehensive quote for your large project. Visit our Contact Us page or email us at support@heat.nz. Thank you for considering Heat.nz!");
                setIsCompleted(true);
                return;
            }
            
            updateProgress();
            nextStep('ask_room_name');
            break;
        case 'ask_room_name':
            setLeadData(prev => ({
                ...prev,
                rooms: [...prev.rooms, { name: input, dimensions: '' }]
            }));
            updateProgress();
            nextStep('ask_room_dimensions', 1200, { roomName: input });
            break;
        case 'ask_room_dimensions':
            // Parse room dimensions intelligently
            const parsed = parseDimensions(input);
            
            if (!parsed) {
                addMessage(`Sorry, I couldn't understand that format. Please enter room dimensions using only numbers and 'x' for multiplication:
• Direct square meters: "25", "25.5", "12m2", "12m²"
• Length x Width: "10 x 5", "7.07 x 7.07", "4.0 x 12.0", "25.01 x 1.02"
• With units: "4m x 12m", "4.0m x 12.0m", "25.1m x 1.2m"
• Maximum room size: 50m x 50m (1000 sqm)
• Only use: numbers (0-9), decimal points, 'x', 'm', and spaces`);
                return;
            }
            
            const updatedRooms = [...leadData.rooms];
            const currentRoom = updatedRooms[updatedRooms.length - 1];
            currentRoom.dimensions = parsed.originalInput;
            currentRoom.sqm = parsed.sqm;
            currentRoom.parsedDimensions = parsed.dimensions;
            currentRoom.format = parsed.format;
            
            setLeadData(prev => ({ ...prev, rooms: updatedRooms }));
            
            // Provide confirmation
            if (parsed.format === 'direct_sqm') {
                addMessage(`✅ ${currentRoom.name}: ${parsed.sqm} square meters`);
            } else {
                addMessage(`✅ ${currentRoom.name}: ${parsed.dimensions.width}m x ${parsed.dimensions.length}m = ${parsed.sqm} square meters`);
            }

            updateProgress(); // Call updateProgress for every room dimensions
            
            if (updatedRooms.length < leadData.roomCount) {
                nextStep('ask_room_name');
            } else {
                nextStep('ask_timeline');
            }
            break;
        case 'ask_timeline':
            setLeadData(prev => ({ ...prev, timeline: input }));
            updateProgress();
            if (input === 'In a couple of months' || input === 'Other') {
                nextStep('ask_timeline_details');
            } else {
                nextStep('pre_contact_details');
            }
            break;
        case 'ask_timeline_details':
            setLeadData(prev => ({ ...prev, timeline: input })); // Overwrite with specific details
            nextStep('pre_contact_details');
            break;
        case 'ask_first_name':
            setLeadData(prev => ({ ...prev, firstName: input, name: input }));
            updateProgress();
            nextStep('ask_last_name', 1200, { firstName: input });
            break;
        case 'ask_last_name':
            setLeadData(prev => ({ 
                ...prev, 
                lastName: input, 
                customerName: `${prev.firstName} ${input}`,
                name: prev.firstName // Keep first name for personalization
            }));
            updateProgress();
            nextStep('ask_phone');
            break;
        case 'ask_phone':
            setLeadData(prev => ({ ...prev, customerPhone: input }));
            updateProgress();
            if (zoneData.length > 0) {
                nextStep('ask_suburb');
            } else {
                addMessage("Location data isn't available, so we'll skip to the final step.");
                nextStep('ask_email');
            }
            break;
        case 'ask_suburb':
            // Check if suburb is in our list
            const selectedZone = zoneData.find(zone => zone.suburb.toLowerCase() === input.toLowerCase());
            
            if (selectedZone) {
                // Suburb is in our list - proceed normally
                setLeadData(prev => ({ 
                    ...prev, 
                    suburb: selectedZone.suburb,
                    area: selectedZone.area,
                    isUnlistedSuburb: false
                }));
                updateProgress();
                nextStep('ask_email');
            } else {
                // Suburb not in our list - proceed as normal lead but mark as unlisted
                setLeadData(prev => ({ 
                    ...prev, 
                    suburb: input,
                    area: 'Unlisted Suburb',
                    isUnlistedSuburb: true,
                    suburbAdditionalInfo: '' // Will be filled during lead submission
                }));
                updateProgress();
                nextStep('ask_email');
            }
            break;
        case 'ask_email':
            // Comprehensive email validation
            const emailResult = validateEmailFrontend(input);
            
            if (!emailResult.valid) {
                addMessage(emailResult.error);
                return;
            }
            
            // Check for email correction
            if (emailResult.corrected) {
                // Email needs correction - ask user to confirm
                setEmailCorrection({ original: input, corrected: emailResult.corrected });
                addMessage(`Did you mean ${emailResult.corrected}?`, false);
                addMessage("Type 'yes' to use the corrected email, or 'no' to keep your original email.", false);
                setStep('confirm_email_correction');
                return;
            }
            
            // Email is valid - proceed normally
            setLeadData(prev => ({
                ...prev,
                customerEmail: input,
                serviceType: 'Underfloor Heating',
            }));
            updateProgress();
            setProgressStep(2);
            nextStep('review_data');
            break;
        case 'confirm_email_correction':
            if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
                // Use corrected email
                setLeadData(prev => ({
                    ...prev,
                    customerEmail: emailCorrection.corrected,
                    serviceType: 'Underfloor Heating',
                }));
                addMessage(`Great! Using ${emailCorrection.corrected}`, false);
                setEmailCorrection(null);
                setProgressStep(2);
                nextStep('review_data');
            } else if (input.toLowerCase() === 'no' || input.toLowerCase() === 'n') {
                // Use original email
                setLeadData(prev => ({
                    ...prev,
                    customerEmail: emailCorrection.original,
                    serviceType: 'Underfloor Heating',
                }));
                addMessage(`No problem! Using ${emailCorrection.original}`, false);
                setEmailCorrection(null);
                setProgressStep(2);
                nextStep('review_data');
            } else {
                addMessage("Please type 'yes' to use the corrected email, or 'no' to keep your original email.", false);
            }
            break;
        case 'review_data':
            // Handle field editing in review mode
            if (editingField) {
                handleFieldEdit(editingField, input);
                setEditingField(null);
                setInputValue('');
                nextStep('review_data');
            }
            break;
        default:
            break;
    }
  };

  // Handle field editing in review mode
  const handleFieldEdit = (fieldKey, newValue) => {
    const validation = validateInput(fieldKey, newValue);
    if (validation) {
      addMessage(`❌ ${validation}`, true);
      return;
    }

    setLeadData(prev => {
      const updated = { ...prev };
      
      // Handle different field types
      switch (fieldKey) {
        case 'roomCount':
          const newCount = parseInt(newValue, 10);
          if (newCount > updated.rooms.length) {
            // Add new rooms if count increased
            for (let i = updated.rooms.length; i < newCount; i++) {
              updated.rooms.push({
                name: '',
                dimensions: '',
                sqm: 0,
                parsedDimensions: null,
                format: ''
              });
            }
          } else if (newCount < updated.rooms.length) {
            // Remove rooms if count decreased
            updated.rooms = updated.rooms.slice(0, newCount);
          }
          updated.roomCount = newCount;
          break;
        case 'firstName':
          updated.firstName = newValue;
          updated.name = newValue;
          break;
        case 'lastName':
          updated.lastName = newValue;
          updated.customerName = `${updated.firstName} ${newValue}`;
          break;
        case 'customerPhone':
          updated.customerPhone = newValue;
          break;
        case 'customerEmail':
          updated.customerEmail = newValue;
          break;
        case 'suburb':
          const selectedZone = zoneData.find(zone => zone.suburb.toLowerCase() === newValue.toLowerCase());
          if (selectedZone) {
            updated.suburb = selectedZone.suburb;
            updated.area = selectedZone.area;
          }
          break;
        case 'timeline':
          updated.timeline = newValue;
          break;
        default:
          // Handle room fields
          if (fieldKey.startsWith('room_')) {
            const [roomIndex, field] = fieldKey.split('_').slice(1);
            const roomIndexNum = parseInt(roomIndex);
            if (updated.rooms[roomIndexNum]) {
              if (field === 'name') {
                updated.rooms[roomIndexNum].name = newValue;
              } else if (field === 'dimensions') {
                const parsed = parseDimensions(newValue);
                if (parsed) {
                  updated.rooms[roomIndexNum].dimensions = parsed.originalInput;
                  updated.rooms[roomIndexNum].sqm = parsed.sqm;
                  updated.rooms[roomIndexNum].parsedDimensions = parsed.dimensions;
                  updated.rooms[roomIndexNum].format = parsed.format;
                }
              }
            }
          }
          break;
      }
      
      return updated;
    });
    
    addMessage(`✅ Updated ${getFieldDisplayName(fieldKey)} to: ${newValue}`, true);
  };

  // Get display name for fields
  const getFieldDisplayName = (fieldKey) => {
    const fieldNames = {
      firstName: 'First Name',
      lastName: 'Last Name',
      customerPhone: 'Phone Number',
      customerEmail: 'Email Address',
      suburb: 'Suburb',
      timeline: 'Timeline',
      room_name: 'Room Name',
      room_dimensions: 'Room Dimensions'
    };
    return fieldNames[fieldKey] || fieldKey;
  };

  // Start editing a field
  const startEditing = (fieldKey) => {
    setEditingField(fieldKey);
    setInputValue('');
    
    // For room name fields, show options instead of text input
    if (fieldKey.startsWith('room_') && fieldKey.endsWith('_name')) {
      addMessage("Please select one of the room names from the options below:", true);
      // Display room name options by temporarily changing the step
      setStep('edit_room_name');
    } else {
      addMessage(`Please enter the new value for ${getFieldDisplayName(fieldKey)}:`, true);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setInputValue('');
    addMessage('Edit cancelled. You can click "Edit" on any field to make changes.', true);
  };

  // Submit the final lead data
  const submitLeadData = () => {
    const finalData = {
      ...leadData,
      serviceType: 'Underfloor Heating',
    };
    handleLeadSubmission(finalData);
    setStep('completed');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userInput = inputValue.trim();
    if (!userInput || isLoading) return;

    addMessage(userInput, true);
    setInputValue('');
    processUserInput(userInput);
  };

  const handleOptionSelect = (selectedValue) => {
    if (isLoading) return;

    if (step === 'ask_suburb') {
        addMessage(selectedValue.suburb, true);
        setSuburbSearch(selectedValue.suburb);
        setSuburbSuggestions([]);
        processUserInput(selectedValue.suburb); // Pass just the suburb string
    } else { // Handle timeline options
        addMessage(selectedValue, true);
        processUserInput(selectedValue);
    }
  }

  const handleSuburbSearchChange = (e) => {
    const value = e.target.value;
    setSuburbSearch(value);

    if (value.length > 1) { // Start searching after 1 character
        const suggestions = zoneData
            .filter(zone => zone.suburb.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5); // Limit suggestions
        setSuburbSuggestions(suggestions);
    } else {
        setSuburbSuggestions([]);
    }
  };

  const handleSuburbSubmit = (e) => {
    e.preventDefault();
    const suburbInput = suburbSearch.trim();
    if (!suburbInput || isLoading) return;

    addMessage(suburbInput, true);
    setSuburbSearch('');
    setSuburbSuggestions([]);
    processUserInput(suburbInput);
  };

  const isChatEnded = isCompleted || step === 'completed';
  // Show text input for all steps except suburb search, timeline options, room name, and review data
  // BUT show it when editing a field in review mode
  const showTextInput = !isChatEnded && 
    !['ask_suburb', 'ask_timeline', 'ask_room_name', 'review_data'].includes(step) || 
    editingField;

  const timelineOptions = ["Immediately", "In a week", "In a couple of months", "Other"];
  
  // Add predefined room name options
  const ALLOWED_ROOMS = [ 
  // 🏠 Residential Core 
  "Kitchen", "Bathroom", "Bedroom", "Living Room", "Dining Room", "Lounge", "Hallway", "Toilet", "Ensuite", 
  // 🧺 Residential Utility 
  "Garage", "Laundry", "Pantry", "Storage Room", "Utility Room", "Basement", "Attic", "Loft", "Mudroom", 
  // 🛏 Sleeping 
  "Guest Room", "Spare Room", "Nursery", "Kids Room", "Master Bedroom", 
  // 🎮 Entertainment 
  "Games Room", "Playroom", "Media Room", "Home Theater", 
  // 🏋️‍♂️ Special residential 
  "Gym", "Workshop", "Studio", "Sunroom", "Greenhouse", "Conservatory", "Terrace", "Balcony", 

  // 💼 Commercial General 
  "Office", "Meeting Room", "Conference Room", "Boardroom", "Training Room", "Server Room", "Reception", 
  "Waiting Room", "Break Room", "Canteen", "Restroom", "Storage", "Warehouse", "Loading Dock", 
  "Open Plan Office", "Cafe", "Kiosk", "Cafeteria", 
  // 🛍 Retail / Hospitality 
  "Shop", "Storefront", "Showroom", "Restaurant", "Bar", "Pub", "Kitchenette", "Lobby", 
  "Hotel Room", "Suite", "Banquet Hall", "Ballroom", 
  // 🏭 Industrial 
  "Factory Floor", "Assembly Area", "Manufacturing Floor", "Workshop", "Lab", "Laboratory", 
  "Cold Room", "Freezer Room"
];


  // Get current responsive styles
  const currentStyles = getCurrentStyles(windowSize);

  return (
    <div style={currentStyles.chatbotContainer}>
      <div style={currentStyles.chatbotHeader}>
        <div style={currentStyles.headerContent}>
          <h3>Heat.nz Chatbot</h3>
          <ProgressBar 
            steps={progressSteps} 
            currentStep={progressStep} 
            isCompleted={isCompleted}
            totalQuestions={totalQuestions}
            answered={answeredQuestions}
            styles={currentStyles}
          />
        </div>
        <div style={currentStyles.headerButtons}>
            <button onClick={handleClose} style={currentStyles.headerBtn}>—</button>
            <button onClick={handleReset} style={currentStyles.headerBtn}>✕</button>
        </div>
      </div>
      
      <div style={currentStyles.chatbotMessages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg.content} isUser={msg.isUser} />
        ))}
        {isLoading && <ChatMessage isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      {step === 'ask_timeline' && !isLoading && (
        <div style={currentStyles.optionsContainer}>
            {timelineOptions.map(option => (
                <button key={option} onClick={() => handleOptionSelect(option)} style={currentStyles.optionButton}>
                    {option}
                </button>
            ))}
        </div>
      )}
      
      {step === 'ask_room_name' && !isLoading && (
        <div style={{...currentStyles.optionsContainer, maxHeight: '200px', overflowY: 'auto'}}>
          {ALLOWED_ROOMS.map(option => (
            <button key={option} onClick={() => handleOptionSelect(option)} style={currentStyles.optionButton}>
              {option}
            </button>
          ))}
        </div>
      )}
      
      {step === 'edit_room_name' && !isLoading && (
        <div style={{...currentStyles.optionsContainer, maxHeight: '200px', overflowY: 'auto'}}>
          {ALLOWED_ROOMS.map(option => (
            <button 
              key={option} 
              onClick={() => {
                handleFieldEdit(editingField, option);
                setEditingField(null);
                setStep('review_data');
              }} 
              style={currentStyles.optionButton}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      
      
      {step === 'ask_suburb' && !isLoading && (
        <div style={currentStyles.suburbSearchContainer}>
            <div style={{marginBottom: '10px', fontSize: '14px', color: '#666'}}>
                💡 Start typing to see suggestions, or type any suburb name if not listed
            </div>
            <form onSubmit={handleSuburbSubmit} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input
                    type="text"
                    value={suburbSearch}
                    onChange={handleSuburbSearchChange}
                    style={currentStyles.inputField}
                    placeholder="Type your suburb..."
                    autoFocus
                />
                <button 
                    type="submit" 
                    style={{
                        ...currentStyles.submitButton,
                        padding: '10px 15px',
                        fontSize: '14px'
                    }}
                    disabled={!suburbSearch.trim()}
                >
                    Submit
                </button>
            </form>
            {suburbSuggestions.length > 0 && (
                <div style={currentStyles.suggestionsContainer}>
                    {suburbSuggestions.map(zone => (
                        <div 
                            key={`${zone.suburb}-${zone.area}`} 
                            onClick={() => handleOptionSelect(zone)} 
                            style={currentStyles.suggestionItem}
                        >
                            {zone.suburb} <span style={{color: '#888'}}>({zone.area})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {step === 'review_data' && !isLoading && (
        <div style={currentStyles.reviewContainer}>
          {editingField && (
            <div style={{...currentStyles.editingIndicator, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', color: '#856404'}}>
              ✏️ Editing: {getFieldDisplayName(editingField)} - Type your new value below and press Enter, or click ✕ to cancel
            </div>
          )}
          <div style={currentStyles.reviewSection}>
            <h3 style={currentStyles.reviewSectionTitle}>📋 Project Details</h3>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Number of Rooms:</span>
              <span style={currentStyles.reviewValue}>{leadData.roomCount}</span>
              <button onClick={() => startEditing('roomCount')} style={currentStyles.editButton}>Edit</button>
            </div>
            {leadData.rooms.map((room, index) => (
              <div key={index} style={currentStyles.roomReview}>
                <div style={currentStyles.reviewField}>
                  <span style={currentStyles.reviewLabel}>Room {index + 1} Name:</span>
                  <span style={currentStyles.reviewValue}>{room.name}</span>
                  <button onClick={() => startEditing(`room_${index}_name`)} style={currentStyles.editButton}>Edit</button>
                </div>
                <div style={currentStyles.reviewField}>
                  <span style={currentStyles.reviewLabel}>Dimensions:</span>
                  <span style={currentStyles.reviewValue}>{room.dimensions} ({room.sqm}m²)</span>
                  <button onClick={() => startEditing(`room_${index}_dimensions`)} style={currentStyles.editButton}>Edit</button>
                </div>
              </div>
            ))}
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Timeline:</span>
              <span style={currentStyles.reviewValue}>{leadData.timeline}</span>
              <button onClick={() => startEditing('timeline')} style={currentStyles.editButton}>Edit</button>
            </div>
          </div>

          <div style={currentStyles.reviewSection}>
            <h3 style={currentStyles.reviewSectionTitle}>👤 Your Contact Details</h3>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>First Name:</span>
              <span style={currentStyles.reviewValue}>{leadData.firstName}</span>
              <button onClick={() => startEditing('firstName')} style={currentStyles.editButton}>Edit</button>
            </div>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Last Name:</span>
              <span style={currentStyles.reviewValue}>{leadData.lastName}</span>
              <button onClick={() => startEditing('lastName')} style={currentStyles.editButton}>Edit</button>
            </div>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Phone:</span>
              <span style={currentStyles.reviewValue}>{leadData.customerPhone}</span>
              <button onClick={() => startEditing('customerPhone')} style={currentStyles.editButton}>Edit</button>
            </div>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Email:</span>
              <span style={currentStyles.reviewValue}>{leadData.customerEmail}</span>
              <button onClick={() => startEditing('customerEmail')} style={currentStyles.editButton}>Edit</button>
            </div>
            <div style={currentStyles.reviewField}>
              <span style={currentStyles.reviewLabel}>Location:</span>
              <span style={currentStyles.reviewValue}>{leadData.suburb}, {leadData.area}</span>
              <button onClick={() => startEditing('suburb')} style={currentStyles.editButton}>Edit</button>
            </div>
          </div>

          <div style={currentStyles.reviewActions}>
            <button onClick={submitLeadData} style={currentStyles.submitButton}>
              ✅ Submit Quote Request
            </button>
          </div>
        </div>
      )}

      {showTextInput && (
        <form onSubmit={handleSubmit} style={currentStyles.chatbotInput}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={currentStyles.inputField}
            placeholder={editingField ? `Enter new ${getFieldDisplayName(editingField).toLowerCase()}...` : "Type your message..."}
            disabled={isLoading}
            autoFocus={editingField}
          />
          {editingField && (
            <button 
              type="button" 
              onClick={cancelEditing}
              style={{...currentStyles.sendButton, background: '#dc3545', marginRight: '5px'}}
              title="Cancel editing"
            >
              ✕
            </button>
          )}
          <button type="submit" style={currentStyles.sendButton} disabled={isLoading || !inputValue.trim()}>
            ➤
          </button>
        </form>
      )}
    </div>
  );
};

// --- STYLES ---
// Helper function to get responsive styles based on viewport
const getResponsiveStyles = (windowSize) => {
  const isSmallMobile = windowSize.width <= 375 && windowSize.height <= 667;
  
  return {
    chatbotContainer: { 
      width: '100%', 
      maxWidth: '400px', 
      height: isSmallMobile ? '60vh' : '100%', 
      border: '1px solid #ddd', 
      borderRadius: '10px', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'white', 
      fontFamily: 'Arial, sans-serif',
      // Mobile optimizations
      minHeight: isSmallMobile ? '300px' : '400px',
      maxHeight: isSmallMobile ? '60vh' : '100vh',
      overflow: 'hidden',
      // Ensure proper sizing on mobile
      boxSizing: 'border-box',
      // Prevent zoom on input focus (iOS)
      fontSize: isSmallMobile ? '16px' : '14px'
    },
    chatbotMessages: { 
      flex: 1, 
      overflowY: 'auto', 
      padding: isSmallMobile ? '8px 12px' : '15px', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#f9f9f9',
      fontSize: isSmallMobile ? '14px' : '15px'
    },
    chatbotInput: { 
      display: 'flex', 
      padding: isSmallMobile ? '6px 8px' : '15px', 
      gap: '10px', 
      borderTop: '1px solid #eee',
      // Mobile touch targets
      minHeight: '44px'
    },
    inputField: { 
      flex: 1, 
      padding: isSmallMobile ? '8px 12px' : '10px', 
      border: '1px solid #ddd', 
      borderRadius: '20px', 
      outline: 'none', 
      fontSize: isSmallMobile ? '14px' : '15px',
      // Mobile touch targets
      minHeight: isSmallMobile ? '40px' : '44px'
    },
    sendButton: { 
      width: isSmallMobile ? '40px' : '44px', 
      height: isSmallMobile ? '40px' : '44px', 
      border: 'none', 
      background: '#333', 
      color: 'white', 
      borderRadius: '50%', 
      cursor: 'pointer', 
      fontSize: '16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      // Mobile touch targets
      minHeight: isSmallMobile ? '40px' : '44px',
      minWidth: isSmallMobile ? '40px' : '44px'
    },
    optionsContainer: { 
      padding: isSmallMobile ? '6px 8px' : '10px', 
      borderTop: '1px solid #eee', 
      maxHeight: '150px', 
      overflowY: 'auto', 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '8px', 
      justifyContent: 'center' 
    },
    optionButton: { 
      background: '#f0f0f0', 
      border: '1px solid #ddd', 
      borderRadius: '15px', 
      padding: isSmallMobile ? '8px 12px' : '12px 16px', 
      cursor: 'pointer', 
      fontSize: isSmallMobile ? '14px' : '15px', 
      minHeight: isSmallMobile ? '40px' : '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:hover': { background: '#e0e0e0' } 
    },
    suburbSearchContainer: { 
      padding: isSmallMobile ? '8px 12px' : '15px', 
      borderTop: '1px solid #eee', 
      position: 'relative' 
    },
    reviewContainer: { 
      padding: isSmallMobile ? '8px 12px' : '15px', 
      borderTop: '1px solid #eee', 
      backgroundColor: '#f9f9f9', 
      maxHeight: isSmallMobile ? '300px' : '400px', 
      overflowY: 'auto' 
    }
  };
};

// Get responsive styles based on current window size
const getCurrentStyles = (windowSize) => ({
  ...getResponsiveStyles(windowSize),
  chatbotHeader: { background: '#333', color: 'white', padding: '10px 15px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerContent: { flex: 1, textAlign: 'center', paddingLeft: '40px' /* Offset for buttons */ },
  headerButtons: { display: 'flex', gap: '5px' },
  headerBtn: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' },
  suggestionsContainer: { position: 'absolute', bottom: '100%', left: '15px', right: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' },
  suggestionItem: { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' },
  progressBarContainer: { marginTop: '10px' },
  progressBarOuter: {
    width: '100%',
    height: '16px',
    background: '#eee',
    borderRadius: '8px',
    overflow: 'hidden',
    margin: '10px 0'
  },
  progressBarInner: {
    height: '100%',
    width: '0%',
    background: 'linear-gradient(90deg, #4CAF50, #2E8BFF)',
    transition: 'width 260ms ease'
  },
  progressLabel: {
    fontSize: '13px',
    marginTop: '4px',
    color: '#333',
    textAlign: 'center'
  },
  progressBarSteps: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: '#ccc' },
  progressStep: { transition: 'color 0.4s ease' },
  editingIndicator: { padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' },
  reviewSection: { marginBottom: '20px', backgroundColor: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #ddd' },
  reviewSectionTitle: { margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#333', borderBottom: '2px solid #4caf50', paddingBottom: '5px' },
  reviewField: { display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #e9ecef' },
  reviewLabel: { fontWeight: 'bold', minWidth: '120px', color: '#495057', fontSize: '14px' },
  reviewValue: { flex: 1, margin: '0 10px', color: '#212529', fontSize: '14px' },
  editButton: { background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease', '&:hover': { background: '#0056b3', transform: 'translateY(-1px)' } },
  roomReview: { marginBottom: '15px', padding: '10px', backgroundColor: '#f1f3f4', borderRadius: '5px', border: '1px solid #dee2e6' },
  reviewActions: { textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #4caf50' },
  submitButton: { background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', '&:hover': { background: '#218838' } }
});

export default Chatbot;
