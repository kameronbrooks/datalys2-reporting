const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
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

    if (req.url === '/datalys2-reports.min.js') {
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

    } else if (req.url === '/dl2-style.css') {
        const cssPath = path.join(__dirname, 'src', 'dl2-style.css');
        fs.readFile(cssPath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/css',
                'Content-Length': data.length
            });
            res.end(data);
        });
    } else {
        // Serve any other file from root if it exists
        const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
        const localPath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);
        
        fs.readFile(localPath, (err, data) => {
             if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found: ' + req.url);
                return;
            }
            
            let contentType = 'text/plain';
            if (localPath.endsWith('.html')) contentType = 'text/html';
            else if (localPath.endsWith('.js')) contentType = 'application/javascript';
            else if (localPath.endsWith('.css')) contentType = 'text/css';
            else if (localPath.endsWith('.json')) contentType = 'application/json';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': data.length
            });
            res.end(data);
        });
    }
});

server.listen(PORT, () => {
    console.log(`CDN server running at http://localhost:${PORT}/datalys2-reports.min.js`);
});
