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
        this.renderArcs();
        //this.renderCircleText();
    }

    setShapeData(){
        const circleCy = 80;
        const circleHelpRadius = 10;
        
        const rectY = 50;
        const rectWidth = 10;
        const rectHeight = 15;

        const triY1 = 20;
        const triY2 = 20;
        const triY3 = 30;

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
            { "name": "backlog", "text": "", "x":50, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "planning", "text": "", "x":75, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "sprint-backlog", "text": "", "x":100, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "increment", "text": "", "x":125, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "showcase", "text": "", "x":150, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "retrospective", "text": "", "x":175, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "pre-sprint-arrow", "text": "", "x":200, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "post-sprint-arrow", "text": "", "x":225, "y": rectY, "width": rectWidth, "height": rectHeight }
        ];

        this.triangleData  = [
            { "name": "sprint-arrowhead", "points": "50 " + triY1 + ", 60 " + triY2 + ", 55 " + triY3 },
            { "name": "daily-scrum-arrowhead", "points": "70 " + triY1 + ", 80 " + triY2 + ", 75 " + triY3  },
            { "name": "pre-sprint-arrowhead", "points": "90 " + triY1 + ", 100 " + triY2 + ", 95 " + triY3  },
            { "name": "post-sprint-arrowhead", "points": "110 " + triY1 + ", 120 " + triY2 + ", 115 " + triY3 }
        ];

        this.arcData  = [
            { "name": "sprint-arc", "x":125, "y": rectY, "width": rectWidth, "height": rectHeight },
            { "name": "daily-scrum-arc", "x":150, "y": rectY, "width": rectWidth, "height": rectHeight }
        ];
    }

    setColors(){
        this.rectColor = "#4e73df";
        this.circleColor = "#4e73df";
        this.triangleColor = "#4e73df";
        this.arrowColor = "#4e73df";
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
            .attr("stroke", this.rectColor)
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
            .attr("stroke", this.triangleColor)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("points", d => d.points)
    }

    renderArcs(){

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