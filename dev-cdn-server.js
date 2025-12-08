const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FILE_PATH = path.join(__dirname, 'dist', 'datalys2-reports.min.js');

const server = http.createServer((req, res) => {
  // Enable CORS for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/datalys2-reports.min.js' || req.url === '/') {
    fs.readFile(FILE_PATH, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Content-Length': data.length
      });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`CDN server running at http://localhost:${PORT}/datalys2-reports.min.js`);
});
