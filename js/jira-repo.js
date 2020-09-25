class Issue {
    constructor(issue) {
        this._issue = issue;
    }

    get sprint () {
        const str = String(this.issue.fields.customfield_10020);
        const start = str.lastIndexOf('id=') + 3;
        const length = str.slice(start).indexOf(",");

        return parseInt(str.substring(start, start + length));
    }

    get epic () {
        return this.issue.fields.customfield_10014;
    }

    get issue(){return this._issue;}

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
        this._issues.push(issue);
    }

    getFilteredIssues(filterFunc){return this._issues.filter(filterFunc)};

    get totalStories(){return this._issues.count();}
    get totalStoryPoints(){return this._issues.reduce((sum, issue) => sum + issue.storyPoints);}
    get completedStories(){return this._issues.filter(issue => issue.status.name === "Done");}
    get completedStoryPoints(){return this.completedStories.reduce((sum, issue) => acc + issue.storyPoints);}

    get issues(){return this._issues;}
    set issues(issues){this._issues = issues;}

    get priorities(){return Array.from(new Set(this.issues.map(issue => issue.priority)));}
    get issueTypes(){return Array.from(new Set(this.issues.map(issue => issue.issuetype)));}
    get statuses(){return Array.from(new Set(this.issues.map(issue => issue.status)));}
}

class Epic {
    constructor(data){
        this._id = parseInt(data.id);
        this._name = data.name;
        this._summary = data.summary;
        this._url = data.self;
    }
    get issues(){return jiraRepo._issues.getFilteredIssues(issue => issue.epic.id === this.id);}

    get id(){return this._id;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}

    get totalStories(){return this.issues.count();}
    get totalStoryPoints(){return this.issues.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}
    get completedStories(){return this.issues.filter(issue => issue.status === "Done");}
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

    get issues(){return jiraRepo._issues.getFilteredIssues(issue => issue.sprint === this.id);}
    get blockers(){return jiraRepo._issues.getFilteredIssues( issue => issue.status === "Blocked");}
    get totalBlockers(){return this.blockers.length;}
    get totalStories(){return this.issues.length;}
    get totalStoryPoints(){return this.issues.reduce((sum, issue) => {return sum + issue.storyPoints;}, 0);}
    get completedStories(){return this.issues.filter(issue => issue.status === "Done");}
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
    get completedSprints() {return this._sprints.filter(sprint => sprint.state === "completed");}
    get sprints(){return this._sprints;}
}

class JiraRepo {

    constructor(data) {
        this._issues = new Issues(data.issues.issues);
        this._sprints = new Sprints(data.sprints.values);
        this._epics = new Epics(data.epics.values);
        this._refData = data.refData;
        this._parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");
    }

    get backlog(){return this._issues.getFilteredIssues(issue => issue.sprint.id === null);}
    get activeSprint(){return this._sprints.activeSprint;}
    get previousSprint(){return this._sprints.previousSprint;}
    get futureSprints(){return this._sprints.futureSprints;}
    get completedSprints(){return this._sprints.completedSprints;}

    get sprints() {return this._sprints;}
    get issues(){return this._issues;}
    get epics(){return this._epics;}
    get refData(){return this._refData;}

}