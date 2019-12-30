class ScrumSee {
    constructor(svg) {
        this.svg = svg;
        this.drawScrumDiagram();
    }

    drawScrumDiagram(){
        this.setShapeData();
        this.setColors();
        this.renderCircles();
        this.renderRectangles();
        this.renderTriangles();
        this.renderSprintArc();
        this.renderScrumArc();
        //this.renderCircleText();
    }

    setShapeData(){
        const circleCy = 80;
        const circleHelpRadius = 10;

        const triYbottom = 30;
        const triYmiddle = 20;
        const triYtop = 10;

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

        const dataRectY = 100 * yPct;
        const dataRectWidth = widthPreSprintArrowRect / 6;
        const dataRectHeight = heightBottomArrowhead;

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
            { "name": "backlog", "text": "", "x": dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "planning", "text": "", "x": 3 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "sprint-backlog", "text": "", "x": 5 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "increment", "text": "", "x": 9 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "showcase", "text": "", "x": 11 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "retrospective", "text": "", "x": 13 * dataRectWidth, "y": dataRectY, "width": dataRectWidth, "height": dataRectHeight },
            { "name": "pre-sprint-arrow", "text": "", "x":0, "y": this.svg.height - heightBottomArrowRect, "width": widthPreSprintArrowRect, "height": heightBottomArrowRect },
            { "name": "post-sprint-arrow", "text": "", "x": startPostSprintArrowRect, "y": this.svg.height - heightBottomArrowRect, "width": widthPostSprintArrowRect, "height": heightBottomArrowRect }
        ];

        this.triangleData  = [
            { "name": "sprint-arrowhead", "points": "50 " + triYbottom + ", 60 " + triYbottom + ", 55 " + triYtop },
            { "name": "daily-scrum-arrowhead", "points": "70 " + triYbottom + ", 80 " + triYbottom + ", 75 " + triYtop  },
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
            { "name": "sprint-arc", startAngle: 0, endAngle: 2 * Math.PI }
        ];

        this.scrumArcData  = [
            { "name": "daily-scrum-arc", startAngle: 0, endAngle: 2 * Math.PI }
        ];

    }

    setColors(){
        this.rectColor = "#4e73df";
        this.circleColor = "#4e73df";
        this.triangleColor = "#4e73df";
        this.arcColor = "#4e73df";
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
            .attr("fill", this.rectColor)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("y", d => d.y)
            .attr("x", d => d.x)
    }

    renderTriangles(){
        const triangle = this.svg.svg.selectAll("polyline")
            .data(this.triangleData, d=> d.id );

        triangle.enter().append("polyline")
            .attr("class", "triangle")
            .attr("fill", this.triangleColor)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("points", d => d.points)
    }

    renderSprintArc(){
        const arcGenerator = d3.arc()
            .innerRadius(50)
            .outerRadius(70)

        const g = this.svg.svg.append('g')
            .attr('transform', 'translate(400, 100)');

        const arc = g.selectAll("path")
            .data(this.sprintArcData, d=> d.id );

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arcColor);

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
    }

    renderScrumArc() {
        const arcGenerator = d3.arc()
            .innerRadius(20)
            .outerRadius(35)

        const g = this.svg.svg.append('g')
            .attr('transform', 'translate(500, 100)');

        const arc = g.selectAll("path")
            .data(this.scrumArcData, d => d.id);

        arc.enter().append("path")
            .attr("class", "arc")
            .attr("d", arcGenerator)
            .attr("fill", this.arcColor);
    }


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