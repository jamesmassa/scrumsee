/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
const useSampleData = false;

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, (useSampleData ? "data/CFX-data-scrubbed.json" : "data/JV-12-7-19.json"))
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/metrics.json")
        .defer(d3.json, "data/jira-issues.json")
        .defer(d3.json, "data/jira-epics.json")
        .defer(d3.json, "data/jira-sprints.json")
        .defer(d3.json, "data/jira-versions.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData, issuesData, epicsData, sprintsData, versionsData) {

        console.log(issuesData);
        console.log(epicsData);
        console.log(sprintsData);
        console.log(versionsData);

        //Get all issues for a epic with getEpicsUrl + [epicId] + issue
        //https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/10093/issue

        //Get all issues for a sprint with getSprintsUrl + [sprintId] + issue
        //This works: https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/2/issue

        const refData = {
                "baseUrl": "https://seescrum.atlassian.net/", //use this for both Jira Screens and Jira API
                "restUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/", //Add resource name to the Rest URL
                "getIssuesUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/issue",
                "getEpicsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/",
                "getIssuesWithoutEpicUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/none/issue",
                "getSprintsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/",
                "getBacklogUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/backlog/",
                "getVersionsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/version/",

                "sprintField": "customfield_10020",
                "storyPointField": "customfield_10026",
                "priorities": [],
                "components": [],
                "issueTypes": [],
                "statuses": []
        }
        const jiraRepoData = {
                "issues": issuesData,
                "epics": epicsData,
                "sprints": sprintsData,
                "versions": versionsData,
                "refdata": refData
        }

        const jiraRepo = new JiraRepo(jiraRepoData);

        const issueStore = (useSampleData ? new IssueStore(jiraData) : new IssueStore(jiraData, "customfield_10020", "customfield_10028" )) ;
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        const margin = {top: 0, right: 0, bottom: 0, left: 0};
        const marginScrumSee = { top: 0, right: 0, bottom: 0, left: 0 };
        const marginScope = { top: 0, right: 0, bottom: 0, left: 0 };
        const marginRetro = { top: 0, right: 0, bottom: 0, left: 0 };
        const marginVelocity = { top: 0, right: 0, bottom: 0, left: 0 };
        const width = 0;
        const height = 0;
        const colorScheme = scrumColorScheme;

        const svgScrumSee = new Svg("#scrumsee-svg", 1400, 210, marginScrumSee);
        const svgVelocity = new Svg("#velocity-chart",  800, 400, marginVelocity);
        const svgScope = new Svg("#scope-chart", width/2, height, marginScope);
        const svgStory = new Svg("#story-chart", width/2, height, margin);
        const svgRetro = new Svg("#retrospective-chart", 0, 0, marginRetro);
        const svgEmployee = new Svg("#employee-chart", width, height, margin);

        const visScrumSee = new SeeScrum(svgScrumSee, issueStore, scrumTextStore, retroStore);
        const visVelocity = new VelocityChart2(issueStore, svgVelocity, colorScheme, eventHandler);
        const visStory = new StoryChart2(issueStore, svgStory);
        const visScope = new ScopeChart(issueStore, svgScope, visStory,'', colorScheme, eventHandler);
        new RetroChart(retroData.slice(16,21), svgRetro);
        new EmployeeChart2(issueStore, svgEmployee);

        d3.select(window).on(
            'resize.' + svgScrumSee.containerElem.attr('id'),
            () => {
                    svgScrumSee.width = parseInt(svgScrumSee.containerElem.style('width'));
                    visScrumSee.drawScrumDiagram();
            }
        );

        //Bind events
        $(eventHandler).bind("selectedIssuePropertyChange", function(event, selection) {
                issueStore.onSelectedIssuePropertyChange(selection, function () {
                        visVelocity.onSelectedLayerChange(selection);
                        visScope.onSelectedPropertyChange();
                });
        });

        $(eventHandler).bind("selectedSprintChange", (event, selection) => {
                issueStore.onSelectedSprintChange(selection, ()=> {
                        visScope.updateVis();
                        //todo update sprint cards
                });
        });

        $(eventHandler).bind("selectedVisualizationChange", (event, selection) => {
                if (selection === "velocity-visualization") visVelocity.onSelectedVisualizationChange();
                else if (selection === "scope-visualization") visScope.onSelectedVisualizationChange();

        });

        //bind triggers
        d3.select("#issue-property-selector").on("change", function () {
                $(eventHandler).trigger("selectedIssuePropertyChange", d3.select("#issue-property-selector").property("value"));
        });

        d3.select("#issue-metric-selector").on("change", function () {
                $(eventHandler).trigger("selectedMetricChange", d3.select("#issue-metric-selector").property("value"));
        });


}

