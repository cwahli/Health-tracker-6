import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const replacementSchema = `            responseSchema: (agentType === "agent1_step1" || agentType === "agent1")
              ? agent1Step1Schema
              : (agentType === "biomarker_review")
                ? {
                 type: Type.OBJECT,
                 properties: {
                   reply: { type: Type.STRING, description: "Conversational, highly polished response explaining the biomarker, answering questions, or explaining proposed corrections." },
                   proposal: {
                     type: Type.OBJECT,
                     nullable: true,
                     properties: {
                       name: { type: Type.STRING },
                       metric: { type: Type.STRING },
                       value: { type: Type.STRING },
                       date: { type: Type.STRING, description: "YYYY-MM-DD" },
                       range: { type: Type.STRING },
                       description: { type: Type.STRING },
                       medicalInsight: { type: Type.STRING, description: "Personalized medical insight based on demographic profile and proposed value" },
                       isEthnicitySpecific: { type: Type.BOOLEAN },
                       ethnicityTag: { type: Type.STRING, nullable: true }
                     },
                     required: ["name", "metric", "value", "date", "range", "description", "medicalInsight", "isEthnicitySpecific", "ethnicityTag"]
                   },
                   modificationCommand: {
                     type: Type.ARRAY,
                     nullable: true,
                     items: {
                       type: Type.OBJECT,
                       properties: {
                         action: { type: Type.STRING, enum: ["update_biomarker", "update_profile", "remove_biomarker"] },
                         keyName: { type: Type.STRING },
                         newValue: { type: Type.STRING },
                         date: { type: Type.STRING, description: "YYYY-MM-DD" }
                       },
                       required: ["action", "keyName", "date"]
                     }
                   }
                 },
                 required: ["reply"]
               }
              : (agentType === "data_review")`;

code = code.replace(/            responseSchema: \(agentType === "agent1_step1" \|\| agentType === "agent1"\)\s+\? agent1Step1Schema\s+: \(agentType === "data_review"\)/, replacementSchema);

fs.writeFileSync('server.ts', code);
