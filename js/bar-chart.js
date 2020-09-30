

class Svg2 {
    constructor(container, width, height, margin) {
        this._width = width - margin.left - margin.right;
        this._height = height - margin.top - margin.bottom;
        this._margin = margin;

        this._svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "main-group")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    get g(){return this._svg.select('.main-group'); }

    get svg(){return this._svg;}
    set svg(svg){this._svg = svg;}

    get width(){return this._width;}
    set width(width){this._width = width;}

    get height(){return this._height;}
    set height(height){this._height = height;}

    get margin(){return this._margin;}
    set margin(margin){this._margin = margin;}
}


class BarChart {
    constructor (svg, xScale, yScale, rankingType, jiraRepo){
        this._svg = svg;
        this._rankingType = rankingType;

        this._data = jiraRepo.sprints.sprints;

        this._x = xScale;
        this._y = yScale;
        this._axisFontSize = "10px";
        this._axisFontWeight = "bold";
        this._sortOrder = "descending";
        this._duration = 1000;
        this._initialized = false;

    }

    render() {
        this.sortData();
        this._x.domain(this._data.map(d => d.number));
        this._xAxis = d3.axisBottom().scale(this._x);
        this._y.domain([0, d3.max(this._data, d=>this._rankingType === "completedStoryPoints" ? d.completedStoryPoints : d.completedStories)]);
        this._yAxis = d3.axisLeft().scale(this._y);
        this.renderBars();

        if (this._initialized === false) {
            this.renderAxis("x");
            this.renderAxis("y");
            this.renderYLabel();
            this._initialized = true;
        } else {
            this.updateAxis("x");
            this.updateAxis("y");
            this.updateYLabel()
        }

    }

    renderYLabel(){
        this._svg.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -50)
            .attr("y", -30)
            .attr("dy", "2em")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#8E7060")
            .text(this._rankingType === "completedStoryPoints" ? "Story Points" : "Stories");
    }

    updateYLabel(){
        this._svg.svg.selectAll(".y-axis-label")
            .text(this._rankingType === "completedStoryPoints" ? "Story Points" : "Stories");
    }

    sortData() {
        const sortFunction = this.sortOrder === "descending" ? d3.descending : d3.ascending;

        if (this.rankingType === "completedStoryPoints") {
            return this._data.sort((a, b) => sortFunction(a.completedStoryPoints, b.completedStoryPoints));
        } else {
            return this._data.sort((a, b) => sortFunction(a.completedStories, b.completedStories));
        }
    }

    renderBars(){
        const bar = this._svg.svg.selectAll(".bar")
            .data(this._data, d => d.id);

        let enter = bar.enter().append("rect")
            .style("opacity", 0.5)
            .transition()
            .duration(this._duration)
            .attr("transform", (d,i)=>{
                return "translate(" + i * this._x.bandwidth() + ",0)";
            })
            .attr("class", "bar")
            .attr("width", this._x.bandwidth())
            .style("opacity", 1);

        bar.merge(enter)
            .attr("y", d=> this._rankingType === "completedStoryPoints" ? this._y(d.completedStoryPoints) : this._y(d.completedStories))
            .attr("height", d=>{
                let rankingValue = this._rankingType === "completedStoryPoints" ? d.completedStoryPoints :  d.completedStories;
                return this._svg.height -  this._y(rankingValue);});

        bar.exit().remove();
    }

    renderAxis(dimension){

        const axis = this._svg.svg.append("g")
            .attr("class", dimension);

        if (dimension === "x") {
            axis.attr("transform", "translate(0," + this._svg.height + ")");
        }

        const scale = dimension === "x" ? this._xAxis : this._yAxis;

        axis.style("font-size", this._axisFontSize)
            .style("font-weight", this._axisFontWeight)
            .call(scale);
    }

    updateAxis(dimension){

        const axis = this._svg.svg.selectAll("." + dimension);
        const scale = dimension === "x" ? this._xAxis : this._yAxis;

        axis.transition()
            .duration(this._duration)
            .call(scale);
    }

    get rankingType(){return this._rankingType;}
    set rankingType(rankingType){this._rankingType = rankingType;}

    get sortOrder(){return this._sortOrder;}
    set sortOrder(sortOrder){this._sortOrder = sortOrder;}

}