var fs = require('fs');
var filename = process.argv[2];
var maxValue = 4096;

function appendToFile(filename, str) {
    fs.appendFile(filename, str, function(err) {
        if (err) {
            console.log(err);
        } else {
            process.stdout.write(str);
        }
    });
}

function getRandomUpto(maxValue) {
    return Math.floor(Math.random() * (maxValue - 1));
}

function singleEvent() {
    var csv = Math.floor(Math.random() * maxValue);
    var str = "EVENT:" + csv + "\n";
    appendToFile(filename, str);
}

function multiEvents() {
    var maxEventTypes = 4;
    var eventType = Math.floor(Math.random() * maxEventsTypes);
    var eventStr = "EVENT[" + eventType + "]:";

    var csv = Math.floor(Math.random() * maxValue);
    var str = eventStr + csv + "\n";
    appendToFile(filename, str);
}

function singleEventMultiValues() {
    var numValues = 4;
    var values = [];
    for (var i = 0; i < numValues; i++) {
        values[i] = Math.floor(Math.random() * maxValue);
    }
    var csv = values.join(",");
    var str = "EVENT:" + csv + "\n";
    appendToFile(filename, str);
}

function multiEventsMultiValues() {
    var numValues = 3;
    var maxEventsTypes = 4;

    var values = [];
    for (var i = 0; i < numValues; i++) {
        values[i] = Math.floor(Math.random() * maxValue);
    }
    var eventType = Math.floor(Math.random() * maxEventsTypes);

    var csv = values.join(",");
    var str = "EVENT[" + eventType + "]:" + csv + "\n";
    appendToFile(filename, str);
}

var medvNumValues = [];

function medvTestInit() {
    if (medvNumValues.length) {
        return;
    }
    var maxNumValues = 8;
    var maxEventsTypes = 4;
    for (var i = 0; i < maxEventsTypes; i++) {
        medvNumValues.push(1 + getRandomUpto(maxNumValues));
    }
    console.log(medvNumValues);
}

/* Different number of values for different events. e.g:
 * EVENT[0]:v1,v2,v3,v4
 * EVENT[1]:v1,v2
 * EVENT[2]:v1,v1,v3
 * EVENT[4]:v1
 */
function multiEventsDiffValues() {
    medvTestInit();
    var eventTypes = medvNumValues.length;

    // generate a random event
    var e = Math.floor(Math.random() * eventTypes);
    var n = medvNumValues[e];

    // generate random values for this event
    var values = [];
    for (var i = 0; i < n; i++) {
        values.push(getRandomUpto(maxValue));
    }

    // append EVENT[x]:v1,v2,... to file
    var csv = values.join(",");
    var str = "EVENT[" + e + "]:" + csv + "\n";
    appendToFile(filename, str);
}

function markAndPlotEvents() {
    var rand = Math.random();
    if (rand > 0.8) {
        appendToFile(filename, "MARK:GC\n");
    } else {
        multiEventsMultiValues();
    }
}

//setInterval(singleEvent, 1000);
//setInterval(multiEvents, 1000);
//setInterval(singleEventMultiValues, 1000);
//setInterval(multiEventsMultiValues, 1000);
//setInterval(multiEventsDiffValues, 1000);
setInterval(markAndPlotEvents, 1000);
