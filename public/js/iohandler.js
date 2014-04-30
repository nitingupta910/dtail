//var view;
//var plotData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

var n = 40;
//var random = d3.random.normal(0, .2);
//var plotData = d3.range(n).map(random);
var plotData = [];
for (i = 0; i < n; i++) {
    plotData.push(0);
}
//var plotData = [400, 900, 1000, 300, 4000];

var svg;
var line;
var path;
var xAxis;
var xAxisView;
var xScaleView;

var width;
var eventNumber = 0;

function initView() {
    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 40
    };
    width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    xScale = d3.scale.linear()
        .domain([0, n])
        .range([0, width]);

    var yScale = d3.scale.linear()
        .domain([0, 4096])
        .range([height, 0]);

    line = d3.svg.line()
        .x(function(d, i) {
            return xScale(i);
        })
        .y(function(d, i) {
            return yScale(d);
        });

    svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    xScaleView = d3.scale.linear()
        .domain([eventNumber - n, eventNumber])
        .range([0, width]);

    xAxis = d3.svg.axis()
        .scale(xScaleView)
        .orient("bottom")
        .tickFormat(function(d) {
            if (d < 0) {
                return ""
            } else {
                return d;
            }
        })
        .ticks(10);

    xAxisView = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + yScale(0) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.svg.axis().scale(yScale).orient("left"));

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
    xScaleView
        .domain([eventNumber - n, eventNumber])
        .range([0, width]);

    // redraw the line, and slide it to the left
    path
        .datum(plotData)
        .attr("d", line)
        .attr("transform", null)
        .transition()
        .duration(100)
        .ease("linear")
        .attr("transform", "translate(" + xScale(-1) + ",0)");

    // slide the x-axis left
    xAxisView.transition()
        .duration(100)
        .ease("linear")
        .call(xAxis);

    // pop the old data point off the front
    plotData.shift();
}

function recvData(data) {
    eventNumber++;
    plotData.push(1024);
    redraw();
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    initView();
    socket.on('data:filename', recvFileName);
    socket.on('data', recvData)
    socket.emit('client:ready');
}
