async function run() {
  const res = await fetch('http://localhost:3000/api/gemini/food-analyze?stream=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'test', engine: 'gemini-3.5-flash-lite' })
  });
  console.log("CONTENT TYPE:", res.headers.get('content-type'));
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let chunks = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log("DONE");
      break;
    }
    const chunkStr = decoder.decode(value, { stream: true });
    chunks++;
    console.log(`CHUNK ${chunks}: length ${chunkStr.length} | first 20 chars: ${JSON.stringify(chunkStr.slice(0, 20))}`);
  }
}
run();
