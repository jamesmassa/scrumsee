class Issue {
    constructor(issue) {
        this._issue = issue;
    }

    get sprintId () {
        let sprints = this.issue.fields.customfield_10020;
        return sprints[sprints.length - 1].id;
    }

    get epic () {
        return this.issue.fields.customfield_10014;
    }

    get issue(){return this._issue;}
    get rollovers(){return this.issue.fields.customfield_10020.slice(0, -1)};
    get name() {return this.issue.fields.summary;}
    get type() {return this._issue.type['#text'];}
    get status() {return this._issue.fields.status.name;}
    get storyPoints() {return this.issue.fields.customfield_10026};
    get key() {return this._issue.fields.key;} // <project key>-<number> Example: SS-123
    get reporter(){ return this._issue.fields.reporter.displayName; } // display name of the reporter of the issue
    get displayName(){ return this._issue.fields.assignee.displayName;} //display name of the assignee of the issue. May be null
    get priority(){ return this._issue.fields.priority.name;}
    get summary(){return this._issue.fields.summary;} //Display name of the issue
    get created(){return this._issue.fields.created;}
    get resolutionDate(){return this._issue.fields.resolutiondate;}
    get updated(){return this._issue.fields.updated;}
    get description(){return this._issue.fields.description;}
    get issueType(){return this._issue.fields.issuetype.name;}

}

//Collection of Issue objects: a Repo, a Sprint, an Epic, or a Backlog
class Issues {
    constructor(data) {
        this._issues = data.map(issue => new Issue(issue));
    }

    addIssue(issue){
        this.issues.push(issue);
    }

    getFilteredIssues(filterFunc){return this.issues.filter(filterFunc)};

    get totalStories(){return this.issues.count();}
    //get totalStoryPoints(){return this.issues.reduce((sum, issue) => sum + issue.storyPoints);}
    get totalStoryPoints(){
        let total = 0;
        this.issues.forEach(issue => total += issue.storyPoints);
        return total;
    }

    get completedStories(){return this.issues.filter(issue => issue.status === "Done");}
    get completedStoryPoints() {
        let total = 0;
        this.completedStories.forEach(issue => total += issue.storyPoints);
        return total;
    }

    get issues(){return this._issues;}
    set issues(issues){this._issues = issues;}

    get priorities(){return Array.from(new Set(this.issues.map(issue => issue.priority)));}
    get issueTypes(){return Array.from(new Set(this.issues.map(issue => issue.issuetype)));}
    get statuses(){return Array.from(new Set(this.issues.map(issue => issue.status)));}
}

class Epic {
    constructor(data){
        this._id = parseInt(data.id);
        this._name = data.fields.customfield_10011;
        this._summary = data.summary;
        this._url = data.self;
        this._key = data.key;
        this._colorLabel = data.fields.customfield_10013;
    }
    get issues(){return jiraRepo.issues.getFilteredIssues(issue => issue.epic.id === this.id);}

    get id(){return this._id;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}
    get key(){return this._key;}
    get colorLabel(){return this._colorLabel;}
    get color(){return jiraRepo.epicColors.find(color => color.label === this.colorLabel).color;}
    get backgroundColor(){return jiraRepo.epicColors.find(color => color.label === this.colorLabel).backgroundColor;}

    get blockers(){return jiraRepo.issues.getFilteredIssues( issue => issue.status === "Blocked");}
    get totalBlockers(){return this.blockers.length;}
    get totalStories(){return this.issues.length;}
    get totalStoryPoints(){return this.issues.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}
    get completedStories(){return this.issues.filter(issue => issue.status === "Done");}
    get totalCompletedStories(){return this.issues.filter(issue => issue.status === "Done").length;}
    get completedStoryPoints(){return this.completedStories.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}

    get priorities(){return Array.from(new Set(this.issues.map(issue => issue.priority)));}
    get issueTypes(){return Array.from(new Set(this.issues.map(issue => issue.issuetype)));}
    get statuses(){return Array.from(new Set(this.issues.map(issue => issue.status)));}

}

class Epics {
    constructor(data) {
        this._epics = data.map(epic => new Epic(epic));
    }
}

class Sprint {
    constructor(data){
        this._id = parseInt(data.id);
        this._number = this.id + 1;
        this._name = data.name;
        this._summary = data.summary;
        this._url = data.self;
        this._goal = data.goal;
        this._state = data.state; //ACTIVE, CLOSED, or FUTURE
        this._startDate = data.startDate;
        this._endDate = data.endDate; //scheduled
        this._completeDate = data.completeDate; //actual
        this._sequence = data.sequence; //positioning of sprint in the board relative to other sprints
        this._rapidViewId = data.rapidViewId; //id of the Jira board that the sprint was created in
    }


    get issues(){return jiraRepo.issues.getFilteredIssues(issue => issue.sprintId === this.id);}
    get blockers(){return jiraRepo.issues.getFilteredIssues( issue => issue.status === "Blocked");}
    get totalBlockers(){return this.blockers.length;}
    get totalStories(){return this.issues.length;}
    get totalStoryPoints(){return this.issues.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}
    get completedStories(){return this.issues.filter(issue => issue.status === "Done");}
    get totalCompletedStories(){return this.issues.filter(issue => issue.status === "Done").length;}
    get completedStoryPoints(){return this.completedStories.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}

    get id(){return this._id;}
    get number(){return this._number;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}
    get goal(){return this._goal;}
    get state(){return this._state;}
    get sequence(){return this._sequence;}
    get rapidViewId(){return this._rapidViewId;}
    get startDate(){return jiraRepo._parseDate(this._startDate);}
    get endDate(){return jiraRepo._parseDate(this._endDate);}
    get completeDate(){return jiraRepo._parseDate(this._completeDate);}

