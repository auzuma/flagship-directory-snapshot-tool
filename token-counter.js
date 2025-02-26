// Token counter using tiktoken for Electron
const tiktoken = require('tiktoken');

function countTokens(text) {
  if (!text) return 0;
  
  try {
    // Try to get the cl100k_base encoding (used by GPT-3.5/4 models)
    const encoding = tiktoken.get_encoding("cl100k_base");
    
    // Count the tokens
    const tokenCount = encoding.encode(text).length;
    
    return tokenCount;
  } catch (error) {
    console.error('Error counting tokens:', error);
    
    // Fallback to a simple approximation if tiktoken fails
    const tokens = text.split(/[\s,.!?;:()\[\]{}'"<>\/\\|=+\-*&^%$#@~`]+/)
      .filter(token => token.length > 0);
    
    const newlines = (text.match(/\n/g) || []).length;
    
    return tokens.length + newlines;
  }
}

module.exports = { countTokens };
