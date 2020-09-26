/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */

//TODO:  Use the svg object passed from RetroChart instead of creating another svg

class RetroChart {
    constructor(data, parentElement) {
        this._data = data;

        this.parentElement = parentElement;
        this.filteredData = this.data;

        this.initVis();
    }

    get data() {return this._data;}


    initVis() {
        let vis = this;

        vis.margin = {top: 70, right: 60, bottom: 50, left: 60};

        vis.width = (window.innerWidth / 3.5) - vis.margin.left - vis.margin.right;
        vis.height = (window.innerHeight / 3.5) - vis.margin.top - vis.margin.bottom;

        // Clip paths
        d3.select(vis.parentElement)
            .append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("x", 0)
            .attr("y", 0);

        // Categories
        vis.metrics = d3.keys(vis.data[0]);

        // Split data
        vis.splitData = [];

        vis.metrics.forEach(function (d) {
            let subset = vis.data.map(function (e) {
                return e[d];
            });
            let obj = {};
            obj[d] = subset;
            vis.splitData.push(obj);
        });

        // SVG drawing area
        vis.svg = d3.select(vis.parentElement)
            .selectAll(".smallChart")
            .data(vis.splitData).enter()
            .append("svg")
            .attr("class", d => "smallChart " + d3.keys(d)[0])
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append('g')
            .attr("clip-path", "url(#clip)");

        // Scales and axes
        vis.x = d3.scaleLinear()
            .domain([0, vis.filteredData.length - 1])
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([-5, 5])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(function (d) {
                let lab = "Sprint " + (d + 1)
                if ((d + 1) === vis.data.length) {
                    lab += " (Active)";
                }
                return lab;
            })
            .ticks(vis.data.length - 1);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis);

        vis.svg.selectAll(".x-axis").select("path")
            .attr("transform", "translate(0," + (-vis.height / 2) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Axis labels
        vis.svg.append("text")
            .attr("class", "label")
            .attr("x", -50)
            .attr("y", -20)
            .text("Rating");


        // Tool tip
        vis.svg.append("text")
            .attr("id", "sprint-tool")
            .attr("class", "tip")
            .attr("x", 20)
            .attr("y", -40)
            .style("display", "none");

        vis.svg.append("text")
            .attr("class", "tip")
            .attr("id", "score-tool")
            .attr("x", 20)
            .attr("y", -20)
            .style("display", "none");

        vis.color.domain(vis.metrics);

        vis.line = d3.line()
            .x(function (d, i) {
                return vis.x(i);
            })
            .y(function (d) {
                let tot = d.reduce((a, b) => a + b);
                return vis.y(tot / d.length);
            })
            .curve(d3.curveMonotoneX);

        vis.svg.selectAll(".dotG")
            .data(function (d) {
                let cat = d3.keys(d)[0];
                return d[cat];
            })
            .enter()
            .append("g")
            .attr("class", function (d) {
                let cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                let tot = d.reduce(function (a, b) {
                    return a + b;
                });
                return "dotG " + cat + " " + tot / d.length;
            })
            .attr("transform", function (d, i) {
                return "translate(" + vis.x(i) + ",0)";
            })
            .style("display", "none")
            .selectAll(".dots")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("circle")
            .attr("class", function () {
                let cat = d3.select(this.parentNode.parentNode.parentNode).attr("class").split(" ")[1];
                return "spots " + cat;
            })
            .attr("cy", function () {
                let mean = d3.select(this.parentNode).attr("class").split(" ")[2];
                return vis.y(mean);
            })
            .attr("r", 5)
            .attr("fill", function () {
                return vis.color(d3.select(this).attr("class").split(" ")[1]);
            })
            .on("click", unsplit);

        // Create path, circles, and legend for each metric
        vis.svg.append("path")
            .datum(d => d[d3.keys(d)[0]])
            .attr("class", function () {
                let cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                return "lines " + cat;
            })
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("stroke", function () {
                return vis.color(d3.select(this).attr("class").split(" ")[1]);
            })
            .attr("d", vis.line);

        vis.svg.selectAll(".dots")
            .data(d => d[d3.keys(d)[0]])
            .enter()
            .append("circle")
            .attr("class", function () {
                let cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                return "dots " + cat;
            })
            .attr("cx", function (d, i) {
                return vis.x(i);
            })
            .attr("cy", function (d) {
                let tot = d.reduce(function (a, b) {
                    return a + b;
                });
                return vis.y(tot / d.length)
            })
            .attr("r", 5)
            .attr("fill", function () {
                return vis.color(d3.select(this).attr("class").split(" ")[1]);
            })
            .on("mouseover", function (d, i) {
                //d3.select(this).attr("r", 8);
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 5);

                $("#sprint-tool").hide();
                $("#score-tool").hide();

                $(".line").attr("opacity", 1);
                $(".dots").attr("opacity", 1);
            })
            .on("click", split);

