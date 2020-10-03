class BarChart {
    constructor (svg, xScale, yScale, jiraRepo, gitRepo){
        this._svg = svg;
        this._rankingType = "completedStoryPoints";

        this._data = jiraRepo.sprints.sprints;

        this._x = xScale;
        this._y = yScale;
        this._axisFontSize = "10px";
        this._axisFontWeight = "bold";
        this._duration = 1000;
        this._initialized = false;

    }

    render() {
        this.sortData();
        this._x.domain(this._data.map(d => d.number));
        this._xAxis = d3.axisBottom().scale(this._x);
        this._y.domain([0, d3.max(this._data, d=>this.getRankingValue(d))]);
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
            .attr("x", -100)
            .attr("y", 0)
            .attr("dy", "2em")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(this.getRankingLabel());
    }

    updateYLabel(){
        this._svg.svg.selectAll(".y-axis-label")
            .text(this.getRankingLabel());
    }

    sortData() {
        return this._data.sort((a, b) => d3.ascending(a.id, b.id));
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
            .attr("width", this._x.bandwidth() -5)
            .style("opacity", 1);

        bar.merge(enter)
            .attr("y", d=>this._y(this.getRankingValue(d)))
            .attr("height", d=> this._svg.height - this._y(this.getRankingValue(d)));

        bar.exit().remove();
    }

    renderAxis(dimension){

        const axis = this._svg.svg.append("g")
            .attr("class", dimension);

        if (dimension === "x") {
            const height = this._svg.height;
            axis.attr("transform", "translate(0," + height + ")");
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

    getRankingLabel(){
        switch (this.rankingType) {
            case "completedStoryPoints":
                return "Story Points";
            case "completedStories":
                return "Stories";
            case "linesOfCode":
                return "Lines of Code";
            case "codeCommits":
                return "Code Commits";
        }
    }

    getRankingValue(d){
        switch (this.rankingType) {
            case "completedStoryPoints":
                return d.completedStoryPoints;
            case "completedStories":
                return d.totalCompletedStories;
            case "linesOfCode":
                return d.linesOfCode;
            case "codeCommits":
                return d.codeCommits;
        }
    }

    get rankingType(){return this._rankingType;}
    set rankingType(rankingType){this._rankingType = rankingType;}

}
