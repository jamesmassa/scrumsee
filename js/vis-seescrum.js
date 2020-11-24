/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
class SeeScrum {

    constructor(svg, scrumTextStore, retroStore, jiraRepo, ifaData) {
        this.svg = svg;
        this._scrumTextStore = scrumTextStore;
        this._retroStore = retroStore;
        this._jiraRepo = jiraRepo;
        this._ifaData = ifaData

        this.drawScrumDiagram();
    }

    drawScrumDiagram(){
        this.svg.svg.selectAll("*").remove();
        this.setColors();
        this.setShapeData();
        this.renderRectangles();
        this.renderCircles();
        this.renderCircleText();
        this.renderVideoAndInfoIcons();
        this.renderRectText();
        this.renderSprintArc();
        this.renderScrumArc();
        this.populateSprintSelector();
        this.setSummaryStats();
        this.setClickHandlers();
        this.setIfaModalData();
    }

    setIfaModalData(){
        const div = document.querySelector('#sprint-planning-alerts');
        const data = this._ifaData;
        const mustSplit = "<h5>Large Stories to Split</h5><br>" + JSON.stringify(data.mustSplit) + "<br>";
        const noEpic = "<br><h5>Stories with no Epic</h5><br>" + JSON.stringify(data.noEpic) + "<br>";
        const unassigned = "<br><h5>Stories with no Assignee</h5><br>" + JSON.stringify(data.unassigned) + "<br>";
        const notFibonacci = "<br><h5>Stories Whose Estimate is Not in Fibonacci Sequence</h5><br>" + JSON.stringify(data.notFibonacci) + "<br>";
        div.innerHTML = mustSplit + noEpic + unassigned + notFibonacci;
    }

    handleRectClick(d) {

        switch (d.name) {
            case "backlog":
                window.open("https://seescrum.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=SS&view=planning&&epics=visible", "_blank");
                break;
            case "planning":
                this.handleChartClick("#velocity-chart", "Velocity Chart");
                break;
            case "sprint-backlog":
                window.open("https://seescrum.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=SS", "_blank");
                break;
            case "increment":
                const activeSprint = this.jiraRepo.activeSprint.number - 1;
                window.open("https://seescrum.atlassian.net/issues/?jql=project%20%3D%20SS%20and%20status%20%3D%20Done%20and%20sprint%3D" + activeSprint, "_blank");
                break;
            case "showcase":
                break;
            case "retrospective":
                this.handleChartClick("#retrospective-chart", "Retrospective Chart");
                break;
            default:
                alert ("unhandled click for " + d.name);
                break;
        }
    }

    handleCircleClick(d) {

        let text = "";
        let url = "";
        const data = this.scrumTextStore.data;

        switch (d.name) {
            case "scrum":
                alert("Scrum Under Construction");
                return;
            case "sprint":
                alert("Sprint Under Construction");
                return;
            default:
                text = data.text[d.name.slice(5)];
                url = data.url[d.name.slice(5)];
                break;
        }

        const g = this.svg.svg.append("g");

        g.append("rect")
            .attr("class", "help")
            .attr("id", "help-rect")
            .attr("fill", this.helpBackgroundColor)
            .attr("width", this.svg.width)
            .attr("height", this.svg.height)
            .attr("y", 0)
            .attr("x", 0)
            .on("mouseover", function () {d3.select(this).style("cursor", "default");});

        const helpTextHtml = '<div id="help-text" style="color: black "><h4>' +
            text + '</h4></div>';

        this.appendHTML(g, helpTextHtml,
            this.svg.width * 0.95,
            this.svg.height,
            this.svg.width * 0.05,
            this.svg.height * 0.2,
            "default",
            null,
            "white");

        const closeHelpButtonHtml = this.getButtonHtml("help-close", "Close");

        this.appendHTML(g, closeHelpButtonHtml,
            this.svg.width * 0.06 ,
            this.svg.height * 0.3,
            this.svg.width * 0.9,
            this.svg.height * 0.6,
            "pointer",
            null,
            "white");

        document.querySelector("#help-close").onclick = () => {
            d3.select("#help-text").remove();
            d3.select("#help-close").remove();
            d3.select("#help-rect").remove();
            this.drawScrumDiagram();
        };

        const g2 = this.svg.svg.append("g");
        const findOutMoreHtml = this.getButtonHtml("find-out-more", "Find out more");

        this.appendHTML(g2, findOutMoreHtml,
            this.svg.width * 0.13,
            this.svg.height * 0.3,
            this.svg.width * 0.75,
            this.svg.height * 0.6,
            "pointer",
            null,
            "white");

        document.querySelector("#find-out-more").onclick = () => {
            window.open(url, "_blank");
        };

    }

