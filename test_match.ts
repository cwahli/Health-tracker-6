const keyword = "Sainsbury rolled oats";
const dbTitle = "Sainsbury's Taste the Difference Scottish Whole Rolled Jumbo Oats";
const coreTokens = keyword.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
const dbTokens = new Set<string>(dbTitle.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
const passTokenLock = coreTokens.every(token => 
  dbTokens.has(token) || 
  Array.from(dbTokens).some(dt => dt.startsWith(token) || token.startsWith(dt))
);
console.log("Core Tokens:", coreTokens);
console.log("DB Tokens:", Array.from(dbTokens));
console.log("Pass Token Lock:", passTokenLock);
