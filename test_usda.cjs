const usdaApiKey = "DEMO_KEY";
const query = "apple raw";
const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR Legacy`;
fetch(url).then(r=>r.json()).then(r => console.log(r.foods.map(f=>f.description))).catch(console.error);