    get priorities(){return Array.from(new Set(this.issues.map(issue => issue.priority)));}
    get issueTypes(){return Array.from(new Set(this.issues.map(issue => issue.issuetype)));}
    get statuses(){return Array.from(new Set(this.issues.map(issue => issue.status)));}

}

class Sprints {
    constructor(data) {
        this._sprints = data.map(sprint => new Sprint(sprint));
    }

    get activeSprint() {return this._sprints.find(sprint => sprint.state === "active") ;}
    get previousSprint() {return this._sprints.find(sprint => sprint.id === (this.activeSprint.id - 1));}
    get futureSprints() {return this._sprints.filter(sprint => sprint.state === "future");}
    get completedSprints() {return this._sprints.filter(sprint => sprint.state === "closed");}
    get sprints(){return this._sprints;}
}

class JiraRepo {

    constructor(data) {
        this._issues = new Issues(data.storyHistoryData.issues.concat(
            data.activeStoryData.issues.concat(data.futureStoryData.issues)));

        this._historicalStories = new Issues(data.storyHistoryData.issues);
        this._activeStories = new Issues(data.activeStoryData.issues);
        this._futureStories = new Issues(data.futureStoryData.issues);

        this._velocityChartData = data.velocityChartData;
        this._burnDownChartData = data.burnDownChartData;
        this._releaseBurnDownChartData = data.releaseBurnDownChartData;
        this._epicBurnDownChartData = data.epicBurnDownChartData;
        this._cumulativeFlowChartData = data.cumulativeFlowChartData;

        this._sprints = new Sprints(data.sprints.values);
        this._epics = new Epics(data.epics.issues);

        this._parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");

        this._epicColors = [
            {"label": "ghx-label-1", "color": "#FFFFFF", "backgroundColor": "#42526E"},
            {"label": "ghx-label-2", "color": "#172B4D", "backgroundColor": "#FFC400"},
            {"label": "ghx-label-3", "color": "#42526E", "backgroundColor": "#FFE380"},
            {"label": "ghx-label-4", "color": "#172B4D", "backgroundColor": "#4C9AFF"},
            {"label": "ghx-label-5", "color": "#172B4D", "backgroundColor": "#00C7E6"},
            {"label": "ghx-label-6", "color": "#006644", "backgroundColor": "#79F2C0"},
            {"label": "ghx-label-7", "color": "#403294", "backgroundColor": "#C0B6F2"},
            {"label": "ghx-label-8", "color": "#172B4D", "backgroundColor": "#998DD9"},
            {"label": "ghx-label-9", "color": "#42526E", "backgroundColor": "#FFBDAD"},
            {"label": "ghx-label-10", "color": "#0049B0", "backgroundColor": "#B3D4FF"},
            {"label": "ghx-label-11", "color": "#42526E", "backgroundColor": "#79E2F2"},
            {"label": "ghx-label-12", "color": "#42526E", "backgroundColor": "#EBECF0"},
            {"label": "ghx-label-13", "color": "#172B4D", "backgroundColor": "#57D9A3"},
            {"label": "ghx-label-14", "color": "#172B4D", "backgroundColor": "#FF8F73"}
        ];
    }

    get epicColors(){return this._epicColors;}
    get backlog(){return this.futureStories;}
    get activeSprint(){return this.sprints.activeSprint;}
    get previousSprint(){return this.sprints.previousSprint;}
    get futureSprints(){return this.sprints.futureSprints;}
    get completedSprints(){return this.sprints.completedSprints;}
    get activeStories(){return this._activeStories;}
    get futureStories(){return this._futureStories;}

    get sprints() {return this._sprints;}
    get issues(){return this._issues;}
    get epics(){return this._epics;}

    // VELOCITY CHART METHODS
    get velocityStatEntries(){return Object.values(this._velocityChartData.velocityChartData.velocityStatEntries);}

    get velocitySprintNames() {
        const sortedSprints = this._velocityChartData.velocityChartData.sprints.sort((a, b) => (a.id > b.id) ? 1 : -1);
        return sortedSprints.map(sprint => sprint.name);
    }

    get velocityCompletedStoryPoints() {
        return this.velocityStatEntries.map(stat => stat.completed.value);}
    get velocityCommittedStoryPoints() {
        return this.velocityStatEntries.map(stat => stat.estimated.value);}
    get velocityCompletedStoryCount() {
        return this.velocityStatEntries.map(stat => stat.completedEntries.length);}
    get velocityCommittedStoryCount() {
        return this.velocityStatEntries.map(stat => stat.estimatedEntries.length);}


    get velocityChartSprints() {

        //Take the list of sprints required by the velocity chart and get the full data for the sprints
        //which includes startDate and CompletedDate
        //TODO eliminate redundant JSON nesting "_velocityChartData.velocityChartData" and double "sprints.sprints"
        let velocityChartSprints =
            this._velocityChartData.velocityChartData.sprints.map(sprint => this.sprints.sprints[sprint.id - 1]);

        // Add the velocityStartDate property to each sprints to ensure that the sprint dates don't overlap
        for (let i = 0; i < velocityChartSprints.length; i++) {
            if (i === velocityChartSprints.length - 1) {
                velocityChartSprints[i].velocityStartDate = velocityChartSprints[i].startDate
            } else {
                velocityChartSprints[i].velocityStartDate = velocityChartSprints[i + 1].completeDate;
            }
        }

        return velocityChartSprints;
    }



}
