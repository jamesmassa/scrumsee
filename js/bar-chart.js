//TODO  GET THE DATA
// 1. add git charts
//      a. Tune up the 3 scaleLOC ranking types:
//          https://github.com/d3/d3-scale/blob/master/README.md#band-scales
//          a1. Y-Scale: Use scaleBand a to simulate a scaleLog
//              Categorize the input data into 1 line, 10 lines, 100,...1MM
//              Remove the 10,000 line limiter
//              Remove the week slice
//          a2. X-Scale:  Use scaleTime and feed it JS Dates rather than string dates, less ticks and remove rotate
//      b.  Fix Bugs if still there:
//          b1. Second time going to code commits in Velocity chart doesn't update display
//              JS error because sprintId undefined in gitRepo.statsCodeFrequency() because stat.week is undefined
//          b2. Why do scaled Y values start at 760 when I'm expecting 0?
//          b3. There is a big bar on left for 3 LOC which is the width of the other rankingValue bars.
// 2. add Language stats data to display of every git chart
// 3. add git data to summary cards

//TODO DISPLAY DATA
// 1. Label bar chart with values including
//      https://jsfiddle.net/nordible/pmyu26ss/
//      Completed: Blue bar with value label at top above the bar
//      Committed Gray bar with value label at top above the bar
//      Incomplete draw a line inside the committed bar. Give the top of the bar an orange fill and put the incomplete label inside the orange tip
//      Completed + Incomplete = Committed
// 2. Gradient Trend line with bottom line summary statement

//TODO INTERACTION
// 1. Filters:  Priority, component, issue type.
// 2. Set time period to measure by sprint but drop down shows the date, i.e., SS Sprint 1 8/12 - 9/2
// 3. Hover over a bar to see the list of completed stories
// 4. Option to exclude outliers beyond configurable threshold
// 5. Negative velocity for bugs
// 6. Value Add vs. friction
// 7. Velocity per team member


class BarChart {
    constructor (svg, jiraRepo, gitRepo){
        this._svg = svg;
        this._rankingType = "completedStoryPoints";
        this._jiraRepo = jiraRepo;
        this._gitRepo = gitRepo;
        this._axisFontSize = "10px";
        this._axisFontWeight = "bold";
        this._duration = 1000;
        this._initialized = false;
        this.velocityWeekCount = -12;
    }

    render() {
        this.data = this.setData();

        this._x = d3.scaleBand().rangeRound([0, this.svg.width]);
        this._y = this.getYScale();

        this.setXDomain();
        this._y.domain([0, d3.max(this._data, d=> {
            console.log("Y DOMAIN RANKING VALUE: ", this.getRankingValue(d));
            return this.getRankingValue(d);
        })]);

        this._xAxis = d3.axisBottom().scale(this._x);
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

    getYScale(){

        switch (this.rankingType) {
            case "completedStoryPoints":
            case "completedStories":
            case "gitCodeCommits":
            case "gitPulls":
            case "gitReleases":
            case "gitDeployments":
                return d3.scaleLinear().range([this.svg.height, 0]);
            case "gitNetLinesOfCode":
            case "gitLinesOfCodeAdditions":
            case "gitLinesOfCodeDeletions":
                return d3.scaleLinear().range([this.svg.height, 0]);
        }
    }

    setXDomain(){
        switch (this.rankingType) {
            case "completedStoryPoints":
            case "completedStories":
            case "gitCodeCommits":
                this._x.domain(this.jiraRepo.velocitySprintNames);
                break;
            case "gitNetLinesOfCode":
            case "gitLinesOfCodeAdditions":
            case "gitLinesOfCodeDeletions":
                console.log("X DOMAIN: ", this.gitRepo.statsCodeFrequency.map(stat => stat.week))
                this._x.domain(this.gitRepo.statsCodeFrequency.map(stat => stat.week).slice(this.velocityWeekCount));
                break;
            case "gitPulls":
            case "gitReleases":
            case "gitDeployments":
                alert("Under Construction")
                this._x.domain(this.gitRepo.statsCodeFrequency.map(stat => stat.week));
                break;
        }
    }

    renderYLabel(){
        this._svg.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -190)
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
            .attr("width", () => this.getBarWidth())
            .style("opacity", 1);

        bar.merge(enter)
            .attr("y", d => {
                console.log("d: " , this.getRankingValue(d));
                console.log("scaled Y value of d:  ", this._y(this.getRankingValue(d)));
                return this._y(this.getRankingValue(d));
            })
            .attr("height", d=> this._svg.height - this._y(this.getRankingValue(d)));

        bar.exit().remove();

    }

