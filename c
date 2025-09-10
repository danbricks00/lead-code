oomValidation.js
/**
 * Room Number Validation Utility
 * Handles parsing and validation of room number inputs in various formats
 */

/**
 * Parse a room number input from various formats
 * @param {string} input - The user input to parse
 * @returns {Object} Result object with isValid flag, value (if valid), and error message (if invalid)
 */
export const parseRoomNumber = (input) => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Please provide a room number' };
  }

  // Clean the input - remove extra spaces, convert to lowercase
  const cleanInput = input.trim().toLowerCase();
  
  // Remove common words like "rooms", "room", "bedrooms", etc.
  const numberOnly = cleanInput
    .replace(/(rooms?|bedrooms?|bathrooms?)/gi, '')
    .trim();

  // Number word to digit mapping
  const numberWords = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24,
    'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
    'twenty-nine': 29, 'thirty': 30
  };

  // Try to parse as direct number first
  const directNumber = parseInt(numberOnly, 10);
  if (!isNaN(directNumber)) {
    if (directNumber < 1) {
      return { isValid: false, error: 'Please enter at least 1 room' };
    }
    if (directNumber > 50) {
      return {
        isValid: false,
        error: 'That seems like a lot of rooms! Please double-check or contact us directly for large projects.'
      };
    }
    return { isValid: true, value: directNumber };
  }

  // Try to parse as word
  if (numberWords.hasOwnProperty(numberOnly)) {
    const wordNumber = numberWords[numberOnly];
    if (wordNumber < 1) {
      return { isValid: false, error: 'Please enter at least 1 room' };
    }
    return { isValid: true, value: wordNumber };
  }

  // Handle some common variations
  const variations = {
    'a few': 3,
    'couple': 2,
    'several': 4,
    'half dozen': 6,
    'dozen': 12
  };

  if (variations.hasOwnProperty(numberOnly)) {
    return { isValid: true, value: variations[numberOnly] };
  }

  // If we can't parse it, return error with helpful message
  return {
    isValid: false,
    error: 'I didn\'t understand that. Please enter a number like "5", "ten", or "fifteen"'
  };
};

/**
 * Enhanced chatbot message handler for room numbers
 * @param {string} userInput - The user's input message
 * @param {Function} setMessages - Function to update messages state
 * @param {Function} setFormData - Function to update form data state
 * @param {Function} setCurrentStep - Function to update current step state
 * @param {string} nextStep - The next step to transition to after successful validation
 */
export const handleRoomNumberInput = (userInput, setMessages, setFormData, setCurrentStep, nextStep = 'budget') => {
  const roomResult = parseRoomNumber(userInput);
  
  if (!roomResult.isValid) {
    // Add error message and ask again
    setMessages(prev => [...prev, 
      { type: 'user', content: userInput }, 
      { 
        type: 'bot', 
        content: `${roomResult.error} How many rooms are we working with?`, 
        expectingInput: 'rooms' 
      } 
    ]);
    return;
  }

  // Success - store the room number and continue
  const roomCount = roomResult.value;
  
  setMessages(prev => [...prev, 
    { type: 'user', content: userInput }, 
    { 
      type: 'bot', 
      content: `Perfect! ${roomCount} room${roomCount === 1 ? '' : 's'}. That helps me understand the scope of your project.` 
    } 
  ]);

  // Store in form data
  setFormData(prev => ({ ...prev, rooms: roomCount }));
  
  // Move to next step
  setTimeout(() => {
    setCurrentStep(nextStep);
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: 'What\'s your budget range for this project?', 
      expectingInput: 'budget' 
    }]);
  }, 1000);
};