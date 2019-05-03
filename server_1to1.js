//
// webrtc 1to1 sample
//   https://github.com/mganeko/mediasoup_sample_v2
//   mediasoup_sample_v2 is provided under MIT license
//
//

// (1) install
//   npm install ws
//   npm install express
// or
//   npm install
//
// (2) start
//   Server
//      export PORT=8080 && node server_1to1.js
//   Client
//      open http://localhost:8080/



'use strict';

// --- get PORT from env --
let port = process.env.PORT;
if ((!port) || (port === '')) {
  port = '8080';
}

// --- prepare server ---
const http = require("http");
const WebSocketServer = require('ws').Server;
const express = require('express');

const app = express();
app.use(express.static('public'));
let webServer = null;
const hostName = 'localhost';

// --- http ---
webServer = http.Server(app).listen(port, function () {
  console.log('Web server start. http://' + hostName + ':' + webServer.address().port + '/');
});


// --- websocket signaling ---
const wsServer = new WebSocketServer({ server: webServer });
console.log('websocket server start. port=' + webServer.address().port);

wsServer.on('connection', function (ws) {
  console.log('-- websocket connected --');
  ws.on('message', function (message) {
    wsServer.clients.forEach(function each(client) {
      if (isSame(ws, client)) {
        console.log('- skip sender -');
      }
      else {
        client.send(message);
      }
    });
  });
});

function isSame(ws1, ws2) {
  // -- compare object --
  return (ws1 === ws2);

  // -- compare undocumented id --
  //return (ws1._ultron.id === ws2._ultron.id);
}
