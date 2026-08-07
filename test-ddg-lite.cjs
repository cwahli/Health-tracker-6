const https = require('https');

const data = "q=" + encodeURIComponent("steak sandwich nutrition calories") + "&kl=us-en";

const req = https.request("https://lite.duckduckgo.com/lite/", {
  method: 'POST',
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://lite.duckduckgo.com/",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Length": Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log(resData.substring(0, 500)));
});

req.write(data);
req.end();