    getButtonHtml(id, text){
        let buttonHtml =  '<button id="' + id +
            '" style="padding: 15px; color: white; background-color: #4565C4; border-radius: 5px; outline: none;">' +
            text;

        if (id === "find-out-more") {
            buttonHtml += '&nbsp;&nbsp;<i class="fas fa-external-link-alt"></i>';
        }

        buttonHtml += '</button>';

        return buttonHtml;
    }


    setShapeData(){

        this.circleHelpRadius = 10;
        const circleCy = this.circleHelpRadius;
        this.arcCenterOffset = 0.98;

        const xPct = this.svg.width / 100;
        const yPct = this.svg.height / 100;

        const widthPreSprintArrowRect = 40 * xPct;
        const startPostSprintArrowRect = 62 * xPct;
        const widthPostSprintArrowRect = 33 * xPct;
        const heightBottomArrowRect = 15 * yPct;

        const rectSpacer = xPct;
        this.dataRectWidth = (widthPreSprintArrowRect / 3.08) - rectSpacer;
        const dataRectHeight = 100 * yPct;
        const dataRectY = (100 * yPct) - dataRectHeight;

        this.sprintArcData  = [
            { "name": "sprint-arc", "innerRadius": 80, "outerRadius": 105, startAngle: -0.33, endAngle: 0.5, "x": 2, "y": 2 }
        ];

        this.scrumArcData  = [
            { "name": "daily-scrum-arc", "innerRadius": 25, "outerRadius": 40, startAngle: -0.3, endAngle: 0.45, "x": 2, "y": 3.3 }
        ];

        this.arcMarkerData = [
            { id: 0, name: 'circle', path: 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewbox: '-6 -6 12 12' },
            { id: 1, name: 'square', path: 'M 0,0 m -5,-5 L 5,-5 L 5,5 L -5,5 Z', viewbox: '-5 -5 10 10' },
            { id: 2, name: 'arrow', path: 'M 0,0 m -5,-5 L 5,0 L -10,10 Z', viewbox: '-5 -5 10 10' },
            { id: 3, name: 'stub', path: 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z', viewbox: '-1 -5 2 10' }
        ];

        const sprintArcData = this.sprintArcData[0];
        const scrumArcData = this.scrumArcData[0];
        this.circleData = [
            { "name": "help-backlog", "text": "?", "cx":50, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "help-planning", "text": "?", "cx":75, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "help-sprint-backlog", "text": "?", "cx":100, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "help-increment", "text": "?", "cx":125, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "help-showcase", "text": "?", "cx":150, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "help-retrospective", "text": "?", "cx":175, "cy": circleCy, "r": this.circleHelpRadius },

            {
                "name": "scrum",
                "text": "24 Hr",
                "cx":(this.arcCenterOffset * this.svg.width / sprintArcData.x) + sprintArcData.outerRadius + scrumArcData.outerRadius - scrumArcData.innerRadius,
                "cy": this.svg.height / scrumArcData.y,
                "r": scrumArcData.innerRadius + 1 },
            {
                "name": "sprint",
                "text": "",
                "cx": this.arcCenterOffset * this.svg.width / sprintArcData.x,
                "cy": this.svg.height / sprintArcData.y,
                "r": sprintArcData.innerRadius + 1
            }
        ];

        this.rectData  = [
            { "name": "backlog", "text": "", "x": 0.5 * rectSpacer, "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "planning", "text": "", "x": 1.5 * rectSpacer + this.dataRectWidth, "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "sprint-backlog", "text": "", "x": 2.5 * rectSpacer + 2 * this.dataRectWidth, "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "pre-sprint-arrow", "text": "", "x":0.5 * rectSpacer, "y": this.svg.height - heightBottomArrowRect, "width": widthPreSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor, "isClickable": false },
            { "name": "increment", "text": "", "x": startPostSprintArrowRect, "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "showcase", "text": "Showcase", "x": startPostSprintArrowRect + this.dataRectWidth + rectSpacer, "y": dataRectY, "width": this.dataRectWidth , "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "retrospective", "text": "", "x": startPostSprintArrowRect + (2 * this.dataRectWidth) + (2 * rectSpacer), "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "post-sprint-arrow", "text": "", "x": startPostSprintArrowRect, "y": this.svg.height - heightBottomArrowRect, "width": widthPostSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor, "isClickable": false }
        ];
    }

    setColors(){

        this.circleColor = "gray";
        this.dataRectColor = "#4e73df";
        this.arrowColor = "#4565C4";
        this.helpBackgroundColor = "#ffffff";
    }

    renderCircles(){

        const circle = this.svg.svg.selectAll("circle")
            .data(this.circleData, d=> d.id );

        circle.enter().append("circle")
            .attr("class", "circle")
            .attr("fill",this.circleColor)
            .attr("r", d => d.r)
            .attr("cy", d => d.cy)
            .attr("cx", d => this.getCircleCx(d.name, d.cx))
            .on("click", d => this.handleCircleClick(d))
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            })
            .on("mouseout", function () {
                d3.select(this).style("cursor", "default");
            });
    }

    getCircleCx(name, cx){

        switch (name) {
            case "sprint":
            case "scrum":
                return cx;

            case "help-backlog":
            case "help-planning":
            case "help-sprint-backlog":
            case "help-increment":
            case "help-showcase":
            case "help-retrospective":
                let rectangle = this.rectData.find(rect => rect.name === name.slice(5));
                return rectangle.x + this.circleHelpRadius;

            default:
                alert("unrecognized circle");
                return null;
        }
    }

    setMarkerArrowHead(name) {
        this.svg.svg.append("svg:defs").append("svg:marker")
            .attr("id", name)
            .attr('markerHeight', 20)
            .attr('markerWidth', 20)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', "auto")
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('viewBox', this.arcMarkerData[2].viewbox)
            .append('svg:path')
            .attr('d', this.arcMarkerData[2].path )
            .attr('fill', this.arrowColor);

    }

    setMarkerLine(name, x1, y1, height, width){
        this.svg.svg.append("line")
            .attr("x1", x1 )
            .attr("y1", y1 + 0.5 * height)
            .attr("x2", x1 + 1.1 * width)
            .attr("y2", y1 + 0.5 * height)
            .attr("stroke-width", 5)
            .attr("stroke", this.arrowColor)
            .attr("marker-end", "url(#" + name + ")");
    }

    renderRectangles(){

        //Draw all rects
        const rect = this.svg.svg.selectAll("rect")
            .data(this.rectData, d=> d.id );

        rect.enter().append("rect")
            .attr("class", "rect")
            .attr("id", d => d.name)
            .attr("fill", d => d.color)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("y", d => d.y)
            .attr("x", d => d.x)
            .attr("rx", 6)
            .attr("ry", 6)
            .on("click", d => this.handleRectClick(d))
            .on ("mouseover",function(d) {
                if (d.isClickable) {
                    d3.select(this).style("cursor", "pointer");
                }
            })
            .on ("mouseout",function(d) {
                if (d.isClickable) {
                    d3.select(this).style("cursor", "default");
                }
            });

        //Marker Arrowheads
        this.setMarkerArrowHead("pre-sprint-arrowhead");
        const preSprintRect = this.rectData.find(rect => rect.name === "pre-sprint-arrow");
        this.setMarkerLine(
            "pre-sprint-arrowhead",
            preSprintRect.x,
            preSprintRect.y,
            preSprintRect.height,
            preSprintRect.width * 0.9
        );

        this.setMarkerArrowHead("post-sprint-arrowhead");
        const postSprintRect = this.rectData.find(rect => rect.name === "post-sprint-arrow");
        this.setMarkerLine(
            "pre-sprint-arrowhead",
            postSprintRect.x,
            postSprintRect.y,
            postSprintRect.height,
            postSprintRect.width * 0.95
        );

    }

    getArcGenerator(arcData){
        const arcLengthBase = 2 * Math.PI;

        return d3.arc()
            .innerRadius(arcData.innerRadius)
            .outerRadius(arcData.outerRadius)
            .startAngle(arcData.startAngle * arcLengthBase)
            .endAngle(arcData.endAngle * arcLengthBase);
    }

    renderSprintArc() {
        const data = this.sprintArcData[0];
        const arcWidth = data.outerRadius - data.innerRadius;

        const arcGenerator = this.getArcGenerator(data);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" + (this.arcCenterOffset * this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.sprintArcData, d => d.id);

        const defs = g.append('svg:defs');

        defs.append('svg:marker')
            .attr('id', 'marker-arrow')
            .attr('markerHeight', 40)
            .attr('markerWidth', 40)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', '180')
            .attr('refX', 0.1 * arcWidth)
            .attr('refY', 0)
            .attr('viewBox', this.arcMarkerData[2].viewbox)
            .append('svg:path')
            .attr('d', this.arcMarkerData[2].path )
            .attr('fill', this.arrowColor);

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arrowColor)
            .attr('marker-start', 'url(#marker-arrow)' );

        const sprintName = this.jiraRepo.activeSprint.name;

//Create an SVG path (based on bl.ocks.org/mbostock/2565344)
        g.append("path")
            .attr("id", "sprint-arc-text") //Unique id of the path
            .attr("d", "M-92.01220140460568,50.584135780680114A105,105,0,1,1,6.429395695523604e-15,105L4.898587196589413e-15,80A80,80,0,1,0,-70.10453440350909,38.54029392813723Z") //SVG path
            .style("fill", "none");

//Create an SVG text element and append a textPath element
        g.append("text")
            .attr("dy", 18)
            .append("textPath") //append a textPath to the text element
            .attr("xlink:href", "#sprint-arc-text") //place the ID of the path here
            .style("text-anchor","middle") //place the text halfway on the arc
            .attr("startOffset", "22%")
            .text(sprintName);
    }

