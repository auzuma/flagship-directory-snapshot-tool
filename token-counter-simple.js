// Simple token counter for Electron
// This is a fallback implementation that doesn't require tiktoken

/**
 * Count tokens in text using a simple approximation
 * @param {string} text - The text to count tokens in
 * @returns {number} - The approximate token count
 */
function countTokens(text) {
  if (!text) return 0;
  
  try {
    // Simple approximation - count words and newlines
    // This is not as accurate as tiktoken but provides a reasonable fallback
    const tokens = text.split(/[\s,.!?;:()\[\]{}'"<>\/\\|=+\-*&^%$#@~`]+/)
      .filter(token => token.length > 0);
    
    const newlines = (text.match(/\n/g) || []).length;
    
    const count = tokens.length + newlines;
    console.log(`Counted ${count} tokens using simple method`);
    return count;
  } catch (error) {
    console.error('Error counting tokens:', error);
    return 0;
  }
}

module.exports = { countTokens };
