/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
class ScrumSee {
    constructor(svg, issueStore, scrumTextStore, retroStore) {
        this.svg = svg;
        this._scrumTextStore = scrumTextStore;
        this._issueStore = issueStore;
        this._retroStore = retroStore;

        this.drawScrumDiagram();
    }

    drawScrumDiagram(){
        this.svg.svg.selectAll("*").remove();
        this.setColors();
        this.setShapeData();
        this.renderRectangles();
        this.renderCircles();
        this.renderCircleText();
        this.renderRectText();
        this.renderSprintArc();
        this.renderScrumArc();
    }


    handleRectClick(d) {

        switch (d.name) {
            case "backlog":
                window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV&view=planning&selectedIssue=JV-122&epics=visible", "_blank");
                break;
            case "planning":
                document.querySelectorAll(".velocity-selector, .velocity-description").forEach(element => {
                    element.style.display = "block";
                });
                $(eventHandler).trigger("selectedVisualizationChange", "velocity-visualization");
                document.querySelector("#velocity-chart").style.display = "block";
                break;
            case "sprint-backlog":
                window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV", "_blank");
                break;
            case "increment":
                window.open("https://cs171-jira.atlassian.net/issues/?jql=project%20%3D%20JV%20and%20status%20%3D%20Done%20and%20sprint%3D5", "_blank");
                break;
            case "showcase":
                break;
            case "retrospective":
                document.querySelector("#retrospective-chart").style.display = "block";
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
            case "sm":
                text = data.text.scrumMaster;
                url = data.url.scrumMaster;
                break;
            case "po":
                text = data.text.productOwner;
                url = data.url.productOwner;
                break;
            case "team":
                text = data.text.team;
                url = data.url.team;
                break;
            default:
                text = data.text[d.name];
                url = data.url[d.name];
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

        const helpTextHtml = '<div id="help-text" style="color: black background-color: white;"><h4>' +
            text + '</h4></div>';

        this.appendHTML(g, helpTextHtml,
            this.svg.width * 0.95,
            this.svg.height,
            this.svg.width * 0.05,
            this.svg.height * 0.2,
            "default");

        const closeHelpButtonHtml = this.getButtonHtml("help-close", "Close");

        this.appendHTML(g, closeHelpButtonHtml,
            this.svg.width * 0.06 ,
            this.svg.height * 0.3,
            this.svg.width * 0.9,
            this.svg.height * 0.6,
            "pointer");

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
            "pointer");

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

        const roleHeight = this.svg.height - heightBottomArrowRect;
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
            { "name": "backlog", "text": "?", "cx":50, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "planning", "text": "?", "cx":75, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "sprint-backlog", "text": "?", "cx":100, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "increment", "text": "?", "cx":125, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "showcase", "text": "?", "cx":150, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "retrospective", "text": "?", "cx":175, "cy": circleCy, "r": this.circleHelpRadius },
            { "name": "po", "text": "?", "cx":225, "cy": roleHeight, "r": this.circleHelpRadius },
            { "name": "sm", "text": "?", "cx":200, "cy": roleHeight - (2 * this.circleHelpRadius), "r": this.circleHelpRadius },
            { "name": "team", "text": "?", "cx":250, "cy": roleHeight - (4 * this.circleHelpRadius) , "r": this.circleHelpRadius },
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
            { "name": "showcase", "text": "Showcase", "x": startPostSprintArrowRect + this.dataRectWidth + rectSpacer, "y": dataRectY, "width": this.dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
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
            case "po":
            case "sm":
            case "team":
                return this.rectData.find(rect =>
                    rect.name === "increment").x - (8 * this.circleHelpRadius);

            case "sprint":
            case "scrum":
                return cx;

            case "backlog":
            case "planning":
            case "sprint-backlog":
            case "increment":
            case "showcase":
            case "retrospective":
                return this.rectData.find(rect => rect.name === name).x +
                    (this.circleHelpRadius);

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

        const sprintName = this.issueStore.activeSprint.name;

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
        const activeSprint = this.issueStore.activeSprint;
        const committed = activeSprint.totalStoryPoints;
        const completed = activeSprint.completedStoryPoints;
        const backlogStoryCount = this.issueStore.getIssues().length;
        const averageHappiness = this.retroStore.getSprintHappiness(activeSprint);
        const totalAlerts = activeSprint.totalAlerts;
        const burndownPct =  (100 * completed / committed).toFixed()+"%";

        this.rectData.forEach(rect => {

            let text, text2, text3 = null;

            switch (rect.name) {
                case "sprint-backlog":
                    text = "Sprint Backlog";
                    text2 = committed + " points";
                    break;

                case "increment":
                    text = "Product Increment ";
                    text2 = completed + " points ";
                    break;

                case "backlog":
                    text = "Product Backlog ";
                    text2 = backlogStoryCount + " stories ";
                    break;

                case "planning":
                    text = "Sprint Planning ";
                    text2 = totalAlerts + " unestimated";
                    text3 = "stories";
                    break;

                case "showcase":
                    text = rect.text;
                    break;

                case "retrospective":
                    text = "Retrospective";
                    text2 = "Average";
                    text3 = averageHappiness.toFixed(2);
                    break;

                default:
                    break;
            }

            const xPos = rect.x + ( rect.width / 2 );
            const yPos = rect.y + ( rect.height / 2 );
            const g = this.svg.svg.append('g')
                .attr("transform", "translate(" + xPos + "," + yPos + ")");

            if (text && text && text3) {
                this.appendRectText(g, -18, text, rect.name);
                this.appendRectText(g, 0, text2, rect.name);
                this.appendRectText(g, 18, text3, rect.name);
            } else if (text && text2 ) {
                this.appendRectText(g, -18, text, rect.name);
                this.appendRectText(g, 0, text2, rect.name);
            } else if (text) {
                this.appendRectText(g, -18, text, rect.name);
            }

            if (rect.name === "retrospective") {
                    this.appendFaceIcon(g, averageHappiness);
            }

            if (rect.name === "increment") {
                const y = this.svg.height * 0.3;
                const textElem = this.appendRectText(g, y , burndownPct + " Done", rect.name);
                textElem.attr("font-size", "x-large");
                textElem.attr("x", -15);

                let html = '<i class="fas fa-fire fa-2x" style="color:orange; background-color: ' + this.dataRectColor + ';"></i>';
                this.appendHTML(g, html, 24, 31.8, 50, y * 0.55, "pointer");
            }
        });
    }

    appendFaceIcon(g, averageHappiness) {
        let html = "";

        if (averageHappiness > 0) {
            html = '<i class="fas fa-smile-beam fa-2x" style="color:darkgreen; background-color: ' + this.dataRectColor + ';" ></i>';
        } else if (averageHappiness < 0) {
            html = '<i class="fas fa-sad-tear fa-2x" style="color:darkred; background-color: ' + this.dataRectColor + ';" ></i>';
        } else {
            html = '<i class="fas fa-meh fa-2x" style="color:darkred; background-color: ' + this.dataRectColor + ';" ></i>';
        }

        this.appendHTML(g, html, 31, 31.8, 0,-75, "pointer");

    }

    appendHTML(g, html, width, height, x, y, cursor){
        g.append('svg:foreignObject')
            .attr("width", width)
            .attr("height", height)
            .attr("text-anchor", "middle")
            .attr("x", x)
            .attr("y", y)
            .append("xhtml:body")
            .html(html)
            .style("font-weight", "bold")
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

        const sprint = this.issueStore.activeSprint;

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

    get r(){return this.m_r;}
    set r(r){this.m_r = r;}

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get circleData(){return this._circleData;}
    set circleData(circleData){this._circleData = circleData;}

    get rectData(){return this._rectData;}
    set rectData(rectData){this._rectData = rectData;}

    get issueStore(){return this._issueStore;}
    get scrumTextStore(){return this._scrumTextStore;}
    get retroStore(){return this._retroStore;}
}