    getBarWidth(){
        return (this.rankingType === "gitNetLinesOfCode" ||
            this.rankingType === "gitLinesOfCodeAdditions" ||
            this.rankingType === "gitLinesOfCodeDeletions") ? 15 : this._x.bandwidth() - 5;
    }

    renderAxis(dimension){

        const axis = this._svg.svg.append("g")
            .attr("class", dimension + "-axis");

        if (dimension === "x") {
            const height = this._svg.height;
            axis.attr("transform", "translate(0," + height + ")");

        }

        const scale = dimension === "x" ? this._xAxis : this._yAxis;

        axis.style("font-size", this._axisFontSize)
            .style("font-weight", this._axisFontWeight)
            .call(scale)

        if (dimension === "x" &&
            (this.rankingType === "gitNetLinesOfCode" ||
             this.rankingType === "gitLinesOfCodeAdditions" ||
             this.rankingType === "gitLinesOfCodeDeletions")
        ) {
            axis.selectAll("text")
                .attr("transform", "rotate(90)")
        }

    }

    updateAxis(dimension){

        const axis = this._svg.svg.selectAll("." + dimension + "-axis");
        const scale = dimension === "x" ? this._xAxis : this._yAxis;

        axis.transition()
            .duration(this._duration)
            .call(scale);

        if (dimension === "x" &&
            (this.rankingType === "gitNetLinesOfCode" ||
                this.rankingType === "gitLinesOfCodeAdditions" ||
                this.rankingType === "gitLinesOfCodeDeletions")
        ) {
            axis.selectAll("text")
                .attr("transform", "rotate(270)")
        }
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
                return (Math.abs(d.netLinesOfCode) > 10000 ? 10000 : Math.abs(d.netLinesOfCode));
            case "gitLinesOfCodeAdditions":
                return (Math.abs(d.linesOfCodeAdded) > 10000 ? 10000 : Math.abs(d.linesOfCodeAdded));
            case "gitLinesOfCodeDeletions":
                return (Math.abs(d.linesOfCodeDeleted) > 10000 ? 10000 : Math.abs(d.linesOfCodeDeleted));
            case "gitCodeCommits":
                return d.gitCodeCommits;
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
                if (!this.velocityCompletedStoryPoints) {
                    this.velocityCompletedStoryPoints = jiraRepo.velocityCompletedStoryPoints;
                }
                return this.velocityCompletedStoryPoints;
            case "completedStories":
                if (!this.velocityCompletedStoryCount){
                    this.velocityCompletedStoryCount = jiraRepo.velocityCompletedStoryCount;
                }
                return this.velocityCompletedStoryCount;
            case "gitNetLinesOfCode":
            case "gitLinesOfCodeAdditions":
            case "gitLinesOfCodeDeletions":
                return gitRepo.statsCodeFrequency.slice(this.velocityWeekCount);
            case "gitCodeCommits":
                if (!this.velocityChartCommitActivity) {
                    this.velocityChartCommitActivity = gitRepo.velocityChartCommitActivity;
                }
                return this.velocityChartCommitActivity;
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
    get gitRepo(){return this._gitRepo;}

    get svg(){return this._svg;}
}




