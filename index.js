var express = require("express");
var app = express();
var port = 8080;

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket) {
    socket.on('client:ready', function(data) {
        console.log("client ready now");
        socket.emit('data:filename', "pin.log")
    });
});

console.log("Listening on port " + port);
