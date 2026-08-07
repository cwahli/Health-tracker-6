const fs = require('fs');
const file = 'src/components/chat-cards/NutritionLabelTable.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  const labelsContent = (
    <div className="mt-2 space-y-3 pl-2 border-l-2 border-indigo-100 dark:border-indigo-900/30">
          {processedItems.map((item: any, i: number) => {`;

const replStr = `  const renderedItems = processedItems.map((item: any, i: number) => {`;

content = content.replace(targetStr, replStr);

const targetEndStr = `              </div>
            );
          })}
        </div>
  );`;

const replEndStr = `              </div>
            );
          }).filter(Boolean);

  if (!renderedItems || renderedItems.length === 0) return null;

  const labelsContent = (
    <div className="mt-2 space-y-3 pl-2 border-l-2 border-indigo-100 dark:border-indigo-900/30">
      {renderedItems}
    </div>
  );`;

content = content.replace(targetEndStr, replEndStr);

fs.writeFileSync(file, content);
console.log("Fixed NutritionLabelTable.tsx");
