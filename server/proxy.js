// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var websocket = require('websocket-stream')
var ServiceClient = require('azure-iothub').Client;
var net = require('net');

var args = process.argv.slice(2);

var connectionString = args[0];
var deviceId = args[1];
var port = 2222;

var proxyServer = net.createServer(function (socket) {
  socket.on('end', function () {
    console.log('client socket disconnected');
  })

  socket.on('error', function (err) {
    console.error('error on the client socket: ' + err);
  })

  var streamInit = {
    streamName: 'TestStream',
    connectTimeoutInSeconds: 30,
    responseTimeoutInSeconds: 30
  }

  var client = ServiceClient.fromConnectionString(connectionString);

  console.log('initiating stream');
  client.initiateStream(deviceId, streamInit, function(err, result) {
    if (err) {
      console.error('error initiating TCP stream: ' + err.toString());
    } else {
      console.log('results received from the device: ' + JSON.stringify(result, null, 2));

      var ws = websocket(result.uri, { headers: { 'Authorization': 'Bearer ' + result.authorizationToken} });
      console.log('got websocket - creating local server on port ' + port);

      socket.pipe(ws);
      ws.pipe(socket);
    }
  });
});

proxyServer.on('error', function (err) {
  console.error('error on the proxy server socket: ' + err.toString());
})

proxyServer.listen(port, function () {
  console.log('listening on port: ' + port + '...');
})
