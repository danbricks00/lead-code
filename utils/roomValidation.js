/**
 * Room Number Validation Utility
 * Handles parsing and validation of room number inputs in various formats
 */

/**
 * Parse a room number input from various formats
 * @param {string} input - The user input to parse
 * @returns {number|string|null} - Returns number if valid, "a lot" for special case, or null if invalid
 */
export const parseRoomNumber = (input) => {
  // Convert to lowercase and trim
  const text = input?.toLowerCase().trim() || "";
  
  // Handle "a lot" case
  if (text === "a lot" || text === "alot" || text === "lots") {
    return "a lot";
  }
  
  // Check if it's a digit
  if (/^\d+$/.test(text)) {
    const num = parseInt(text, 10);
    if (num > 0 && num <= 30) {
      return num;
    }
  }
  
  // Word to number mapping
  const wordToNumber = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "twenty one": 21, "twenty-one": 21, "twentyone": 21,
    "twenty two": 22, "twenty-two": 22, "twentytwo": 22,
    "twenty three": 23, "twenty-three": 23, "twentythree": 23,
    "twenty four": 24, "twenty-four": 24, "twentyfour": 24,
    "twenty five": 25, "twenty-five": 25, "twentyfive": 25,
    "twenty six": 26, "twenty-six": 26, "twentysix": 26,
    "twenty seven": 27, "twenty-seven": 27, "twentyseven": 27,
    "twenty eight": 28, "twenty-eight": 28, "twentyeight": 28,
    "twenty nine": 29, "twenty-nine": 29, "twentynine": 29,
    "thirty": 30
  };
  
  // Check if input is a word number
  if (wordToNumber[text] !== undefined) {
    return wordToNumber[text];
  }
  
  // Return null if not a valid number
  return null;
};

/**
 * Handle room number input in the chatbot
 * @param {string} message - User's message
 * @param {Function} addMessage - Function to add a message to the chat
 * @param {Object} chatState - Current chat state
 * @param {number} totalRooms - Reference to total rooms variable
 * @param {number} currentRoom - Reference to current room variable
 * @param {Array} roomDetails - Reference to room details array
 * @param {Function} updateProgress - Function to update progress
 * @param {Function} handleRoomDetails - Function to handle room details collection
 */
export const handleRoomNumberInput = (message, addMessage, chatState, totalRooms, currentRoom, roomDetails, updateProgress, handleRoomDetails) => {
  const roomCount = parseRoomNumber(message);
  
  // Handle "a lot" case
  if (roomCount === "a lot") {
    addMessage("That sounds like a big project! Could you give me a specific number of rooms? We can handle up to thirty rooms.");
    return false;
  }
  
  // Handle invalid input
  if (roomCount === null || roomCount < 1) {
    addMessage('Please enter a valid number of areas (e.g., 1, 2, 3) or written as words (e.g., "one", "two", "twenty"). We can handle up to thirty rooms.');
    return false;
  }
  
  return roomCount;
};