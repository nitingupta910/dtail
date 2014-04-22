var express = require("express");
var app = express();
var port = 8080

// Parse command-line args
var argv = require('minimist')(process.argv.slice(2));
var logfile = argv._[0];
//console.log("GOT ARGV: " + argv._);

function parseLine(line) {
    console.log(line);
    return line;
}

// Set static content path
app.use(express.static(__dirname + '/public'));

// Attach socket to express app
var io = require('socket.io').listen(app.listen(port));

// Attach functions to socket events
io.sockets.on('connection', function(socket) {
    socket.on('client:ready', function(data) {
        console.log("client ready now");
        socket.emit('data:filename', logfile);
        Tail = require('tail').Tail;
        tail = new Tail(logfile);
        tail.on("line", function(data) {
            var parsed = parseLine(data);
            socket.emit('data', parsed)
        });
    });

    console.log("Listening on port " + port);
});
