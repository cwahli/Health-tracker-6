const usdaApiKey = "DEMO_KEY";
const query = "apple";
const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${encodeURIComponent(query)}&pageSize=30&dataType=Foundation,SR Legacy`;
fetch(url).then(r=>r.json()).then(data => {
    let foods = data.foods || [];
    const qLower = query.toLowerCase().trim();
    foods.sort((a, b) => {
      const aName = (a.description || "").toLowerCase();
      const bName = (b.description || "").toLowerCase();
      if (aName === qLower && bName !== qLower) return -1;
      if (bName === qLower && aName !== qLower) return 1;
      if (aName === `${qLower}, raw` && bName !== `${qLower}, raw`) return -1;
      if (bName === `${qLower}, raw` && aName !== `${qLower}, raw`) return 1;
      if (aName === `${qLower}s, raw` && bName !== `${qLower}s, raw`) return -1;
      if (bName === `${qLower}s, raw` && aName !== `${qLower}s, raw`) return 1;
      if (aName.startsWith(qLower) && !bName.startsWith(qLower)) return -1;
      if (bName.startsWith(qLower) && !aName.startsWith(qLower)) return 1;
      return aName.length - bName.length;
    });
    console.log(foods.slice(0,5).map(f=>f.description));
}).catch(console.error);
