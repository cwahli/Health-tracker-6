const keyword = "Sainsbury rolled oats";
const dbTitle = "Sainsbury's Taste the Difference Scottish Whole Rolled Jumbo Oats";
const coreTokens = keyword.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
const queryTokens = new Set<string>(keyword.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
const dbTokens = new Set<string>(dbTitle.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
let score = 0;
dbTokens.forEach(token => {
  if (queryTokens.has(token)) score += 20;
  else score -= 2;
});
console.log("Score before brand boost:", score);
score += 100; // brand boost
console.log("Score after brand boost:", score);
