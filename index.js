var express = require("express");
var app = express();
var port = 8080;

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));

function parseLine(line) {
    console.log(line);
    return line;
}

io.sockets.on('connection', function(socket) {
    socket.on('client:ready', function(data) {
        console.log("client ready now");
        socket.emit('data:filename', "pin.log");
        Tail = require('tail').Tail;
        tail = new Tail("pin.log");
        tail.on("line", function(data) {
            var parsed = parseLine(data);
            socket.emit('data', parsed)
        });
    });

    console.log("Listening on port " + port);
});
