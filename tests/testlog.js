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

function singleEvent() {
    //var csv = "3,545,22,113";
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
    //var csv = "3,545,22,113";
    var numValues = 4;
    var values = [];
    for (var i = 0; i < numValues; i++) {
        values[i] = Math.floor(Math.random() * maxValue);
    }
    var csv = values.join(",");
    var str = "EVENT:" + csv + "\n";
    appendToFile(filename, str);
}

//setInterval(singleEvent, 1000);
//setInterval(multiEvents, 1000);
setInterval(singleEventMultiValues, 1000);
