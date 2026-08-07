import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/gemini/food-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "150g Hana Mat Kimchi",
      history: [],
      userProfile: { language: 'en', age: 43, gender: 'male', weight: 61, height: 163 },
      engine: { name: 'gemini-3.1-flash-lite' },
      dietType: "balanced",
      location: null,
      foodLogs: [],
      biomarkers: []
    })
  });
  
  if (!res.ok) {
    console.error("HTTP Error", res.status);
    return;
  }
  
  const text = await res.text();
  console.log("Stream chunks received:", text.split('\n\n').length);
  // Just show the last few lines to see the final output
  console.log(text.slice(-1000));
}
test();
