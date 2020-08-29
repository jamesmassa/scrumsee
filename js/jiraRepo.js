/**
 * IssueStore functions
 *
 * initStore: process raw Jira data to convert strings to objects and to add helperfunctions to issues and sprints
 * getSprints: returns all sprints
 * getIssues: returns all issues
 * getIssuesForSprint(<sprint object> or <sprint id>): returns all issues associated with a sprint
 * getBacklogUrl: returns the url for the backlog in Jira
 * getStoryPointField: returns the field ID (string) of the field used for story points. Example: customfield_10003
 * getSprintUrlForSprint(<sprint object> or <sprint id>): returns the url of the sprint in Jira
 *
 * IssueStore properties
 * activeSprint: returns the sprint that has a state of ACTIVE
 * selectedSprint: returns the sprint that is currently selected
 */

/**
 * Sprint properties
 *
 * id: id of the sprint
 * rapidViewId: id of the Jira board that the sprint was created in
 * completeDate: date object of date sprint was completed
 * endDate: date object of date sprint is scheduled to end
 * startDate: date object of date sprint is scheduled to start (or actually started?)
 * goal: optional string of the goal of the sprint. Example "focus on tech debt"
 * name: name of sprint
 * sequence: positioning of sprint in the board (relative to other sprints)
 * state: state of sprint. Either ACTIVE, CLOSED, or FUTURE
 * totalStoryPoints: generated property for sum of story points of all issues in the sprint
 * completedStoryPoints: generated property for sum of story points for COMPLETED issues in the sprint
 */


/**
 * Issue properties
 *
 * This is not an exhaustive list.
 *
 * id: id of the sprint. This is not recognizable to users, use key for display
 * key: Jira key of the issue. <project key>-<number (not id)> Example: CFX-123
 * storyPoints: story points of issue. Will always be initialized to 0
 * isResolved: boolean of if issue is resolved or unresolved
 * fields.reporter.displayName: display name of the reporter of the issue
 * fields.assignee.displayName: display name of the assignee of the issue. May be null
 * fields.priority.name: name of issue's current priority
 * fields.status.name: name of issue's current status
 * fields.summary: summary of the issue (display name of the issue)
 * fields.created: date object of created date
 * fields.resolutiondate: date object of created date. May be null
 * fields.updated: date object of updated date (when anything was last done to the issue including transitioning or edits)
 * fields.description: descroption of the issue
 * fields.issuetype.name: name of the issue type
 *
 */

class Issue {
    constructor(issue) {
        this._issue = issue;
    }

    get name () {
        return this._issue.summary;
    }

    get sprint () {
        return this._issue['customfield_10020'][0]; //ToDo match on 'id=' to pick up sprint id
    }

    get epic () {
        return this._issue.customfields['customfield_10014'];
    }

    get type() {return this._issue.type['#text'];}
    get status() {return this._issue.status['#text']}
    get storyPoints(){return this._issue.customfields['customfield_10026']};
}

//Collection of Issue objects: a Repo, a Sprint, an Epic, or a Backlog
class Issues {
    constructor(data) {
        this._issues = data.forEach(issue => new(Issue));
    }

    addIssue(issue){
        this._issues.push(issue);
    }

    getFilteredIssues(filterFunc){return this._issues.filter(filterFunc)};

    sum(prop) {
        return this._issues.reduce(function (a, b) {
            return a + b[prop];
        }, 0);
    }

    get totalStories(){return this._issues.count();}
    get totalStoryPoints(){return this.sum("storyPoints");}
    get completedStoryPoints(){return this.sum("completedStoryPoints");}

    get issues(){return this._issues;}
    set issues(issues){this._issues = issues;}

    get priorities(){return Array.from(new Set(this.issues.map(issue => issue.priority)));}
    get issueTypes(){return Array.from(new Set(this.issues.map(issue => issue.issuetype)));}
    get statuses(){return Array.from(new Set(this.issues.map(issue => issue.status)));}
}

class Epic {
    constructor(data){
        this._id = data.id;
        this._name = data.name;
        this._summary = data.summary;
        this._url = data.self;
    }

    get issues(){return this._jiraRepo.issues.getFilteredIssues(this.filterByEpic);}
    filterByEpic(){};
    get id(){return this._id;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}
}

class Epics {
    constructor(data) {
        this._epics = data.forEach(epic => new Epic(epic));
    }
}

class Sprint {
    constructor(data){
        this._id = data.id;
        this._name = data.name;
        this._summary = data.summary;
        this._url = data.self;
        this._goal = data.goal;

    }

    get issues(){return jiraRepo._issues.getFilteredIssues(issue => issue.sprint.id == id);}
    get blockers(){return jiraRepo._issues.getFilteredIssues( issue => issue.status === "Blocked");}
    get id(){return this._id;}
    get name(){return this._name;}
    get summary(){return this._summary;}
    get url(){return this._url;}
    get goal(){return this._goal;}
}

class Sprints {
    constructor(data) {
        this._sprints = data.forEach(sprint => new Sprint(sprint));
    }

    get activeSprint() {return this._sprints.find(sprint => sprint.state === "active");}
    get futureSprints() {return this._sprints.filter(sprint => sprint.state === "future");}
    get completedSprints() {return this._sprints.filter(sprint => sprint.state === "completed");}
}

class JiraRepo {

    constructor(data) {

        this._issues = new Issues(data.issues.issues);
        this._sprints = new Sprints(data.sprints.values);
        this._epics = new Epics(data.epics.values);
        this._refData = data.refData;
        //this._parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");
    }

    get backlog(){return this._issues.issues.getFilteredIssues(issue => issue.sprint.id === null);}
    get activeSprint(){return this._sprints.activeSprint;}
    get futureSprints(){return this._sprints.futureSprints;}
    get completedSprints(){return this._sprints.completedSprints;}

    get sprints() {return this._sprints;}
    get issues(){return this._issues;}
    get epics(){return this._epics;}
    get refData(){return this._refData;}

}
