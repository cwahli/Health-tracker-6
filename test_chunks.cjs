const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/gemini/food-analyze?stream=true',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let chunks = 0;
  let firstChunkTime = null;
  res.on('data', (chunk) => {
    if (!firstChunkTime) firstChunkTime = Date.now();
    chunks++;
    console.log(`CHUNK ${chunks}: ${chunk.length} bytes at ${Date.now() - firstChunkTime}ms`);
  });
  res.on('end', () => {
    console.log(`TOTAL CHUNKS: ${chunks}`);
  });
});

req.write(JSON.stringify({ message: "test", engine: "gemini-3.5-flash-lite" }));
req.end();
