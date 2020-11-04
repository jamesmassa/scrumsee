//TODO
// 1. add git data to summary cards
// 2. add git charts
// 3. Show breakdowns of completed vs. committed.
// 4. Breakdowns by language
// 5. Leverage teal and orange
// 6. Filters:  Priority, component, issue type.
// 7. Innovate
//      Set time period to measure
//      Option to exclude outliers beyond configurable threshold
//      Negative velocity for bugs
//      Value add vs. friction
//      velocity per team member
//      Trend line with bottom line statement

class BarChart {
    constructor (svg, xScale, yScale, jiraRepo, gitRepo){
        this._svg = svg;
        this._rankingType = "completedStoryPoints";
        this._jiraRepo = jiraRepo;
        this._gitRepo = gitRepo;
        this._x = xScale;
        this._y = yScale;
        this._axisFontSize = "10px";
        this._axisFontWeight = "bold";
        this._duration = 1000;
        this._initialized = false;

    }

    render() {
        this.data = this.setData();
        this._x.domain(this.jiraRepo.velocitySprintNames);
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
            .attr("y", -20)
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
                return "Jira Story Points";
            case "completedStories":
                return "Jira Stories";
            case "gitNetLinesOfCode":
                return "Git Net Lines of Code";
            case "gitLinesOfCodeAdditions":
                return "Git Lines of Code Added";
            case "gitLinesOfCodeDeletions":
                return "Git Lines of Code Deleted";
            case "gitCodeCommits":
                return "Git Code Commits";
            case "gitPulls":
                return "Git Pulls";
            case "gitReleases":
                return "Git Releases";
            case "gitDeployments":
                return "Git Deployments";
        }
    }

    getRankingValue(d){
        switch (this.rankingType) {
            case "completedStoryPoints":
            case "completedStories":
                return d;
            case "gitNetLinesOfCode":
                return d.netLinesOfCode;
            case "gitLinesOfCodeAdditions":
                return d.linesOfCodeAdded;
            case "gitLinesOfCodeDeletions":
                return d.linesOfCodeDeleted;
            case "gitCodeCommits":
                return d.gitCommits;
            case "gitPulls":
                return d.gitPulls;
            case "gitReleases":
                return d.gitReleases;
            case "gitDeployments":
                return d.gitDeployments;

        }
    }

    setData(){
        switch (this.rankingType) {
            case "completedStoryPoints":
                return jiraRepo.velocityCompletedStoryPoints;
            case "completedStories":
                return jiraRepo.velocityCompletedStoryCount;
            case "gitNetLinesOfCode":
                return gitRepo.velocityChartNetLoc;
            case "gitLinesOfCodeAdditions":
                return gitRepo.velocityChartAdditions;
            case "gitLinesOfCodeDeletions":
                return gitRepo.velocityChartDeletions;
            case "gitCodeCommits":
                return gitRepo.velocityChartCommitActivity;
            case "gitPulls":
                return gitRepo.pulls;
            case "gitReleases":
                return gitRepo.releases;
            case "gitDeployments":
                return gitRepo.deployments;
            default:
                alert("Unknown ranking type!")
        }
    }

    get rankingType(){return this._rankingType;}

    set rankingType(rankingType){this._rankingType = rankingType;}

    get data(){return this._data;}
    set data(data){this._data = data;}

    get jiraRepo(){return this._jiraRepo;}
}




