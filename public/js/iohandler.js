/* jshint browser: true, undef: true, unused: true */
/* global console, io */
/* global d3:false */
/* global $:false */

//(function() {
//    'use strict';
var defaultEventWindow = 10;

var plots = [];

var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 40
};

var defaultOuterWidth = 960;
var defaultOuterHeight = 500;

var defaultWidth = defaultOuterWidth - margin.left - margin.right;
var defaultHeight = defaultOuterHeight - margin.top - margin.bottom;

function zeroFill(arr, count) {
    for (var i = 0; i < count; i++) {
        arr[i] = 0;
    }
}

/*function randomFill(arr, count) {
    var maxValue = 4096;
    for (var i = 0; i < count; i++) {
        arr[i] = Math.floor(Math.random() * maxValue);
    }
}*/

function Plot(eventName, numValues) {
    var self = this;
    this.eventName = eventName;
    this.eventNumber = 0;
    this.eventWindow = defaultEventWindow;

    this.data = [];
    for (var i = 0; i <= defaultEventWindow; i += 1) {
        var arr = [];
        zeroFill(arr, numValues);
        //randomFill(arr, numValues);
        this.data.push(arr);
    }
    this.maxValue = 0;

    this.width = defaultWidth;
    this.height = defaultHeight;

    this.xScale = d3.scale.linear()
        .domain([0, this.eventWindow])
        .range([0, this.width]);

    this.yScale = d3.scale.linear()
        .domain([0, self.maxValue])
        .range([this.height, 0]);
    //.domain([0, d3.max(self.data[self.eventWindow])])

    this.line = [];
    var fx = function(d, i) {
        return self.xScale(i);
    };

    function createFy(i) {
        return function(d) {
            return self.yScale(d[i]);
        };
    }

    var fy = [];
    for (i = 0; i < numValues; i++) {
        fy[i] = createFy(i);
        this.line[i] = d3.svg.line()
            .interpolate("monotone")
            .x(fx)
            .y(fy[i]);
    }

    this.svg = d3.select("#content").append("svg")
        .attr("width", this.width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", this.width)
        .attr("height", this.height);

    var clipArea = this.svg.append("g")
        .attr("clip-path", "url(#clip)");

    this.path = [];
    for (i = 0; i < numValues; i++) {
        this.path[i] = clipArea
            .append("path")
            .datum(this.data)
            .attr("class", "line")
            .attr("d", this.line[i]);
    }

    this.circleGroup = this.svg.append("g");
    this.circle = this.circleGroup.selectAll("circle")
        .data(self.data);

    this.circle.enter().append("circle")
    .attr("cx", function(d, i) {
        return self.xScale(i);
    })
    .attr("cy", function(d) {
        return self.yScale(d[0]);
    })
    .attr("r", 5);

    this.xScaleView = d3.scale.linear()
        .domain([this.eventNumber - this.eventWindow, this.eventNumber])
        .range([0, this.width]);

    this.xAxis = d3.svg.axis()
        .scale(this.xScaleView)
        .orient("bottom")
        .tickFormat(function(d) {
            if (d < 0) {
                return "";
            }
            return d;
        })
        .ticks(10);

    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");
    this.yAxisView = this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + self.xScale(0) + ", 0")
        .call(this.yAxis);

    this.xAxisView = this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + self.yScale(0) + ")")
        .call(this.xAxis);
}

function recvFileName(fname) {
    console.log("filename received: " + fname);
    $("#heading").text(fname);
}

function redraw(plot) {
    plot.xScaleView
        .domain([plot.eventNumber - plot.eventWindow, plot.eventNumber])
        .range([0, plot.width]);

    plot.yScale
        .domain([0, plot.maxValue])
        .range([plot.height, 0]);
    //.domain([0, d3.max(plot.data[plot.eventWindow])])

    // redraw the line, and slide it to the left
    var numValues = plot.data[0].length;
    for (var i = 0; i < numValues; i++) {
        plot.path[i]
            .datum(plot.data)
            .attr("d", plot.line[i])
            .attr("transform", null)
            .transition()
            .duration(100)
            .ease("linear")
            .attr("transform", "translate(" + plot.xScale(-1) + ",0)");
    }

    var circles = plot.svg.selectAll("circle").data(plot.data);
    circles
        .attr("cx", function(d, i) {
            return plot.xScale(i);
        })
        .attr("cy", function(d) {
            return plot.yScale(d[0]);
        })
        .attr("transform", null)
        .transition()
        .duration(100)
        .ease("linear")
        .attr("transform", "translate(" + plot.xScale(-1) + ", 0)");

    // slide the x-axis left
    plot.xAxisView.transition()
        .duration(100)
        .ease("linear")
        .call(plot.xAxis);

    // adjust the y-axis
    plot.yAxisView.transition()
        .duration(100)
        .ease("linear")
        .call(plot.yAxis);

    // pop the old data point off the front
    plot.data.shift();
}

function recvData(data) {
    //console.log(data);
    var line = data.split(":"),
        eventName = line[0],
        valuesStr = line[1].split(','),
        numValues = valuesStr.length;

    var plot;
    var numPlots = plots.length;
    for (i = 0; i < numPlots; i++) {
        if (plots[i].eventName === eventName) {
            plot = plots[i];
        }
    }
    if (plot === undefined) {
        plot = new Plot(eventName, numValues);
        plots.push(plot);
    }

    var values = [];
    for (var i = 0; i < numValues; i++) {
        var val = parseInt(valuesStr[i], 10);
        if (val > plot.maxValue) {
            plot.maxValue = val;
        }
        values.push(val);
    }

    plot.maxValue = 4096;
    plot.data.push(values);
    plot.eventNumber += 1;
    redraw(plot);
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    socket.on('data:filename', recvFileName);
    socket.on('data', recvData);
    socket.emit('client:ready');
};
//})();
