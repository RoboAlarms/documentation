// A tiny HTTP proxy so the browser can open the mock Panel Manager at a documentation address
// (http://192.0.2.10/, RFC 5737) while it really runs on 127.0.0.1:<port>. Every request and every
// CONNECT tunnel (WebSockets) is sent to the mock, whatever host the browser asked for.
//   node addr-proxy.cjs <listenPort> <mockPort>     then start Chrome with --proxy-server=127.0.0.1:<listenPort>
'use strict';
const http = require('node:http');
const net = require('node:net');
const [listenPort = 8570, mockPort = 8561] = process.argv.slice(2).map(Number);
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const up = http.request({host: '127.0.0.1', port: mockPort, method: req.method, path: u.pathname + u.search, headers: req.headers},
    r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  up.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(up);
});
server.on('connect', (req, client, head) => {
  const up = net.connect(mockPort, '127.0.0.1', () => { client.write('HTTP/1.1 200 Connection Established\r\n\r\n'); up.write(head); up.pipe(client); client.pipe(up); });
  up.on('error', () => client.destroy()); client.on('error', () => up.destroy());
});
server.on('upgrade', (req, client, head) => { // plain-proxy WebSocket upgrade (absolute URL)
  const u = new URL(req.url, 'http://x');
  const up = net.connect(mockPort, '127.0.0.1', () => {
    up.write(`${req.method} ${u.pathname + u.search} HTTP/1.1\r\n` + Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n');
    up.write(head); up.pipe(client); client.pipe(up);
  });
  up.on('error', () => client.destroy()); client.on('error', () => up.destroy());
});
server.listen(listenPort, '127.0.0.1', () => console.log(`proxy 127.0.0.1:${listenPort} -> mock 127.0.0.1:${mockPort}`));
