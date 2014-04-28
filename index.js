var express = require("express");
var Tail = require('always-tail');
var fs = require('fs');
var app = express();
var port = 8080

// Parse command-line args
var argv = require('minimist')(process.argv.slice(2));
if (!argv._.length) {
    console.log("Missing log file name");
    return;
}
var filename = argv._[0];

// Attach file to tail
if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");
var tail = new Tail(filename, '\n', {
    "interval": 100
});

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
        socket.emit('data:filename', filename);

        // Setup tail callbacks
        tail.on('line', function(data) {
            var parsed = parseLine(data);
            socket.emit('data', parsed)
        });

        tail.on('error', function(data) {
            console.log('tail error: ', data);
        });

        tail.watch();

        console.log("Listening on port " + port);
    });
});
