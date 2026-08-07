const fs = require('fs');
let content = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');

const targetIdx = content.indexOf('{/* B. Full 31-nutrient table */}');
if (targetIdx === -1) {
  console.log("target not found");
  process.exit(1);
}
const endIdx = content.indexOf('</div>\n                            </div>\n                          )}', targetIdx);

const replacement = `{/* B. Full 31-nutrient table */}
                              <ComprehensiveNutrientsTable nutrients={msg.data?.pendingFoodLog?.nutrients} language={profile?.language || 'en'} />
`;

content = content.substring(0, targetIdx) + replacement + content.substring(endIdx - 110, endIdx) + content.substring(endIdx);
// wait, I can just replace the whole block by finding the start and end of it.

