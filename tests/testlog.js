var fs = require('fs');
var filename = process.argv[2];
var maxValue = 4096;

function tick() {
    //var csv = "3,545,22,113";
    var csv = Math.floor(Math.random() * maxValue);
    var str = "EVENT:" + csv;
    fs.appendFile(filename, str + "\n", function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log(str);
        }
    });

}
setInterval(tick, 1000);