        // Rect for detecting mouse events
        vis.svg
            .append("rect")
            .attr("class", function (d) {
                return "rectangle " + d3.keys(d)[0];
            })
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("opacity", 0)
            .on("mouseover", split)
            .on("mouseout", unsplit);

        // Transition functions
        function split() {
            let delay = 500;
            let cat = d3.select(this).attr("class").split(" ")[1];
            $(".fit." + cat).show();
            d3.select(".fit." + cat)
                .transition()
                .duration(delay)
                .attr("x2", function (data) {
                    return vis.x(data[1]);
                })
                .attr("y2", function (data) {
                    return vis.y(data[3]);
                });
            $(".title." + cat).text(cat + " - Individual Rating");
            $(".dotG." + cat).show();
            d3.selectAll(".spots." + cat)
                .transition()
                .duration(delay)
                .attr("cy", function (d) {
                    return vis.y(d);
                });
            $(".lines." + cat).hide();
            $(".dots." + cat).hide();
        }

        function unsplit() {
            let delay = 500;
            let cat = d3.select(this).attr("class").split(" ")[1];
            d3.select(".fit." + cat)
                .transition()
                .duration(delay)
                .attr("x2", function (data) {
                    return vis.x(data[0]);
                })
                .attr("y2", function (data) {
                    return vis.y(data[2]);
                });
            $(".fit." + cat).delay(delay).hide(0);
            $(".title." + cat).text(cat + " - Average Rating");
            d3.selectAll(".spots." + cat)
                .transition()
                .duration(delay)
                .attr("cy", function () {
                    let mean = d3.select(this.parentNode).attr("class").split(" ")[2];
                    return vis.y(mean);
                });
            $(".lines." + cat).delay(delay).show(0);
            $(".dots." + cat).delay(delay).show(0);
            $(".dotG." + cat).delay(delay).hide(0);
        }

        // Add title
        vis.svg
            .append("text")
            .attr("class", function (d) {
                return "title " + d3.keys(d)[0];
            })
            .attr("text-anchor", "start")
            .attr("y", -vis.margin.top / 2)
            .attr("x", 0)
            .text(function (d) {
                return d3.keys(d)[0] + " - Average Rating";
            })
            .style("fill", function (d) {
                return vis.color(d3.keys(d)[0])
            });

        // Add regression line
        vis.svg.append("line")
            .attr("class", function (d) {
                return "fit " + d3.keys(d)[0];
            })
            .datum(function (d) {
                return vis.regress(d[d3.keys(d)[0]]);
            })
            .attr("x1", function (data) {
                return vis.x(data[0])
            })
            .attr("x2", function (data) {
                return vis.x(data[0])
            })
            .attr("y1", function (data) {
                return vis.y(data[2]);
            })
            .attr("y2", function (data) {
                return vis.y(data[2]);
            })
            .style("display", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    };


    /*
     * Regression Function
     */
    regress(feedback) {

        let n = feedback.length;
        let y = feedback.map(function (data) {
            let tot = data.reduce(function (a, b) {
                return a + b
            });
            return tot / data.length;
        });
        let x = d3.range(n);

        let x_bar = x.reduce(function (a, b) {
            return a + b;
        }) / n;
        let y_bar = y.reduce(function (a, b) {
            return a + b;
        }) / n;

        let divisor = 0;
        let dividend = 0;
        for (let i = 0; i < n; i++) {

            let xr = x[i] - x_bar;
            let yr = y[i] - y_bar;
            divisor += xr * yr;
            dividend += xr * xr;
        }

        let b1 = divisor / dividend;
        let b0 = y_bar - (b1 * x_bar);

        return [0, n - 1, b0, b1 * (n - 1) + b0];
    };
}