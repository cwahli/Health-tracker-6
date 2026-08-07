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
  res.on('data', (chunk) => {
    console.log("RECEIVED BUFFER LENGTH:", chunk.length);
    console.log(chunk.toString('hex'));
  });
});

req.write(JSON.stringify({ message: "test", engine: "gemini-3.5-flash-lite" }));
req.end();
