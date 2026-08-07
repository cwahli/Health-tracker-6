const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const schemaDefinition = `
const RouteAgentOutputSchema = z.object({
  _internalReasoning: z.string().optional(),
  selectedAgent: z.string(),
  reasoning: z.string().optional(),
  targetDbId: z.string().nullable().optional()
});

app.post("/api/gemini/route-biomarker"
`;

content = content.replace('app.post("/api/gemini/route-biomarker"', schemaDefinition);
fs.writeFileSync('server.ts', content);
