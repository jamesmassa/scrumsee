class Issue {
    constructor(issue) {
        this._issue = issue;
    }

    get sprintId () { return this.issue.fields.customfield_10020[0].id;}

    get epic () {
        return this.issue.fields.customfield_10014;
    }

    get issue(){return this._issue;}
    get rollovers(){return this.issue.fields.customfield_10020};
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
    get completedStoryPoints(){return this.completedStories.reduce((sum, issue) => sum + issue.storyPoints);}

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
    get issues(){return jiraRepo.issues.getFilteredIssues(issue => issue.epic.id === this.id);}

    get id(){return this._id;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}

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

        this._codeCommits = gitRepo.commits._commits.filter(commit =>
            commit._commit.commit.author.date > this._startDate && commit._commit.commit.author.date < this._endDate);

        const calculations = this.calcContributorsAndLOC();
        this._netLinesOfCode = calculations.netLinesOfCode;
        this._linesOfCodeDeleted = calculations.LOCDeletions;
        this._linesOfCodeAdded = calculations.LOCAdditions;
        this._contributors = calculations.contributors;

    }

    calcContributorsAndLOC(){

        let contributors = new Set();
        let LOCAdditions = 0;
        let LOCDeletions = 0;

        let serviceCallCount = 0;

        this.codeCommits.forEach(commit => {
            const sha = commit._commit.commit.tree.sha;
            const url = refData.getCommitUrl + sha;
            console.log(url);

            const getCommit = async () => {
                const response = await fetch(url);
                const fullCommit = await response.json();
                LOCAdditions += fullCommit.stats.additions;
                LOCDeletions += fullCommit.stats.deletions;
                contributors.add(fullCommit.author.name);
            }

            if (serviceCallCount <= 2){
                serviceCallCount += 1;
                getCommit();
            }
        });

        return {
            "netLinesOfCode": LOCAdditions - LOCDeletions,
            "LOCAdditions": LOCAdditions,
            "LOCDeletions": LOCDeletions,
            "contributors": contributors
        }

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

    get codeCommits(){return this._codeCommits}
    get contributors(){return this._contributors}
    get netLinesOfCode(){return this._netLinesOfCode;}
    get linesOfCodeDeleted(){return this._LOCDeletions;}
    get linesOfCodeAdded(){return this._LOCAdditions;}

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
        this._issues = new Issues(data.issues);
        this._sprints = new Sprints(data.sprints.values);
        this._epics = new Epics(data.epics.issues);
        this._parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");
    }

    get backlog(){return this._issues.getFilteredIssues(issue => issue.sprintId === null);}
    get activeSprint(){return this._sprints.activeSprint;}
    get previousSprint(){return this._sprints.previousSprint;}
    get futureSprints(){return this._sprints.futureSprints;}
    get completedSprints(){return this._sprints.completedSprints;}

    get sprints() {return this._sprints;}
    get issues(){return this._issues;}
    get epics(){return this._epics;}

}
