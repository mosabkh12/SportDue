// Generate a simple password with lowercase letters and numbers only
const generatePassword = (length = 6) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const charset = lowercase + numbers;
  let password = '';
  
  // Ensure at least one number
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // Fill the rest with random chars from charset
  for (let i = 1; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password to avoid always starting with a number
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate a simple password based on player name (e.g., "mosab123")
const generateSimplePassword = (playerName, length = 8) => {
  // Take first part of name (lowercase, no spaces, max 6 chars, letters only)
  const namePart = playerName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '').substring(0, 6);
  
  // Generate random numbers (2-3 digits to complete the password)
  const numLength = Math.max(2, Math.min(3, length - namePart.length));
  const numbers = '0123456789';
  let numPart = '';
  for (let i = 0; i < numLength; i++) {
    numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return namePart + numPart;
};

module.exports = generatePassword;
module.exports.generateSimplePassword = generateSimplePassword;

