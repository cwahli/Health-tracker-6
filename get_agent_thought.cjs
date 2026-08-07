const fs = require('fs');
const content = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');
if (content.includes('AgentThoughtBox')) console.log("Found");
