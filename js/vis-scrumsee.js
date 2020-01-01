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
        this.renderCircles();
        this.renderRectangles();
        this.renderTriangles();
        this.renderSprintArc();
        this.renderScrumArc();
        this.renderCircleText();
        //this.renderRectText();
    }


    handleRectClick(d) {
        if (d.isClickable) {
            alert("rect " + d.name + " was clicked");
        }

        switch (d.name) {
            case "backlog":
                window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?rapidView=1&projectKey=JV&view=planning&selectedIssue=JV-122&epics=visible", "_blank");
                break;
            case "planning":
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
                break;
            default:
                alert ("unhandled click for " + d.name);
                break;
        }
    }

    setShapeData(){

        const circleCy = 80;
        const circleHelpRadius = 10;

        const xPct = this.svg.width / 100;
        const yPct = this.svg.height / 100;

        const widthPreSprintArrowRect = 30 * xPct;
        const startPostSprintArrowRect = 60 * xPct;
        const widthPostSprintArrowRect = 30 * xPct;
        const heightBottomArrowRect = 20 * yPct;

        const widthBottomArrowhead = 1.5 * heightBottomArrowRect;
        const heightBottomArrowhead = 1.5 * widthBottomArrowhead;
        const preSprintArrowheadEnd = widthPreSprintArrowRect + heightBottomArrowhead;
        const postSprintArrowheadEnd = startPostSprintArrowRect + widthPostSprintArrowRect + heightBottomArrowhead;
        const postSprintRectEnd = startPostSprintArrowRect + widthPostSprintArrowRect;
        const bottomArrowheadBottom = this.svg.height;
        const bottomArrowheadTop = bottomArrowheadBottom - heightBottomArrowhead;
        const bottomArrowheadMiddle = bottomArrowheadTop - .5 * (bottomArrowheadTop - bottomArrowheadBottom);

        const rectSpacer = 2 * xPct;
        const dataRectWidth = (widthPreSprintArrowRect / 3) - rectSpacer;
        //const dataRectWidth = widthPreSprintArrowRect / 6;
        const dataRectHeight = heightBottomArrowhead;
        const dataRectY = (100 * yPct) - dataRectHeight;

        const triYbottom = 30;
        const triYtop = 10;

        this.sprintArcData  = [
            { "name": "sprint-arc", "innerRadius": 80, "outerRadius": 105, startAngle: -.33, endAngle: .5, "x": 2, "y": 2 }
        ];

        this.scrumArcData  = [
            { "name": "daily-scrum-arc", "innerRadius": 25, "outerRadius": 40, startAngle: -.3, endAngle: .45, "x": 2, "y": 3.3 }
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
            { "name": "backlog", "text": "?", "cx":50, "cy": circleCy, "r": circleHelpRadius },
            { "name": "planning", "text": "?", "cx":75, "cy": circleCy, "r": circleHelpRadius },
            { "name": "sprint-backlog", "text": "?", "cx":100, "cy": circleCy, "r": circleHelpRadius },
            { "name": "increment", "text": "?", "cx":125, "cy": circleCy, "r": circleHelpRadius },
            { "name": "showcase", "text": "?", "cx":150, "cy": circleCy, "r": circleHelpRadius },
            { "name": "retrospective", "text": "?", "cx":175, "cy": circleCy, "r": circleHelpRadius },
            { "name": "sm", "text": "?", "cx":200, "cy": circleCy, "r": circleHelpRadius },
            { "name": "po", "text": "?", "cx":225, "cy": circleCy, "r": circleHelpRadius },
            { "name": "team", "text": "?", "cx":250, "cy": circleCy, "r": circleHelpRadius },
            {
                "name": "scrum",
                "text": "24 Hr",
                "cx":(this.svg.width / sprintArcData.x) + + sprintArcData.outerRadius + scrumArcData.outerRadius - scrumArcData.innerRadius,
                "cy": this.svg.height / scrumArcData.y,
                "r": scrumArcData.innerRadius + 1 },
            {
                "name": "sprint",
                "text": "",
                "cx": this.svg.width / sprintArcData.x,
                "cy": this.svg.height / sprintArcData.y,
                "r": sprintArcData.innerRadius + 1
            }
        ];

        this.rectData  = [
            { "name": "pre-sprint-arrow", "text": "", "x":0, "y": this.svg.height - heightBottomArrowRect, "width": widthPreSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor, "isClickable": false },
            { "name": "post-sprint-arrow", "text": "", "x": startPostSprintArrowRect, "y": this.svg.height - heightBottomArrowRect, "width": widthPostSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor, "isClickable": false },
            { "name": "backlog", "text": "", "x": .5 * rectSpacer, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "planning", "text": "", "x": 1.5 * rectSpacer + dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "sprint-backlog", "text": "", "x": 2.5 * rectSpacer + 2 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "increment", "text": "", "x": startPostSprintArrowRect + (.5 * rectSpacer), "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "showcase", "text": "", "x": startPostSprintArrowRect + dataRectWidth + (1.5 * rectSpacer), "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true },
            { "name": "retrospective", "text": "", "x": startPostSprintArrowRect + (2 * dataRectWidth) + (2.5 * rectSpacer), "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor, "isClickable": true }
        ];

        this.triangleData  = [
            { "name": "pre-sprint-arrowhead", "points":
                    widthPreSprintArrowRect + " " + bottomArrowheadBottom + ", " +
                    preSprintArrowheadEnd + " " + bottomArrowheadMiddle + ", " +
                    widthPreSprintArrowRect + " " + bottomArrowheadTop  },
            { "name": "post-sprint-arrowhead", "points":
                    postSprintRectEnd + " " + bottomArrowheadBottom + ", " +
                    postSprintArrowheadEnd + " " + bottomArrowheadMiddle + ", " +
                    postSprintRectEnd + " " + bottomArrowheadTop }
        ];

    }

    setColors(){

        this.circleColor = "#4e73df";
        this.dataRectColor = "#4e73df";
        this.arrowColor = "#4565C4";
    }

    renderCircles(){

        const circle = this.svg.svg.selectAll("circle")
            .data(this.circleData, d=> d.id );

        circle.enter().append("circle")
            .attr("class", "circle")
            .attr("fill", this.circleColor)
            .attr("r", d => d.r)
            .attr("cy", d => d.cy)
            .attr("cx", d => d.cx)
            .on ("mouseover",function(d) {
                    d3.select(this).style("cursor", "pointer");
                }
            )
            .on ("mouseout",function(d) {
                    d3.select(this).style("cursor", "default");
            });
    }

    renderRectangles(){
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
    }

    renderTriangles(){
        const triangle = this.svg.svg.selectAll("polyline")
            .data(this.triangleData, d=> d.id );

        triangle.enter().append("polyline")
            .attr("class", "triangle")
            .attr("fill", this.arrowColor)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("points", d => d.points)
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
            .attr("transform", "translate(" + (this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.sprintArcData, d => d.id);

        const defs = g.append('svg:defs');

        const marker = defs.append('svg:marker')
            .attr('id', 'marker-arrow')
            .attr('markerHeight', 40)
            .attr('markerWidth', 40)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', '180')
            .attr('refX', .1 * arcWidth)
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
    }

    renderScrumArc() {
        const data = this.scrumArcData[0];
        const arcWidth = data.outerRadius - data.innerRadius;

        const arcGenerator = this.getArcGenerator(data);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" +
                (this.svg.width / data.x + this.sprintArcData[0].outerRadius + arcWidth)  + "," +
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

        const marker = defs.append('svg:marker')
            .attr('id', 'marker-scrum-arrow')
            .attr('markerHeight', 30)
            .attr('markerWidth', 30)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', '270')
            .attr('refX', -.2 * arcWidth)
            .attr('refY', .1 * arcWidth)
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
    }


    // const arcLabel = this.svg.svg.selectAll("text")
    //     .data(this.arcData, d=> d.id );
    //
    // arcLabel.enter().append('text')
    //     .each(d => {
    //         const centroid = arcGenerator.centroid(d);
    //         d3.select(this)
    //             .attr('x', centroid[0])
    //             .attr('y', centroid[1])
    //             .attr('dy', '0.33em')
    //             .text(d.name);
    //     });

    renderCircleText(){

        const circleText = this.svg.svg.selectAll("text")
            .data(this.circleData, d => d.name);

        circleText.enter().append("text")
            .attr("class", "circle-text")

            .merge(circleText)
            .text(d=> d.text)
            .attr("x", d => d.cx - (.5 * d.r) )
            .attr("y", d=> d.cy + (.5 * d.r) )
            .attr("fill", "black")
            .style("font-weight", "bold")
            .on ("mouseover",function(d) {
                    d3.select(this).style("cursor", "pointer");
                }
            );
        
        circleText.exit().remove();

        const sprint = this.issueStore.activeSprint;

        this.circleData.forEach(circle => {

            if (circle.name ==  "sprint") {
                const data = this.sprintArcData[0];
                const g = this.svg.svg.append('g')
                    .attr("transform", "translate(" + (this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");


                const sprintStart = sprint.startDate;
                const sprintEnd = sprint.endDate;
                const sprintLength = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000*60*60*24));
                const currentDay = new Date();
                const dayOfSprint = Math.ceil((currentDay.getTime() - sprintStart.getTime()) / (1000*60*60*24));

                g.append("text")
                    .attr("fill", "black")
                    .attr("y", -9 )
                    .attr("text-anchor", "middle")
                    .text("Day " + dayOfSprint + " of " + sprintLength);

                g.append("text")
                    .attr("fill", "black")
                    .attr("y", 9 )
                    .attr("text-anchor", "middle")
                    .text("Ends " + formatDate(sprintEnd));
            }
        })
        
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