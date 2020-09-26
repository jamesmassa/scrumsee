/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
let jiraRepo = null;
let gitRepo = null;

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, "data/JV-12-7-19.json")
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/retrospective-scores.json")
        .defer(d3.json, "data/jira-issues.json")
        .defer(d3.json, "data/jira-epics.json")
        .defer(d3.json, "data/jira-sprints.json")
        .defer(d3.json, "data/jira-versions.json")
        .defer(d3.json, "data/git-commits.json")
        .defer(d3.json, "data/git-languages.json")
        .defer(d3.json, "data/git-contributors.json")
        .await(visualize);
});

function visualize(error, jiraData, scrumText, retroData, issuesData, epicsData, sprintsData, versionsData, commitData, languageData, contributorData) {

        console.log(issuesData);
        console.log(epicsData);
        console.log(sprintsData);

        console.log(commitData);
        console.log(languageData);
        console.log(contributorData);
        
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
                "getCommitsUrl": "https://api.github.com/repos/jamesmassa/scrumsee/commits",
                "getLanguagesUrl": "https://api.github.com/repos/jamesmassa/scrumsee/languages",
                "getContributorsUrl": "https://api.github.com/repos/jamesmassa/scrumsee/contributors"
        }
        const jiraRepoData = {
                "issues": issuesData,
                "epics": epicsData,
                "sprints": sprintsData,
                "versions": versionsData,
                "refdata": refData
        }

        jiraRepo = new JiraRepo(jiraRepoData);
        console.log(jiraRepo.issues);
        console.log(jiraRepo.epics);
        console.log(jiraRepo.sprints);

        const gitRepoData = {
                "commits": commitData,
                "languages": languageData,
                "contributors": contributorData
        }

        gitRepo = new GitRepo(gitRepoData);
        console.log(gitRepo.commits);
        console.log(gitRepo.languages);
        console.log(gitRepo.contributors);

        const issueStore = ( new IssueStore(jiraData, "customfield_10020", "customfield_10028" )) ;
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        const marginScrumSee = { top: 0, right: 0, bottom: 0, left: 0 };
        const marginRetro = { top: 0, right: 0, bottom: 0, left: 0 };
        //const marginVelocity = { top: 0, right: 0, bottom: 0, left: 0 };
        const colorScheme = scrumColorScheme;

        const svgScrumSee = new Svg("#scrumsee-svg", 1400, 210, marginScrumSee);
        const svgRetro = new Svg("#retrospective-chart", 0, 0, marginRetro);
        //const svgVelocity = new Svg("#velocity-chart",  800, 400, marginVelocity);

        const visSeeScrum = new SeeScrum(svgScrumSee, scrumTextStore, retroStore, jiraRepo);
        const visVelocity = new VelocityChart(issueStore, "#velocity-chart", colorScheme, eventHandler);
        new RetroChart(retroData.slice(16,21), svgRetro);

        d3.select(window).on(
            'resize.' + svgScrumSee.containerElem.attr('id'),
            () => {
                    svgScrumSee.width = parseInt(svgScrumSee.containerElem.style('width'));
                    visSeeScrum.drawScrumDiagram();
            }
        );

        //Bind events
        $(eventHandler).bind("selectedIssuePropertyChange", function(event, selection) {
                issueStore.onSelectedIssuePropertyChange(selection, function () {
                        visVelocity.onSelectedLayerChange(selection);
                });
        });

        $(eventHandler).bind("selectedSprintChange", (event, selection) => {
                issueStore.onSelectedSprintChange(selection, ()=> {
                        //todo update sprint cards
                });
        });

        $(eventHandler).bind("selectedVisualizationChange", (event, selection) => {
                if (selection === "velocity-visualization") visVelocity.onSelectedVisualizationChange();

        });

        //bind triggers
        d3.select("#issue-property-selector").on("change", function () {
                $(eventHandler).trigger("selectedIssuePropertyChange", d3.select("#issue-property-selector").property("value"));
        });

        d3.select("#issue-metric-selector").on("change", function () {
                $(eventHandler).trigger("selectedMetricChange", d3.select("#issue-metric-selector").property("value"));
        });


}

