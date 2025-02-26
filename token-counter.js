// Token counter module using tiktoken
let tiktoken;

try {
  // Attempt to require tiktoken dynamically
  tiktoken = require('tiktoken');
  console.log('Successfully loaded tiktoken module');
} catch (error) {
  console.error('Failed to load tiktoken:', error.message);
  console.log('Using fallback token counter...');
  // Continue without tiktoken, we'll use the fallback below
}

/**
 * Counts tokens in a text string using tiktoken's cl100k_base encoding
 * @param {string} text - The text to count tokens in
 * @returns {number} - The token count
 */
function countTokens(text) {
  if (!text) return 0;
  
  try {
    if (tiktoken) {
      // Use tiktoken if available
      const encoding = tiktoken.get_encoding("cl100k_base");
      const tokens = encoding.encode(text);
      const count = tokens.length;
      encoding.free();
      return count;
    } else {
      // Fallback token counter if tiktoken isn't available
      return fallbackCountTokens(text);
    }
  } catch (error) {
    console.error('Error counting tokens:', error.message);
    return fallbackCountTokens(text);
  }
}

/**
 * A simple fallback token counter that approximates tokens
 * This is less accurate than tiktoken but works without dependencies
 * @param {string} text - The text to count tokens in
 * @returns {number} - The approximate token count
 */
function fallbackCountTokens(text) {
  // Simple approximation - count words and add newlines
  const tokens = text.split(/[\s,.!?;:()\[\]{}'"<>\/\\|=+\-*&^%$#@~`]+/)
    .filter(token => token.length > 0);
  
  const newlines = (text.match(/\n/g) || []).length;
  
  return tokens.length + newlines;
}

module.exports = {
  countTokens
};
