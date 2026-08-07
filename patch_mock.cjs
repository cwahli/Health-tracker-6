const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /mockData = \{\n          summary: "Reviewed diagnostic profile and biomarker history\. Identified retest priorities and diagnostic testing gaps\.",[\s\S]*?targetCondition: "Cardiovascular Health"\n            \}\n          \]\n        \};/;

const replacement = `mockData = {
          text: "Hello! Let's review your health planning based on your latest results.",
          _internalReasoning: "Evaluated elevated glucose; insulin test needed for full metabolic risk assessment.",
          summary: "Reviewed diagnostic profile and biomarker history. Identified retest priorities and diagnostic testing gaps.",
          mode: "discussion",
          status: "active",
          retestBiomarkers: [
            {
              key: "glucose",
              name: "Fasting Glucose",
              recommendedTestName: "Fasting Blood Glucose",
              currentValue: "5.8",
              unit: "mmol/L",
              retestTimeframe: "In 2-4 weeks",
              lastTestedDate: "01-01-2024",
              nextScheduledDate: "15-01-2024",
              isProvisional: true,
              priority: "High",
              userBenefit: "Getting this checked again ensures your blood sugar levels are on track, giving you peace of mind and better energy.",
              gpClinicalJustification: "Elevated fasting glucose of 5.8 mmol/L approaches prediabetic threshold. Repeat test recommended to confirm true baseline."
            }
          ],
          testingGaps: [
            {
              testName: "Fasting Insulin",
              category: "short_term",
              nextScheduledDate: "20-01-2024",
              priority: "High",
              userBenefit: "This helps catch any hidden insulin issues early, helping us craft a better nutrition plan for you.",
              gpClinicalJustification: "High priority to detect early insulin resistance before HbA1c shifts significantly. Critical for metabolic risk assessment.",
              targetCondition: "Metabolic Risk"
            },
            {
              testName: "ApoB",
              category: "long_term",
              nextScheduledDate: "01-01-2026",
              priority: "Low",
              userBenefit: "Checking ApoB gives us a deep dive into your heart health over the coming years.",
              gpClinicalJustification: "Low priority for long-term atherogenic risk monitoring. Provides superior particle count quantification.",
              targetCondition: "Cardiovascular Health"
            }
          ]
        };`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
