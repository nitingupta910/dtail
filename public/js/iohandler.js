/* jshint browser: true, undef: true, unused: true */
/* global console, io */
/* global d3:false */
/* global $:false */

//(function() {
//    'use strict';
var defaultEventWindow = 40;

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

function Plot(eventName) {
    var self = this;
    this.eventName = eventName;
    this.eventNumber = 0;
    this.eventWindow = defaultEventWindow;

    this.data = [];
    for (var i = 0; i <= defaultEventWindow; i += 1) {
        this.data.push(0);
    }

    this.width = defaultWidth;
    this.height = defaultHeight;

    this.xScale = d3.scale.linear()
        .domain([0, this.eventWindow])
        .range([0, this.width]);

    this.yScale = d3.scale.linear()
        .domain([0, d3.max(this.data)])
        .range([this.height, 0]);

    this.line = d3.svg.line()
        .x(function(d, i) {
            return self.xScale(i);
        })
        .y(function(d) {
            return self.yScale(d);
        });

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

    this.path = this.svg.append("g")
        .attr("clip-path", "url(#clip)")
        .append("path")
        .datum(this.data)
        .attr("class", "line")
        .attr("d", this.line);

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
        .call(this.yAxis);

    this.xAxisView = this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + this.yScale(0) + ")")
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
        .domain([0, d3.max(plot.data)])
        .range([plot.height, 0]);

    // redraw the line, and slide it to the left
    plot.path
        .datum(plot.data)
        .attr("d", plot.line)
        .attr("transform", null)
        .transition()
        .duration(100)
        .ease("linear")
        .attr("transform", "translate(" + plot.xScale(-1) + ",0)");

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
    var values = data.split(":"),
        eventName = values[0],
        val = parseInt(values[1], 10);

    var plot;
    var len = plots.length;
    for (var i = 0; i < len; i++) {
        if (plots[i].eventName === eventName) {
            plot = plots[i];
        }
    }
    if (plot === undefined) {
        plot = new Plot(eventName);
        plots.push(plot);
    }

    plot.data.push(val);
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
