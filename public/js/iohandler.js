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
    left: 80
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

var fx = function() {
    var self = this;
    return function(d, i) {
        return self.xScale(i);
    };
};

function createFy(i) {
    var self = this;
    return function(d) {
        return self.yScale(d[i]);
    };
}

function Plot(eventName, keysCSV) {
    var self = this;
    this.eventName = eventName;
    this.eventNumber = 0;
    this.eventWindow = defaultEventWindow;

    var keys = keysCSV.split(",");
    var numValues = keys.length;

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

    // randomly select colors for each line
    this.colors = d3.scale.category10();

    this.line = [];
    for (i = 0; i < numValues; i++) {
        this.line[i] = d3.svg.line()
            .interpolate("monotone")
            .x(fx.call(self))
            .y(createFy.call(self, i));
    }

    this.svg = d3.select("#content").append("svg")
        .attr("width", this.width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*
     * Draw grid lines
     */

    // vertical lines
    this.svg.selectAll(".vline").data(d3.range(this.eventWindow)).enter()
        .append("line")
        .attr("x1", function(d) {
            return self.xScale(d);
        })
        .attr("x2", function(d) {
            return self.xScale(d);
        })
        .attr("y1", 0)
        .attr("y2", this.height)
        .style("stroke", "#ddd");

    // horizontal lines
    this.svg.selectAll(".hline").data(d3.range(10)).enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", this.width)
        .attr("y1", function(d) {
            return self.height * d / 10;
        })
        .attr("y2", function(d) {
            return self.height * d / 10;
        })
        .style("stroke", "#eee");

    // define clip region
    this.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", this.width)
        .attr("height", this.height);

    var clipArea = this.svg.append("g")
        .attr("clip-path", "url(#clip)");

    // draw the line graph
    this.path = [];
    for (i = 0; i < numValues; i++) {
        this.path[i] = clipArea
            .append("path")
            .datum(this.data)
            .attr("class", "line")
            .attr("d", this.line[i])
            .attr("stroke", self.colors(i))
            .attr("stroke-width", "2px")
            .attr("fill", "none");
    }

    // create circles to highlight actual data points
    this.circleGroup = [];
    for (i = 0; i < numValues; i++) {
        this.circleGroup[i] = this.svg.append("g");
        var circles = this.circleGroup[i].selectAll("circle")
            .data(self.data);

        circles.enter().append("circle")
            .attr("cx", fx.call(self, i))
            .attr("cy", createFy.call(self, i))
            .attr("r", 4);
    }

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

    // draw X & Y axis
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");
    this.yAxisView = this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + self.xScale(0) + ", 0")
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .call(this.yAxis);

    this.xAxisView = this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + self.height + ")")
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .call(this.xAxis);

    // draw title
    this.svg.append("text")
        .attr("class", "title")
        .attr("x", 20)
        .attr("y", 20)
        .text(this.eventName);

    /*
     * draw legend
     */
    // TODO:
    //   1) separate out into separate file/functions
    //   2) calculate boundingBoxWidth based on the longest key string
    var legend = {
        "x": 20,
        "y": 20,
        "boundingBoxWidth": 128,
        "boxWidth": 12,
        "boxHeight": 12,
        "boxMargin": 10,
        "textMargin": 8
    };
    var legendGroup = this.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(10, 30)");

    // draw rect bounding all keys
    legendGroup.append("rect")
        .attr("x", legend.x - legend.textMargin)
        .attr("y", legend.y - legend.textMargin)
        .attr("rx", 5)
        .attr("ry", 4)
        .attr("width", legend.x + legend.boundingBoxWidth)
        .attr("height", legend.y + numValues * (legend.boxHeight + legend.boxMargin))
        .style("fill", "grey")
        .style("fill-opacity", "0.5");

    // draw small rects and associated text
    for (i = 0; i < numValues; i++) {
        var color = self.colors(i);
        var legendY = legend.y + i * (legend.boxHeight + legend.boxMargin);
        legendGroup.append("rect")
            .attr("x", legend.x)
            .attr("y", legendY)
            .attr("width", legend.boxWidth)
            .attr("height", legend.boxHeight)
            .style("fill", color);
        legendGroup.append("text")
            .attr("x", legend.x + legend.boxWidth + legend.textMargin)
            .attr("y", legendY + legend.boxHeight)
            .text(keys[i]);
    }
}

function redraw(plot) {
    plot.xScaleView
        .domain([plot.eventNumber - plot.eventWindow, plot.eventNumber])
        .range([0, plot.width]);

    plot.yScale
        .domain([0, plot.maxValue])
        .range([plot.height, 0]);

    // redraw the line, and slide it to the left
    var numValues = plot.data[0].length;
    for (var i = 0; i < numValues; i++) {
        plot.path[i]
            .datum(plot.data)
            .attr("d", plot.line[i])
            .attr("stroke", plot.colors(i))
            .attr("stroke-width", "2px")
            .attr("fill", "none")
            .attr("transform", null)
            .transition()
            .duration(100)
            .ease("linear")
            .attr("transform", "translate(" + plot.xScale(-1) + ",0)");
    }

    // draw circles corresponding to actual data points
    for (i = 0; i < numValues; i++) {
        var circles = plot.circleGroup[i].selectAll("circle").data(plot.data);
        circles
            .attr("cx", fx.call(plot))
            .attr("cy", createFy.call(plot, i))
            .attr("transform", null)
            .transition()
            .duration(100)
            .ease("linear")
            .attr("transform", "translate(" + plot.xScale(-1) + ", 0)");
    }

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

    if (eventName === "MARK") {
        // FIXME: handle MARK events;
        console.log("FIXME: handle mark event " + valuesStr);
        return;
    }

    var plot;
    var numPlots = plots.length;
    for (i = 0; i < numPlots; i++) {
        if (plots[i].eventName === eventName) {
            plot = plots[i];
        }
    }
    if (plot === undefined) {
        console.log("Unknown event received: " + eventName);
        // construct dummy key values
        var keysCSV = "";
        for (i = 0; i < numValues; i++) {
            keysCSV = "val" + i;
            if (i !== numValues - 1) {
                keysCSV += ",";
            }
        }
        console.log(keysCSV);
        plot = new Plot(eventName, keysCSV);
        plots.push(plot);
    }

    var values = [];
    for (var i = 0; i < numValues; i++) {
        var val = parseInt(valuesStr[i], 10);
        if (isNaN(val)) {
            console.log("error parsing to int: " + valuesStr[i]);
            val = 0;
        }
        if (val > plot.maxValue) {
            plot.maxValue = val;
        }
        values.push(val);
    }

    plot.data.push(values);
    plot.eventNumber += 1;
    redraw(plot);
}

function recvPlotInfo(pinfo) {
    console.log("GOT PLOT INFO: " + pinfo.eventName + ": " + pinfo.keysCSV);
    var plot = new Plot(pinfo.eventName, pinfo.keysCSV);
    plots.push(plot);
}

function recvFileName(fname) {
    console.log("filename received: " + fname);
    $("#heading").text(fname);
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    socket.on('data:filename', recvFileName);
    socket.on('data:plotinfo', recvPlotInfo);
    socket.on('data', recvData);
    socket.emit('client:ready');
};
//})();
