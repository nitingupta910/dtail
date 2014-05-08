var express = require("express");
var Tail = require('always-tail');
var fs = require('fs');
var app = express();
var port = 8080;

var eventsFile = "events.txt";
var eventsToMonitor = [];

// Parse command-line args
var argv = require('minimist')(process.argv.slice(2));
if (!argv._.length) {
    console.log("Missing log file name");
    return;
}
var filename = argv._[0];

// Check for events.txt
if (!fs.existsSync(eventsFile)) {
    console.log(eventsFile + " not found!");
    return;
}

// Record events to monitor
(function() {
    var text = fs.readFileSync(eventsFile, "utf8");
    console.log(text);
    var lines = text.split("\n");
    var numLines = lines.length;
    for (var i = 0; i < numLines; i++) {
        var line = lines[i].trim();
        if ((line[0] === "#") || (line === "")) {
            continue;
        }
        console.log("line[" + i + "] " + line);

        var parts = line.split(':');
        var e = {};
        e.regex = new RegExp(parts[0]);
        e.keysCSV = parts[1];
        eventsToMonitor.push(e);
        console.log(e);
    }
}());

// Attach file to tail
if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");
var tail = new Tail(filename, '\n', {
    "interval": 100
});

function parseLine(line) {
    //console.log(line);
    var parsed = "";
    var numEvents = eventsToMonitor.length;
    for (i = 0; i < numEvents; i++) {
        var re = eventsToMonitor[i].regex;
        var match = re.test(line);
        if (match) {
            parsed = line;
            console.log("MATCH: " + line);
            break;
        } else {
            console.log("MISMATCH: " + line);
        }
    }
    return parsed;
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
            if (parsed !== "") {
                socket.emit('data', parsed);
            }
        });

        tail.on('error', function(data) {
            console.log('tail error: ', data);
        });

        tail.watch();

        console.log("Listening on port " + port);
    });
});
