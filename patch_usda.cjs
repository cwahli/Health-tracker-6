const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const target = `async function searchUSDA(query: string, maxResults: number = 5, dataTypes: string = 'Foundation,SR Legacy,Branded'): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const dataTypeQuery = dataTypes.split(',').map(d => 'dataType=' + encodeURIComponent(d)).join('&');
    const usdaApiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = \`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=\${usdaApiKey}&query=\${encodeURIComponent(query)}&pageSize=\${maxResults}&\${dataTypeQuery}\`;
    
    const response = await fetch(url, { signal: controller.signal as any });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.foods || [];`;

const replacement = `async function searchUSDA(query: string, maxResults: number = 5, dataTypes: string = 'Foundation,SR Legacy,Branded'): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const dataTypeQuery = dataTypes.split(',').map(d => 'dataType=' + encodeURIComponent(d)).join('&');
    const usdaApiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const fetchSize = 15;
    let url = \`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=\${usdaApiKey}&query=\${encodeURIComponent(query)}&pageSize=\${fetchSize}&\${dataTypeQuery}\`;
    
    const response = await fetch(url, { signal: controller.signal as any });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    const data = await response.json();
    let foods = data.foods || [];
    
    // Sort to bubble exact or shortest matches to the top
    const qLower = query.toLowerCase().trim();
    foods.sort((a: any, b: any) => {
      const aName = (a.description || "").toLowerCase();
      const bName = (b.description || "").toLowerCase();
      if (aName === qLower && bName !== qLower) return -1;
      if (bName === qLower && aName !== qLower) return 1;
      if (aName === \`\${qLower}, raw\` && bName !== \`\${qLower}, raw\`) return -1;
      if (bName === \`\${qLower}, raw\` && aName !== \`\${qLower}, raw\`) return 1;
      if (aName === \`\${qLower}s, raw\` && bName !== \`\${qLower}s, raw\`) return -1;
      if (bName === \`\${qLower}s, raw\` && aName !== \`\${qLower}s, raw\`) return 1;
      if (aName.startsWith(qLower) && !bName.startsWith(qLower)) return -1;
      if (bName.startsWith(qLower) && !aName.startsWith(qLower)) return 1;
      return aName.length - bName.length;
    });
    
    return foods.slice(0, maxResults);`;
code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
