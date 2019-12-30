class ScrumSee {
    constructor(svg) {
        this.svg = svg;
        this.drawScrumDiagram();
    }

    drawScrumDiagram(){
        this.svg.svg.selectAll("*").remove();
        this.setColors();
        this.setShapeData();
        this.renderCircles();
        this.renderRectangles();
        this.renderTriangles();
        this.renderSprintArc2();
        this.renderScrumArc();
        //this.renderCircleText();
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

        const dataRectWidth = widthPreSprintArrowRect / 6;
        const dataRectHeight = heightBottomArrowhead;
        const dataRectY = (100 * yPct) - dataRectHeight;

        const triYbottom = 30;
        const triYtop = 10;

        this.cirlcleData = [
            { "name": "backlog", "text": "?", "cx":50, "cy": circleCy, "r": circleHelpRadius },
            { "name": "planning", "text": "?", "cx":75, "cy": circleCy, "r": circleHelpRadius },
            { "name": "sprint-backlog", "text": "?", "cx":100, "cy": circleCy, "r": circleHelpRadius },
            { "name": "increment", "text": "?", "cx":125, "cy": circleCy, "r": circleHelpRadius },
            { "name": "showcase", "text": "?", "cx":150, "cy": circleCy, "r": circleHelpRadius },
            { "name": "retrospective", "text": "?", "cx":175, "cy": circleCy, "r": circleHelpRadius },
            { "name": "sm", "text": "?", "cx":200, "cy": circleCy, "r": circleHelpRadius },
            { "name": "po", "text": "?", "cx":225, "cy": circleCy, "r": circleHelpRadius },
            { "name": "team", "text": "?", "cx":250, "cy": circleCy, "r": circleHelpRadius },
            { "name": "scrum", "text": "?", "cx":275, "cy": circleCy, "r": circleHelpRadius },
            { "name": "sprint", "text": "", "cx":300, "cy": circleCy, "r": circleHelpRadius }
        ];

        this.rectData  = [
            { "name": "pre-sprint-arrow", "text": "", "x":0, "y": this.svg.height - heightBottomArrowRect, "width": widthPreSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor },
            { "name": "post-sprint-arrow", "text": "", "x": startPostSprintArrowRect, "y": this.svg.height - heightBottomArrowRect, "width": widthPostSprintArrowRect, "height": heightBottomArrowRect, "color": this.arrowColor },
            { "name": "backlog", "text": "", "x": dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor },
            { "name": "planning", "text": "", "x": 3 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor },
            { "name": "sprint-backlog", "text": "", "x": 5 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor },
            { "name": "increment", "text": "", "x": startPostSprintArrowRect + dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor },
            { "name": "showcase", "text": "", "x": startPostSprintArrowRect + (3 * dataRectWidth), "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor },
            { "name": "retrospective", "text": "", "x": startPostSprintArrowRect + (5 * dataRectWidth), "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight, "color": this.dataRectColor }
        ];

        this.triangleData  = [
            { "name": "sprint-arrowhead", "points":
                    "50 " + triYbottom + ", " +
                    "60 " + triYbottom + ", " +
                    "55 " + triYtop },
            { "name": "daily-scrum-arrowhead", "points":
                    "70 " + triYbottom + ", " + "" +
                    "80 " + triYbottom + ", " +
                    "75 " + triYtop },
            { "name": "pre-sprint-arrowhead", "points":
                    widthPreSprintArrowRect + " " + bottomArrowheadBottom + ", " +
                    preSprintArrowheadEnd + " " + bottomArrowheadMiddle + ", " +
                    widthPreSprintArrowRect + " " + bottomArrowheadTop  },
            { "name": "post-sprint-arrowhead", "points":
                    postSprintRectEnd + " " + bottomArrowheadBottom + ", " +
                    postSprintArrowheadEnd + " " + bottomArrowheadMiddle + ", " +
                    postSprintRectEnd + " " + bottomArrowheadTop }
        ];

        this.sprintArcData  = [
            { "name": "sprint-arc", "innerRadius": 50, "outerRadius": 70, startAngle: -.33, endAngle: .5, "x": 2, "y": 2 }
        ];

        this.scrumArcData  = [
            { "name": "daily-scrum-arc", "innerRadius": 25, "outerRadius": 40, startAngle: -.3, endAngle: .45, "x": 2, "y": 3.3 }
        ];

    }

    setColors(){

        this.circleColor = "#4e73df";
        this.dataRectColor = "#4e73df";
        this.arrowColor = "#4565C4";
    }

    renderCircles(){

        const circle = this.svg.svg.selectAll("circle")
            .data(this.cirlcleData, d=> d.id );

        circle.enter().append("circle")
            .attr("class", "circle")
            .attr("fill", this.circleColor)
            .attr("r", d => d.r)
            .attr("cy", d => d.cy)
            .attr("cx", d => d.cx)
    }

    renderRectangles(){
        const rect = this.svg.svg.selectAll("rect")
            .data(this.rectData, d=> d.id );

        rect.enter().append("rect")
            .attr("class", "rect")
            .attr("fill", d => d.color)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("y", d => d.y)
            .attr("x", d => d.x)
            .attr("rx", 6)
            .attr("ry", 6);
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

    renderSprintArc2(){
        const data = this.sprintArcData[0];
        const arcLengthBase = 2 * Math.PI;

        const arcGenerator = d3.arc()
            .innerRadius(data.innerRadius)
            .outerRadius(data.outerRadius)
            .startAngle(data.startAngle * arcLengthBase)
            .endAngle(data.endAngle * arcLengthBase);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" + (this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.sprintArcData, d=> d.id );

        const markerData = [
            { id: 0, name: 'circle', path: 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewbox: '-6 -6 12 12' },
            { id: 1, name: 'square', path: 'M 0,0 m -5,-5 L 5,-5 L 5,5 L -5,5 Z', viewbox: '-5 -5 10 10' },
            { id: 2, name: 'arrow', path: 'M 0,0 m -5,-5 L 5,0 L -10,10 Z', viewbox: '-5 -5 10 10' },
            { id: 3, name: 'stub', path: 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z', viewbox: '-1 -5 2 10' }
        ];

        const defs = g.append('svg:defs');

        const marker = defs.append('svg:marker')
            .attr('id', 'marker_arrow')
            .attr('markerHeight', 30)
            .attr('markerWidth', 30)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('viewBox', markerData[2].viewbox)
            .append('svg:path')
            .attr('d', markerData[2].path )
            .attr('fill', this.arrowColor);

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arrowColor)
            .attr('marker-end', 'url(#marker_arrow)' )
    }

    renderSprintArc(){
        const data = this.sprintArcData[0];
        const arcLengthBase = 2 * Math.PI;

        const arcGenerator = d3.arc()
            .innerRadius(data.innerRadius)
            .outerRadius(data.outerRadius)
            .startAngle(data.startAngle * arcLengthBase)
            .endAngle(data.endAngle * arcLengthBase);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" + (this.svg.width / data.x) + "," + (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.sprintArcData, d=> d.id );

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arrowColor);
    }

    renderScrumArc() {
        const data = this.scrumArcData[0];
        const arcWidth = data.outerRadius - data.innerRadius;
        const arcLengthBase = 2 * Math.PI;

        const arcGenerator = d3.arc()
            .innerRadius(data.innerRadius)
            .outerRadius(data.outerRadius)
            .startAngle(data.startAngle * arcLengthBase)
            .endAngle(data.endAngle * arcLengthBase);

        const g = this.svg.svg.append('g')
            .attr("transform", "translate(" +
                (this.svg.width / data.x + this.sprintArcData[0].outerRadius + arcWidth)  + "," +
                (this.svg.height / data.y) + ")");

        const arc = g.selectAll("path")
            .data(this.scrumArcData, d => d.id);

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arrowColor);
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
            .data(this.orders, d=> d);

        circleText.enter().append("text")
            .attr("class", "circle-text")

            .merge(circleText)
            .text(d=>{return d.product;})
            .attr("fill", d=> d.product == "coffee" ? "black" : "white")
            .attr("x", (d,i)=> {return ((3.40 * this.r * 2 * i - d.price * this.r * 0.5 + 100) +	//offset
                (10 * i)); }) 			// space between circles
            .attr("y", d=> this.r * 2);

        circleText.exit().remove();
    }

    get r(){return this.m_r;}
    set r(r){this.m_r = r;}

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get cirlcleData(){return this._cirlcleData;}
    set cirlcleData(cirlcleData){this._cirlcleData = cirlcleData;}

    get rectData(){return this._rectData;}
    set rectData(rectData){this._rectData = rectData;}
}