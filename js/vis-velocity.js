/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */

//TODO:  Change to bar chart
//TODO:  Show/hide controls and chart and Retrospective when switching charts
//TODO:  Autosize to fit in area below the Scrum Diagram
//TODO:  Repoint to JiraRepo and decommission issuestore

class VelocityChart {
    constructor(data, parentElement, colorScheme, eventHandler) {
        this._data = data;
        this._eventHandler = eventHandler;

        this._parentElement = parentElement;
        this.issueStore = this.data;

        this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
        this.height = (window.innerHeight / 3) ;
        this.width = window.innerWidth;
        this.svg = new Svg(this.parentElement, this.width, this.height, this.margin).svg;

        this.colorScheme = colorScheme;

        this.priorities = this.issueStore.priorities;
        this.issueTypes = this.issueStore.issueTypes;
        this.components = this.issueStore.components;

        this.initVis();
        this.wrangleData();
        this.updateVis();
    }

    get data() {return this._data;}

    get svg() {return this._svg;}
    set svg(svg){this._svg = svg;}

    get eventHandler() {return this._eventHandler;}
    get parentElement() {return this._parentElement;}


    initVis() {
        const vis = this;

        //initialize initial data
        //TODO: filter by selected time band
        vis.displayData = vis.issueStore.getSprints().filter(function (d) {
            //Active or closed sprints only (no future)
            return d.state === "CLOSED" || d.state === "ACTIVE";
        }).sort(function (a, b) {
            return a.endDate - b.endDate;
        });

        //TODO: filter by selected time band
        const maxSprints = 10;
        vis.startingSprint = Math.max(0, vis.displayData.length - maxSprints);
        vis.displayData = vis.displayData.slice(vis.startingSprint, vis.displayData.length);

        //set default layer
        vis.currentLayer = priorityLayer;
        vis.currentMetric = totalStoryPoints;

        // TO-DO: Overlay with path clipping
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.svg.append("g")
            .attr("class", "visLegend");


        // Scales and axes
        vis.xRange = this.splitRange([0, vis.width], vis.displayData.length);
        vis.x = d3.scaleOrdinal()
            .range(vis.xRange)
            .domain(vis.displayData.map( d => d.name));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat("");

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg
            .append("g")
            .append("text")
            .attr("class", "legend yLegend velocityMetric")
            .attr("y", 0 - vis.margin.top / 2 - 20)
            .attr("x", 0 - vis.margin.left / 2 - 170)
            .attr("transform", "rotate(-90)")
            .text(() => $("#issue-metric-selector option:selected").text());

        // TO-DO: Tooltip placeholder
        vis.svg.append("text")
            .attr("class", "layer")
            .attr("id", "layer-name")
            .attr("x", 20)
            .attr("y", 20);

        //tool tip
        vis.tool_tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-8, 0])
            .html(() => "tool tip");
        vis.svg.call(vis.tool_tip);

        // This allows to find the closest X index of the mouse:
        vis.bisect = d3.bisector(d => d.name).left;

        // Initialize stack layout
        vis.colorScale = d3.scaleOrdinal();

        //Add selection object
        const metricSvg = new Svg("#velocityIssuePropertyLegend", 200, vis.height, {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        });
        vis.issuePropertyControl = new IssuePropertyControl(metricSvg.svg, vis.colorScheme, vis.eventHandler, vis.issueStore, "velocity-property-legend");

        //add event handler
        $(vis.eventHandler).bind("selectedMetricChange", function (event, selection) {
            vis.onSelectedMetricChange(selection);
        });

    };

    /*
     * Data wrangling
     * (Filter, aggregate, modify data)
     */

    wrangleData() {
        const vis = this;
        vis.colorScale.range(vis.colorScheme.filter(function (d, i) {
            //needed as the legend needs the domain and range lengths to match
            return i < vis.issueStore.selectedIssueProperty.length;
        }));
        vis.colorScale.domain(vis.issueStore.selectedIssueProperty);

        const stack = d3.stack()
            .keys(vis.colorScale.domain())
            .value( (d, key) => d[vis.currentMetric][vis.currentLayer][key]);

        // Stack data
        vis.stackedData = stack(vis.displayData);

        // Stacked area layout
        vis.area = d3.area()
            .curve(d3.curveLinear)
            .x(d => vis.x(d.data.name))
            .y0(d => vis.y(d[0]))
            .y1(d => vis.y(d[1]));

    }

    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     * Function parameters only needed if different kinds of updates are needed
     */

    updateVis() {
        const vis = this;

        // Update domain
        // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
        vis.y.domain([0, d3.max(vis.stackedData, d => d3.max(d, e => e[1]))]);

        //const dataCategories = vis.colorScale.domain();

// Draw the layers
        const categories = vis.svg.selectAll(".area")
            .data(vis.stackedData);
        //.data(vis.displayData);

        categories.enter().append("path")
            .attr("class", "area")
            .merge(categories)
            .transition(1000)
            .style("fill", (d, i) => vis.colorScale(vis.issueStore.selectedIssueProperty[i]))
            .attr("d",  d => vis.area(d));

        categories.exit().remove();

        // Create the line that travels along the curve of chart
        const verticalLine = vis.svg
            .append('g')
            .append('line')
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", "1")
            .style("opacity", 0);

        const custom_tooltip = function (d) {
            let obj = {};
            obj.header = d.vis.stackedData[0][d.i].data.name;
            obj.rows = [];
            d.vis.issueStore.selectedIssueProperty.forEach(function (layer, i) {
                const val = d.vis.stackedData[i][d.i][1] - d.vis.stackedData[i][d.i][0];
                if (val > 0)
                    obj.rows.push({
                        "label": layer,
                        "value": d.vis.stackedData[i][d.i][1] - d.vis.stackedData[i][d.i][0]
                    });
            });

            vis.toolTipTable = tooltip.table()
                .width(200)
                .call(this, obj);
        };

        // Create a rect on top of the svg area: this rectangle recovers mouse position
        vis.svg
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', vis.width)
            .attr('height', vis.height)
            .on('mouseover',  () => verticalLine.style("opacity", 1))
            .on('mousemove', function () {
                // recover coordinate we need
                const i = this.findClosestPoint(vis.xRange, d3.mouse(this)[0]);
                verticalLine
                    .attr("x1", vis.x(vis.stackedData[0][i].data.name))
                    .attr("y1", vis.y(vis.stackedData[vis.stackedData.length - 1][i][1]))
                    .attr("x2", vis.x(vis.stackedData[0][i].data.name))
                    .attr("y2", vis.height);

                custom_tooltip.call(this, {"vis": vis, "i": i});
            })
            .on('mouseout', function () {
                verticalLine.style("opacity", 0);
                vis.toolTipTable.close();
            });

        // Call axis functions with the new domain

        vis.svg.select(".x-axis").call(vis.xAxis)

            .selectAll("text")
            .attr("class", "x-axis")
            .attr("y", 25)
            .attr("x", -20)
            .attr("dy", ".35em")
            //.attr("transform", "rotate(25)")
            .style("text-anchor", "start")
            .text(function (d, i) {
                let curSprint = "Sprint " + (i + vis.startingSprint + 1);
                if (d === vis.issueStore.activeSprint.name) curSprint += "(Active)";
                return curSprint;
            });

        vis.svg.select(".y-axis").call(vis.yAxis);

    };

    onSelectedLayerChange(selection) {

        switch (selection) {
            case "priorities":
                this.currentLayer = priorityLayer;
                break;
            case "components":
                this.currentLayer = componentLayer;
                break;
            case "issueType":
                this.currentLayer = issueTypeLayer;
                break;
        }

        this.wrangleData();
        this.issuePropertyControl.updateVis();
        this.updateVis();

    };

    onSelectedMetricChange(selection) {

        switch (selection) {
            case "totalStoryPoints":
                this.currentMetric = totalStoryPoints;
                break;
            case "completedStoryPoints":
                this.currentMetric = completedStoryPoints;
                break;
            case "issueCount":
                this.currentMetric = issueCount;
                break;
        }
        d3.select(".velocityMetric")
            .text(() => $("#issue-metric-selector option:selected").text());

        this.wrangleData();
        this.updateVis();
    };

    onSelectedVisualizationChange() {
        const vis = this;
        vis.issuePropertyControl.updateVis();
        vis.updateVis();
    };

    //Method that returns discrete values of a range given start, end, and # of values
    splitRange(range, n) {
        if(n <=2 ) return range;
        const increment = (range[1] - range[0])/(n-1);
        return d3.range(0,n).map( d => range[0] + d*increment);
    };

    findClosestPoint(range, value) {
        let result = 0;
        let min = 10000000;

        range.forEach(function (d, i) {
            if(Math.abs(d - value) < min) {
                min = Math.abs(d - value);
                result = i;
            }
        });
        return result;
    }
}
