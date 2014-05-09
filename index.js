var express = require("express");
var Tail = require('always-tail');
var fs = require('fs');
var clc = require('cli-color');

var app = express();
var port = 8080;

var eventsFile = "events.txt";
var watchedPlotEvents = [];
var watchedMarkEvents = [];
var seenPlotEvents = [];

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
    //console.log(text);
    var lines = text.split("\n");
    var numLines = lines.length;
    for (var i = 0; i < numLines; i++) {
        var line = lines[i].trim();
        if ((line[0] === "#") || (line === "")) {
            continue;
        }
        //console.log("line[" + i + "] " + line);

        var parts = line.split(':');
        var e = {};
        if (parts[0] === "MARK") {
            var markEvent = parts[1].trim();
            if (markEvent === "")
                continue;
            watchedMarkEvents.push(markEvent);
        } else {
            e.regex = new RegExp(parts[0]);
            e.keysCSV = parts[1];
            watchedPlotEvents.push(e);
            //console.log(e);
        }
    }

    console.log(clc.yellow("Watched plot events:"));
    watchedPlotEvents.forEach(function(e) {
        console.log("\t" + e.regex + ":" + e.keysCSV);
    });
    console.log(clc.yellow("Watched mark events:\n\t") + watchedMarkEvents);
}());

// Attach file to tail
if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");
var tail = new Tail(filename, '\n', {
    "interval": 100
});

function isWatchedMarkEvent(eventStr) {
    var n = watchedMarkEvents.length;
    for (var i = 0; i < n; i++) {
        if (watchedMarkEvents[i] === eventStr) {
            return true;
        }
    }
    return false;
}

// In case of match, returns the matched event object,
// null otherwise
function isWatchedPlotEvent(eventStr) {
    var n = watchedPlotEvents.length;
    for (var i = 0; i < n; i++) {
        var re = watchedPlotEvents[i].regex;
        var match = re.test(eventStr);
        if (match) {
            return watchedPlotEvents[i];
        }
    }
    return null;
}

function isSeenPlotEvent(eventStr) {
    var n = seenPlotEvents.length;
    for (var i = 0; i < n; i++) {
        if (seenPlotEvents[i] == eventStr) {
            return true;
        }
    }
    return false;
}

function parseLineAndEmit(socket, line) {
    console.log(line);
    var isWatched = false;
    var parts = line.split(':');
    var eventName = parts[0];

    if (eventName == "MARK") {
        if (isWatchedMarkEvent(parts[1])) {
            isWatched = true;
        }
    } else {
        var e = isWatchedPlotEvent(eventName);
        if (e !== null) {
            isWatched = true;
            if (!isSeenPlotEvent(eventName)) {
                seenPlotEvents.push(eventName);
                // inform client about this new kind of plot
                var plotInfo = {};
                plotInfo.eventName = eventName;
                plotInfo.keysCSV = e.keysCSV;
                socket.emit('data:plotinfo', plotInfo);
            }
        }
    }

    if (isWatched) {
        console.log("MATCH: " + line);
        socket.emit('data', line);
    }
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
        tail.on('line', function(line) {
            parseLineAndEmit(socket, line);
        });

        tail.on('error', function(data) {
            console.log('tail error: ', data);
        });

        tail.watch();

        console.log("Listening on port " + port);
    });
});