    renderScrumArc() {
        const data = this.scrumArcData[0];
        const arcWidth = data.outerRadius - data.innerRadius;

        const arcGenerator = this.getArcGenerator(data);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" +
                (this.arcCenterOffset * this.svg.width / data.x + this.sprintArcData[0].outerRadius + arcWidth)  + "," +
                (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.scrumArcData, d => d.id);

        const markerArc = g.selectAll("path")
            .data(this.scrumArcData, d => d.id );

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arrowColor);

        const defs = g.append('svg:defs');

        defs.append('svg:marker')
            .attr('id', 'marker-scrum-arrow')
            .attr('markerHeight', 30)
            .attr('markerWidth', 30)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', '270')
            .attr('refX', -0.2 * arcWidth)
            .attr('refY', 0.1 * arcWidth)
            .attr('viewBox', this.arcMarkerData[2].viewbox)
            .append('svg:path')
            .attr('d', this.arcMarkerData[2].path )
            .attr('fill', this.arrowColor);

        data.startAngle = data.endAngle;
        const markerArcGenerator = this.getArcGenerator(data);

        markerArc.enter().append("path")
            .attr("class", "arc")
            .attr("d", markerArcGenerator)
            .attr("fill", this.arrowColor)
            .attr('marker-start', 'url(#marker-scrum-arrow)' );

//Create an SVG path (based on bl.ocks.org/mbostock/2565344)
        g.append("path")
            .attr("id", "scrum-arc-text") //Unique id of the path
            .attr("d", "M-38.042260651806146,12.360679774997891A40,40,0,1,1,12.360679774997898,38.04226065180614L7.725424859373686,23.776412907378838A25,25,0,1,0,-23.77641290737884,7.725424859373682Z") //SVG path
            .style("fill", "none");

//Create an SVG text element and append a textPath element
        g.append("text")
            .attr("dy", 14)
            .append("textPath") //append a textPath to the text element
            .attr("xlink:href", "#scrum-arc-text") //place the ID of the path here
            .style("text-anchor","middle") //place the text halfway on the arc
            .attr("startOffset", "24%")
            .text("Daily Scrum")
            .style("font-size", "smaller");
    }

    renderRectText(){
        const activeSprint = this.jiraRepo.activeSprint;
        const committed = this.jiraRepo.activeStories.totalStoryPoints;
        const committedStoryCount = this.jiraRepo.activeStories.issues.length;
        const completed = this.jiraRepo.activeStories.completedStoryPoints;
        const completedStoryCount = this.jiraRepo.activeStories.issues.filter(issue=> issue.status.name === "Done").length;
        const backlogStoryCount = this.jiraRepo.backlog.issues.length;
        const averageHappiness = this.retroStore.getSprintHappiness(activeSprint).toFixed(2);
        const burndownPct =  (100 * completed / committed).toFixed()+"%";

        const totalIFAs = this._ifaData.mustSplit.length +
            this._ifaData.noEpic.length +
            this._ifaData.notEstimated.length +
            this._ifaData.notFibonacci.length +
            this._ifaData.unassigned.length;

        this.rectData.forEach(rect => {

            let text, text2, text3 = null;

            switch (rect.name) {
                case "backlog":
                    text = "Product Backlog ";
                    text2 = backlogStoryCount + " stories ";
                    break;

                case "planning":
                    text = "Sprint Planning ";
                    break;

                case "sprint-backlog":
                    text = "Sprint Backlog";
                    text2 = committed + " points";
                    text3 = committedStoryCount + " stories";
                    break;

                case "increment":
                    text = "Product Increment ";
                    text2 = completed + " points ";
                    break;

                case "showcase":
                    text = rect.text;
                    break;

                case "retrospective":
                    text = "Retrospective";
                    break;

                default:
                    break;
            }

            const xPos = rect.x + (rect.width / 2);
            const yPos = rect.y + (rect.height / 2);
            const g = this.svg.svg.append('g')
                .attr("transform", "translate(" + xPos + "," + yPos + ")");

            if (text && text && text3) {
                this.appendRectText(g, -18, text, rect.name);
                this.appendRectText(g, 0, text2, rect.name);
                this.appendRectText(g, 18, text3, rect.name);
            } else if (text && text2) {
                this.appendRectText(g, -18, text, rect.name);
                this.appendRectText(g, 0, text2, rect.name);
            } else if (text) {
                this.appendRectText(g, -18, text, rect.name);
            }

            let html = "";
            switch (rect.name) {

                case "backlog":
                    break;

                case "planning":
                    html = '<button class="btn btn-primary" data-toggle="modal" data-target="#sprintPlanningAlertsModal">' + totalIFAs + ' Alerts</button>';
                    this.appendHTML(g, html, 100, 40, -50, -10, "pointer", null, this.dataRectColor);
                    break;

                case "sprint-backlog":
                    break;

                case "increment":
                    const y = this.svg.height * 0.3;
                    const textElem = this.appendRectText(g, y, burndownPct + " Done", rect.name);
                    textElem.attr("font-size", "x-large");
                    textElem.attr("x", -15);

                    html = '<i class="fas fa-fire fa-2x" style="color:orange; background-color: ' + this.dataRectColor + ';"></i>';
                    this.appendHTML(g, html, 30, 31.8, 50, y * 0.5, "pointer", this.handleFireClick, this.dataRectColor);
                    break;

                case "showcase":
                    html = '<a id="showcase-video"><img src="img/yt_icon_rgb.png" alt="YouTube video" width="50" </a>';
                    this.appendHTML(g, html, 50, 40, -25, 10, "pointer", this.handleShowcaseClick, this.dataRectColor);
                    break;

                case "retrospective":
                    this.appendFaceIcon(g, averageHappiness);
                    break;
            }
        });
    }

    handleFireClick(){
        //TODO Clicking on fire can open the burn down chart instead of story list
        const activeSprint = jiraRepo.activeSprint.number - 1;
        window.open("https://seescrum.atlassian.net/issues/?jql=project%20%3D%20SS%20and%20status%20%3D%20Done%20and%20sprint%3D" + activeSprint, "_blank");
    }

    handleShowcaseClick()
    {
        //TODO replace hardcoding of showcase video with picking the right video for the particular showcase
        //Need a historical sprint selector too to make this more valuable
        window.open("https://youtu.be/3dg86TigI0w", "_blank");
    }

    appendFaceIcon(g, averageHappiness) {
        let color = "";
        let icon = "";

        if (averageHappiness > 0) {
            color = "darkgreen";
            icon = "fa-smile-beam";
        } else if(averageHappiness < 0){
            color = "darkRed";
            icon = "fa-sad-tear";

        } else {
            color = "darkorange";
            icon = "fa-meh";
        }

        const html = '<span style="color:' + color + '">' +
            averageHappiness +
            '&nbsp;&nbsp;<i class="fas ' + icon + ' fa-1x" style="font-size: xx-large"</i></span>';

        this.appendHTML(g, html, 120, 50, -50,-8.5, "pointer", this.handleRetroClick, this.dataRectColor);

    }


    handleChartClick(chartElemId, chartName){

        //If a chart is already showing, hide it
        const activeChart = document.querySelector(".active-chart");
        if (activeChart) {
            activeChart.style.display = "none";
            activeChart.className = "viz";
        }

        let chartNameElement = document.querySelector("#chart-name");
        chartNameElement.innerText = chartName;

        let chartElement = document.querySelector(chartElemId);
        chartElement.style.display = "block";
        chartElement.className = "viz active-chart";

        if (chartElement.id === "velocity-chart") {
            document.querySelector("#ranking-type").style.display = "block";
            document.querySelector("#ranking-type-label").style.display = "block";
        } else {
            document.querySelector("#ranking-type").style.display = "none";
            document.querySelector("#ranking-type-label").style.display = "none  ";
        }
    }

    appendHTML(g, html, width, height, x, y, cursor, callback, backgroundColor){
        g.append('svg:foreignObject')
            .attr("width", width)
            .attr("height", height)
            .attr("text-anchor", "middle")
            .attr("x", x)
            .attr("y", y)
            .append("xhtml:body")
            .html(html)
            .style("font-weight", "bold")
            .style("font-size", "larger")
            .style("background-color", backgroundColor)
            .on("click", d => {
                if (callback != null) {
                    callback(d)
                }
            })
            .on("mouseover", function () {
                d3.select(this).style("cursor", cursor);
            });
    }

    appendRectText(g, y, text, name) {

        return g.append("text")
            .data([{"name": name}])
            .attr("id", text + "-name")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("y", y )
            .text(text)
            .style("font-weight", "bold")
            .on("click", d => this.handleRectClick(d))
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            });

    }

    renderCircleText(){
        const circleText = this.svg.svg.selectAll("text")
            .data(this.circleData);

        circleText.enter().append("text")
            .attr("class", "circle-text")

            .merge(circleText)
            .text(d=> d.text)
            .attr("x", d => d.name === "scrum" ?
                this.getCircleCx(d.name, d.cx) - (0.6 * d.r) :
                this.getCircleCx(d.name, d.cx) - (0.3 * d.r) )
            .attr("y", d=> d.name === "scrum" ?
                d.cy + (0.2 * d.r) :
                d.cy + (0.5 * d.r) )
            .attr("fill", "black")
            .style("font-weight", "bold")
            .style("font-size", "12")
            .on("click", d => this.handleCircleClick(d))
            .on ("mouseover",function() {
                    d3.select(this).style("cursor", "pointer");
                }
            );
        
        circleText.exit().remove();

        const sprint = this.jiraRepo.activeSprint;

        const data = this.sprintArcData[0];
        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" + (this.arcCenterOffset * this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");

        const sprintStart = sprint.startDate;
        const sprintEnd = sprint.endDate;
        const sprintLength = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000*60*60*24));
        const currentDay = new Date();
        const dayOfSprint = Math.ceil((currentDay.getTime() - sprintStart.getTime()) / (1000*60*60*24));
        const sprintDaysLeft = Math.max(0, sprintLength - dayOfSprint);

        g.append("text")
            .data([{"name": "sprint"}])
            .attr("fill", "black")
            .attr("y", 0 )
            .attr("text-anchor", "middle")
            .text(sprintDaysLeft + " Days Left ")
            .style("font-weight", "bold")
            .style("font-size", "x-large")
            .on("click", d => this.handleCircleClick(d))
            .on ("mouseover",function() {d3.select(this).style("cursor", "pointer");});
    }

    renderVideoAndInfoIcons() {
        this.circleData.forEach(circle => {
            if (circle.name.slice(0,4) === "help") {

                const xPosInfo = this.getCircleCx(circle.name, circle.cx);
                const yPosInfo = circle.cy;
                const gInfo = this.svg.svg.append('g')
                    .attr("transform", "translate(" + xPosInfo + "," + yPosInfo + ")");
                const infoName = "info" + circle.name.slice(4);

                this.appendInfoIcon(gInfo, infoName,12, -13);

                const xPosVideo = this.getCircleCx(circle.name, circle.cx) + this.circleHelpRadius + 2;
                const yPosVideo = circle.cy;
                const gVideo = this.svg.svg.append('g')
                    .attr("transform", "translate(" + xPosVideo + "," + yPosVideo + ")");
                const videoName = "video" + circle.name.slice(4);

                this.appendVideoIcon(gVideo, videoName,40, -0);
            }
        });
    }


    appendInfoIcon(g, infoName, x, y) {
        const html = '<i class="fas fa-info-circle fa-1x" id="' + infoName + '" </i>';
        this.appendHTML(g, html, 20, 25, x,y, "pointer", this.handleInfoClick(infoName), this.dataRectColor);

        g.append('svg:foreignObject')
            .attr("width", 20)
            .attr("height", 25)
            .attr("text-anchor", "middle")
            .attr("x", x)
            .attr("y", y)
            .append("xhtml:body")
            .html(html)
            .style("font-weight", "bold")
            .style("font-size", "larger")
            .style("background-color", this.dataRectColor)
            .on("click", d => this.handleInfoClick(infoName))
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            });
    }

    appendVideoIcon(g, videoName, x, y) {
        const html = '<img src="img/yt_icon_mono_light.png" id="' + videoName + '" alt="YouTube Video" height="32">';

        g.append('svg:foreignObject')
            .attr("width", 50)
            .attr("height", 32)
            .attr("text-anchor", "middle")
            .attr("x", x)
            .attr("y", y)
            .append("xhtml:body")
            .html(html)
            .style("font-weight", "bold")
            .style("font-size", "larger")
            .style("background-color", this.dataRectColor)
            .on("click", d => this.handleVideoClick(videoName))
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            });
    }

    handleInfoClick(name){

    }

    handleVideoClick(videoName){
        //TODO replace hard coding of video name with detection of name

        switch (videoName) {
            case("video-planning"):
                window.open("https://youtu.be/GLHcTmXSftQ", "_blank");
        }
    }

    setSummaryStats(){
        const activeSprint = this.jiraRepo.activeSprint;
        const velocity = this.jiraRepo.previousSprint.completedStoryPoints;

        document.querySelector("#scrum-velocity").innerText = velocity + " story points";
        document.querySelector("#total-blockers").innerText = activeSprint.totalBlockers;
        document.querySelector("#sprint-goal").innerText = activeSprint.goal;

    }

    get jiraRepo(){return this._jiraRepo};
    
    populateSprintSelector() {
        const selectorElem = document.querySelector("#sprint-selector");

        const sprints = this.jiraRepo.sprints;
        sprints.sprints.forEach((sprint)=> {
            const optionElement = document.createElement("option");
            optionElement.value= sprint.id;
            selectorElem.appendChild(optionElement);

            let sprintName = sprint.name;
            if (sprint.state === "ACTIVE") {
                sprintName += " - Active Sprint";
                selectorElem.value = sprint.id;
            }
            optionElement.innerHTML = sprintName;
        });
    }


    setClickHandlers() {
        document.querySelector("#sprint-selector").onchange = () => {
            $(eventHandler).trigger("selectedSprintChange", d3.select("#sprint-selector").property("value"));
        };

        document.querySelector("#velocity-card").onclick = () => {
            window.open("https://seescrum.atlassian.net/secure/RapidBoard.jspa?projectKey=SS&rapidView=1&view=reporting&chart=velocityChart", "_blank");
        };

        const activeSprint = this.jiraRepo.activeSprint;
        document.querySelector("#blockers-card").onclick = () => {
            window.open("https://seescrum.atlassian.net/issues/?jql=project%20%3D%20SS%20and%20status%20%3D%20Blocked%20and%20sprint%3D" + activeSprint.id, "_blank");
        };

        const visualizations = document.querySelectorAll(".viz");
        visualizations.forEach( viz => { viz.style.display = "none";});

    }


    get r(){return this.m_r;}
    set r(r){this.m_r = r;}

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get circleData(){return this._circleData;}
    set circleData(circleData){this._circleData = circleData;}

    get rectData(){return this._rectData;}
    set rectData(rectData){this._rectData = rectData;}

    get scrumTextStore(){return this._scrumTextStore;}
    get retroStore(){return this._retroStore;}
}