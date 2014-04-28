//var view;
//var plotData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

var n = 40;
var random = d3.random.normal(0, .2);
var plotData = d3.range(n).map(random);

var x;
var line;
var path;

function initView() {
    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 40
    },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    x = d3.scale.linear()
        .domain([0, n - 1])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([-1, 1])
        .range([height, 0]);

    line = d3.svg.line()
        .x(function(d, i) {
            return x(i);
        })
        .y(function(d, i) {
            return y(d);
        });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.svg.axis().scale(x).orient("bottom"));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.svg.axis().scale(y).orient("left"));

    path = svg.append("g")
        .attr("clip-path", "url(#clip)")
        .append("path")
        .datum(plotData)
        .attr("class", "line")
        .attr("d", line);
}

function recvFileName(fname) {
    console.log("filename received: " + fname);
    $("#heading").text(fname);
}

function redraw() {
    // redraw the line, and slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
        .transition()
        .duration(100)
        .ease("linear")
        .attr("transform", "translate(" + x(-1) + ",0)");

    // pop the old data point off the front
    plotData.shift();
}

function recvData(data) {
    //console.log(data);
    //var rval = Math.random();
    //console.log(rval);
    //plotData.push(rval);
    var rval = random();
    console.log(rval);
    plotData.push(rval);
    redraw();
    //view.append(data + "<br />");
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    initView();
    socket.on('data:filename', recvFileName);
    socket.on('data', recvData)
    socket.emit('client:ready');
}
