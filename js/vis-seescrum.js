/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */

class Ifa {

    constructor(ifa) {

        this.storyAvatar = '<img src="https://seescrum.atlassian.net/secure/viewavatar?size=medium&avatarId=10315&avatarType=issuetype">';
        this.summary = this.storyAvatar + '&nbsp;' + ifa[2];

        const storyEpicKey = ifa[3];
        const storyEpic = jiraRepo.epics._epics.find(epic => epic.key === storyEpicKey);
        this.epic = storyEpic ? storyEpic.name : "";

        this.assigneeAvatar = 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5dc4ce16e41bfe0df6c29f65/9235b3cd-065b-46d7-8a8f-3f23a52e2a18/48';
        let assigneeHtml = '<span><img src="' + this.assigneeAvatar + '" style="border-radius: 50%; height: 50%"></span>';
        assigneeHtml += '<span>&nbsp' + ifa[5] + '</span>';
        this.assignee = assigneeHtml;

        const storyUrl = "https://seescrum.atlassian.net/browse/" + ifa[1];
        this.key = '<a href="' + storyUrl + '" target="_blank">' + ifa[1] + '</a>';

        const priorityText = ifa[4];
        const priorityIconBaseUrl = "https://seescrum.atlassian.net/images/icons/priorities/";
        let priorityHtml = '<span><img height="16" src="' + priorityIconBaseUrl + priorityText.toLowerCase() + '.svg">&nbsp';
        priorityHtml += priorityText + '</span>';
        this.priority = priorityHtml;

        let ptsHtml = '<span class="fas fa-exclamation-triangle fa-sm" style="color:#ffc107">&nbsp</span>';
        ptsHtml += '<span style="background-color: #dfe1e6; color: black; font-size: 12px; height: 16px; border-radius:3em; padding-left: 7px; padding-right: 7px;">' + '<span>' + '</span>' + ifa[6] + '</span>';
        this.storypoints = ptsHtml;

    }
}

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
        createSsTable(); // Clears able div if it has any children nodes, creates & appends the table
        // Iterates through all the objects in the stories array and appends each one to the table body

        let stories = this._ifaData.mustSplit.map(ifa => new Ifa(ifa));
        stories.forEach(story => appendStories(story));  // Creates and appends each row to the table body

        const div = document.querySelector('#sprint-planning-alerts');
        const data = this._ifaData;
        const mustSplit = this.analyticsToString("to split", data.mustSplit);
        const noEpic = this.analyticsToString("with no epic", data.noEpic);
        const unassigned = this.analyticsToString("with no assignee", data.unassigned);
        const notEstimated = this.analyticsToString(" without an estimate", data.notEstimated);
        const notFibonacci = this.analyticsToString("with non-Fibonacci estimates", data.notFibonacci);
        div.innerHTML += mustSplit + noEpic + unassigned + notEstimated + notFibonacci;
    }


    analyticsToString(header, data){
        let html = "";

        if (!data) return html;

        let jqlUrl = 'https://seescrum.atlassian.net/issues/?jql=project%20%3D%20%22SS%22%20and%20key%20in%20(';

        const quote = "%22";
        const comma = "%2C";

        for (let i = 0; i < data.length; i++) {
            const story = data[i];
            jqlUrl += quote + story[1] + quote + comma;
        }
        jqlUrl = jqlUrl.slice(0, -3) //remove last comma

        jqlUrl += ')%20ORDER%20BY%20created%20DESC';
        html = '<h5><a href="' + jqlUrl + '" target="_blank">';

        html += data.length + " ";

        if (data.length === 1) {
            html += "Story";
        } else {
            html += "Stories";
        }
        html += "</a>";

        html += " " + header + "</h5>";

        data.forEach(story => {
            const storyUrl = "https://seescrum.atlassian.net/browse/" + story[1];
            const storyKey = story[1];
            const storyDescription = story[2];

            const storyEpicKey = story[3];
            const storyEpic = jiraRepo.epics._epics.find(epic => epic.key === storyEpicKey);
            const storyEpicName = storyEpic ? "Epic: " + storyEpic.name : "";
            const storyPriority = story[4];
            const storyAssignee = story[5];
            const storyPoints = story[6];

            html += '<br><a href="' + storyUrl + '" target="_blank">' + storyKey + '</a>&nbsp;&nbsp;&nbsp;'
            html += storyDescription;
            html += '<br>' + storyPriority + '&nbsp;&nbsp;&nbsp;' + storyPoints + ' points&nbsp;&nbsp;&nbsp;'
            html += '&nbsp;&nbsp;&nbsp;Assigned to: ' + storyAssignee + '&nbsp;&nbsp;&nbsp;' + storyEpicName;
        });

        html += '<hr/>';

        return html
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
            .attr("x", 0);

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
            .attr("ry", 6);

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
        const completedStoryCount = this.jiraRepo.activeStories.issues.filter(issue=> issue.status === "Done").length;
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
                    break;

                case "planning":
                    text = "Sprint Planning ";
                    break;

                case "sprint-backlog":
                    text = "Sprint Backlog";
                    break;

                case "increment":
                    text = "Product Increment ";
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
                this.appendRectText(g, -27, text, rect.name);
                this.appendRectText(g, -18, text2, rect.name);
                this.appendRectText(g, 9, text3, rect.name);
            } else if (text && text2) {
                this.appendRectText(g, -27, text, rect.name);
                this.appendRectText(g, -18, text2, rect.name);
            } else if (text) {
                this.appendRectText(g, -27, text, rect.name);
            }

            const metrics = {};
            metrics.totalIFAs = totalIFAs;
            metrics.burndownPct =burndownPct;
            metrics.averageHappiness = averageHappiness;
            metrics.backlogStoryCount = backlogStoryCount
            metrics.committed = committed
            metrics.committedStoryCount = committedStoryCount
            metrics.completed = completed;
            metrics.completedStoryCount = completedStoryCount

            this.renderRectButtons(g,
                xPos,
                yPos,
                rect,
                metrics);

        });
    }

    renderRectButtons(g, xPos, yPos, rect, metrics){
        let html = "";
        switch (rect.name) {

            case "backlog":
                html = '<button class="btn btn-primary">' + metrics.backlogStoryCount + ' stories';
                this.appendHTML(g,
                    html,
                    100,
                    50,
                    -50,
                    -20,
                    "pointer",
                    this.handleBacklogClick,
                    this.dataRectColor);
                break;

            case "planning":
                html = '<button class="btn btn-primary" data-toggle="modal" data-target="#sprintPlanningAlertsModal"><span>' + metrics.totalIFAs + ' Alerts &nbsp&nbsp</span>';
                html += '<span class="fas fa-exclamation-triangle fa-2x" style="color:#ffc107; background-color: ' + this.dataRectColor + '"></span></button>';
                this.appendHTML(g,
                    html,
                    150,
                    50,
                    -63,
                    -20,
                    "pointer",
                    null,
                    this.dataRectColor);

                const velocity = this.jiraRepo.previousSprint.completedStoryPoints;
                const gTachometer = this.svg.svg.append('g')
                    .attr("transform", "translate(" + xPos + "," + yPos + ")");
                html = '<button class="btn btn-primary"><span> Velocity ' + velocity + '&nbsp&nbsp</span>';
                html += '<span class="fas fa-tachometer-alt fa-2x" style="color:#1cc88a; background-color: ' + this.dataRectColor + '"></span></button>';
                this.appendHTML(gTachometer,
                    html,
                    150,
                    50,
                    -70,
                    24,
                    "pointer",
                    this.handleVelocityClick(this),
                    this.dataRectColor);
                break;

            case "sprint-backlog":

                html = '<button class="btn btn-primary">' + metrics.committed + ' points<br>' + metrics.committedStoryCount +  ' stories';
                this.appendHTML(g,
                    html,
                    110,
                    65,
                    -52,
                    -20,
                    "pointer",
                    this.handleSprintBacklogClick,
                    this.dataRectColor);
                break;

            case "increment":
                html = '<button class="btn btn-primary">' + metrics.completed + ' points<br>' + metrics.completedStoryCount +  ' stories';
                this.appendHTML(g,
                    html,
                    110,
                    65,
                    -52,
                    -20,
                    "pointer",
                    this.handleIncrementClick,
                    this.dataRectColor);


                const y = this.svg.height * 0.3;
                const textElem = this.appendRectText(g, y, metrics.burndownPct + " Done", rect.name);
                textElem.attr("font-size", "x-large");
                textElem.attr("x", -15);

                html = '<span class="fas fa-fire fa-2x" style="color:orange; background-color: ' + this.dataRectColor + '"></span>';
                this.appendHTML(g, html, 30, 31.8, 50, y * 0.5, "pointer", this.handleFireClick, this.dataRectColor);
                break;

            case "showcase":
                html = '<a id="showcase-video"><img src="img/yt_icon_rgb.png" alt="YouTube video" width="50" </a>';
                this.appendHTML(g, html, 50, 40, -25, 30, "pointer", this.handleShowcaseClick, this.dataRectColor);
                break;

            case "retrospective":
                this.appendFaceIcon(g, metrics.averageHappiness);
                break;
        }
    }

    //This is a function that returns a function aka a "closure."
    //Here we use the closure to preserve the This pointer.
    // In general, closures preserve variable values.
    handleVelocityClick(that){
        return function (){
            that.handleChartClick("#velocity-chart", "Velocity Chart");
        }
    }

    handleBacklogClick(){
        window.open("https://seescrum.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=SS&view=planning&&epics=visible", "_blank");
    }

    handleSprintBacklogClick(){
        window.open("https://seescrum.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=SS", "_blank");
    }

    handleIncrementClick(){
        const activeSprint = jiraRepo.activeSprint.number - 1;
        window.open("https://seescrum.atlassian.net/issues/?jql=project%20%3D%20SS%20and%20status%20%3D%20Done%20and%20sprint%3D" + activeSprint, "_blank");
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

    handleRetroClick(that){
        return function () {
            that.handleChartClick("#retrospective-chart", "Retrospective Chart");
        }
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

        let html = '<button class="btn btn-primary"><span> Happiness ' + averageHappiness + '</span>';

        html += '<span style="color:' + color + '">' +
            '&nbsp;;<i class="fas ' + icon + ' fa-1x" style="font-size: xx-large"</i></span>';

        this.appendHTML(g, html, 179, 50, -83,-20, "pointer", this.handleRetroClick(this), this.dataRectColor);

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
            .style("font-weight", "bold");
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

                const xPosVideo = this.getCircleCx(circle.name, circle.cx) + this.circleHelpRadius + 55;
                const yPosVideo = circle.cy;
                const videoName = "video" + circle.name.slice(4);

                const gVideo = this.svg.svg.append('g')
                    .attr("transform", "translate(" + xPosVideo + "," + yPosVideo + ")");

                this.appendPlaylistIcon(gVideo, videoName);
            }
        });
    }



    appendInfoIcon(g, infoName, x, y) {
        const html = '<i class="fas fa-info-circle fa-1x" id="' + infoName + '" </i>';
        this.appendHTML(g, html, 20, 25, x,y, "pointer", this.handleInfoClick(infoName), this.dataRectColor);
    }

    appendPlaylistIcon(g, videoName) {

        const g2 = g.append('g');

        g2.append("path")
            .attr("id", "yt-playlist-" + videoName) //Unique id of the path
            .attr("d", "M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z") //SVG
            .style("fill", "black");

        //Increase the size of the playlist path
        g2.transition().attrTween("transform", (d, i, a) => d3.interpolateString(a, 'scale(2)'));

        //Create a target rectangle for mouse events because the path has "holes" in it
        g2.append("rect")
            .attr("fill", "none")
            .attr("width", 24)
            .attr("height", 23)
            .attr("y", 0)
            .attr("x", 0)
            .attr("pointer-events", "all")
            .attr("cursor", "pointer")
            .on("click", d => this.handlePlaylistClick(videoName))
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            });

    }

    handleInfoClick(){

    }

    handlePlaylistClick(playlist){
        //TODO replace hard coding of video name with detection of name

        switch (playlist) {
            case("video-planning"):
                window.open("https://www.youtube.com/playlist?list=PL_cBooxGk-FbYdR_frAaQn04IMHY5ntyr", "_blank");
        }
    }

    setSummaryStats(){
        const activeSprint = this.jiraRepo.activeSprint;

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