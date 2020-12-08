//
// webrtc 1to1 sample with mDNS 
//   https://github.com/mganeko/webrtc_1to1
//   webrtc_1to1 is provided under MIT license
//
//

// (1) install
//   npm install ws
//   npm install express
//   npm install multicast-dns
// or
//   npm install
//
// (2) start
//   Server
//      npm run wiht-mnds
//        or
//      SERVERNAME=signalig PORT=8080 node server_1to1_mdns.js
//   Client
//      open http://localhost:8080/

'use strict';

// --- get PORT from env --
let port = process.env.PORT;
if ((!port) || (port === '')) {
  port = '8080';
}
let servername = process.env.SERVERNAME;
if ((!servername) || (servername === '')) {
  servername = 'signaling';
}
servername += '.local';

// --- prepare server ---
const http = require("http");
const WebSocketServer = require('ws').Server;
const express = require('express');

const app = express();
app.use(express.static('public'));
let webServer = null;
const hostName = 'localhost';

// --- get IPv4 address --
const ipv4s = getIpv4Address();
console.log('IPv4 address:', ipv4s);
const ipv4address = selectIpAddress(ipv4s);


// --- start broacast servername with mdns --
const mdns = require('multicast-dns')();
startBroadcastInfo(servername, ipv4address);
console.log('mDNS servername: %s, IPv4 address: %s', servername, ipv4address);

// --- http ---
webServer = http.Server(app).listen(port, function () {
  const address = webServer.address();
  if (address) {
    console.log('Web server start. http://' + hostName + ':' + address.port + '/');
  }
  else {
    console.error('WebServer Start ERROR');
  }
});


// --- websocket signaling ---
const wsServer = new WebSocketServer({ server: webServer });
const address = webServer.address();
if (address) {
  console.log('websocket server start. port=' + address.port);
}
else {
  console.error('websocket Start ERROR with port=' + port);
}
//console.log('websocket server start. port=' + port);


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

// ================================
function getIpv4Address() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  //console.log(interfaces);

  const ipv4s = [];
  for (let device in interfaces) {
    const network = interfaces[device];
    network.forEach(info => {
      if (info.family === 'IPv4') {
        ipv4s.push({ device: device, address: info.address });
      }
    })
  }

  return ipv4s;
}


function selectIpAddress(ips) {
  let ipAddr = '127.0.0.1';
  let currentPrefix = '127'

  ips.forEach(ip => {
    const prefix = ip.address.split('.')[0];
    if (prefix === '10') {
      if (currentPrefix === '127') {
        console.log('use class A');
        ipAddr = ip.address;
        currentPrefix = ('10');
      }
    }
    else if (prefix === '172') {
      if ((currentPrefix === '127') || (currentPrefix === '10')) {
        console.log('use class B');
        ipAddr = ip.address;
        currentPrefix = '172';
      }
    }
    else if (prefix === '192') {
      if ((currentPrefix === '172') || (currentPrefix === '127') || (currentPrefix === '10')) {
        console.log('use class C');
        ipAddr = ip.address;
        currentPrefix = '192';
      }
    }
    else {
      if (currentPrefix === '127') {
        console.log('use global address');
        ipAddr = ip.address;
      }
    }
  })

  return ipAddr;
}

// ============ mdns =================




function startBroadcastInfo(name, ipaddr) {
  mdns.on('query', function (query) {
    // iterate over all questions to check if we should respond
    query.questions.forEach(function (q) {
      if (q.type === 'A' && q.name === name) {
        console.log('got mDNS query - question A:', q);

        // send an A-record response for example.local
        mdns.respond({
          answers: [{
            name: name,
            type: 'A',
            ttl: 300,
            data: ipaddr
          }]
        });
      }
    });
  });
}
