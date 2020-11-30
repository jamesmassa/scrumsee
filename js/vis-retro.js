/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */

//TODO:  Use the svg object passed to RetroChart instead of creating another svg

class RetroChart {
    constructor(data, parentElement) {
        this._data = data;
        this.parentElement = parentElement;
        this.margin = {top: 70, right: 60, bottom: 50, left: 60};
        this.width = (window.innerWidth / 3.5) - this.margin.left - this.margin.right;
        this.height = (window.innerHeight / 3.5) - this.margin.top - this.margin.bottom;
        this.dataColor = "#4e73df";
        this.initVis();
    }

    get data() {return this._data;}

//TODO Break up this overly long method
    initVis() {
        const vis = this;

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

        const sortedCategories = [
            "Backlog Requirements Grooming",
            "Story Estimation",
            "Story Prioritization",
            "Capacity Planning",
            "Dependency Planning",
            "Sprint Goal",
            "Daily Scrum",
            "Code Quality",
            "Product Quality",
            "Showcase"]

        sortedCategories.forEach(d => {
            const subset = vis.data.map(e => e[d]);
            const obj = {};
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

        //TODO replace scalelinear with scaleband

        // Scales and axes

        vis.x = d3.scaleLinear()
            .domain([0, vis.data.length - 1])
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([-5, 5])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d => "SS Sprint " + (d + 1))
            .ticks(vis.data.length - 1);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

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
            .attr("class", "axis-label")
            .attr("x", -60)
            .attr("y", -0)
            .text("Score")
            .style("font-size", "11px")

//TODO Make tooltips display or remove them
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

        vis.line = d3.line()
            .x( (d, i) => vis.x(i))
            .y(d => {
                const tot = d.reduce((a, b) => a + b);
                return vis.y(tot / d.length);
            })
            .curve(d3.curveMonotoneX);

        vis.svg.selectAll(".dotG")
            .data(d => {
                const cat = d3.keys(d)[0];
                return d[cat];
            })
            .enter()
            .append("g")
            .attr("class", function (d) {
                const cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                const tot = d.reduce( (a, b) =>  a + b);
                return "dotG " + cat + " " + tot / d.length;
            })
            .attr("transform", (d, i) => "translate(" + vis.x(i) + ",0)")
            .style("display", "none")
            .selectAll(".dots")
            .data(d => d)
            .enter()
            .append("circle")
            .attr("class", function () {
                const cat = d3.select(this.parentNode.parentNode.parentNode).attr("class").split(" ")[1];
                return "spots " + cat;
            })
            .attr("cy", function () {
                const mean = d3.select(this.parentNode).attr("class").split(" ")[2];
                return vis.y(mean);
            })
            .attr("r", 5)
            .attr("fill", this.dataColor)
            .on("click", unsplit);

        // Create path, circles, and legend for each metric
        vis.svg.append("path")
            .datum(d => d[d3.keys(d)[0]])
            .attr("class", function () {
                const cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                return "lines " + cat;
            })
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("stroke",this.dataColor)
            .attr("d", vis.line);

        vis.svg.selectAll(".dots")
            .data(d => d[d3.keys(d)[0]])
            .enter()
            .append("circle")
            .attr("class", function () {
                const cat = d3.select(this.parentNode.parentNode).attr("class").split(" ")[1];
                return "dots " + cat;
            })
            .attr("cx", (d, i) => vis.x(i))
            .attr("cy", d => {
                const tot = d.reduce( (a, b) => a + b);
                return vis.y(tot / d.length)
            })
            .attr("r", 5)
            .attr("fill", this.dataColor)
            .on("mouseover", function (d, i) {
                d3.select(this).attr("r", 8);
                $("#sprint-tool").show();
                $("#score-tool").show();
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 5);

                $("#sprint-tool").hide();
                $("#score-tool").hide();

            })
            .on("click", split);

        // Rect for detecting mouse events
        vis.svg
            .append("rect")
            .attr("class",  d => "rectangle " + d3.keys(d)[0])
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("opacity", 0)
            .on("mouseover", split)
            .on("mouseout", unsplit);

        // Transition functions
        function split() {
            const delay = 500;
            const cat = d3.select(this).attr("class").split(" ")[1];
            const str = d3.select(this).attr("class");
            const cat2 = str.substr(str.indexOf(' ')+1);
            $(".fit." + cat).show();
            d3.select(".fit." + cat)
                .transition()
                .duration(delay)
                .attr("x2", data => vis.x(data[1]))
                .attr("y2", data => vis.y(data[3]));
            $(".title." + cat).text(cat2 + " by Individual Votes");
            $(".dotG." + cat).show();
            d3.selectAll(".spots." + cat)
                .transition()
                .duration(delay)
                .attr("cy", d => vis.y(d));
            $(".dots." + cat).hide();
        }

        function unsplit() {
            const delay = 500;
            const cat = d3.select(this).attr("class").split(" ")[1];
            const str = d3.select(this).attr("class");
            const cat2 = str.substr(str.indexOf(' ')+1);
            d3.select(".fit." + cat)
                .transition()
                .duration(delay)
                .attr("x2", data => vis.x(data[0]))
                .attr("y2", data => vis.y(data[2]));
            $(".fit." + cat).delay(delay).hide(0);
            $(".title." + cat).text(cat2 + " by Average Score");
            d3.selectAll(".spots." + cat)
                .transition()
                .duration(delay)
                .attr("cy", function () {
                    const mean = d3.select(this.parentNode).attr("class").split(" ")[2];
                    return vis.y(mean);
                });
            $(".dots." + cat).delay(delay).show(0);
            $(".dotG." + cat).delay(delay).hide(0);
        }

        // Add title
        vis.svg
            .append("text")
            .attr("class", d => "title " + d3.keys(d)[0])
            .attr("text-anchor", "start")
            .attr("y", -vis.margin.top / 2)
            .attr("x", 0)
            .text(d =>  d3.keys(d)[0] + " by Average Score")

    };
}