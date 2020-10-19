/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
let jiraRepo = null;
let gitRepo = null;
let barChart = null;

//TODO Ultimately need to move all URLs to the python backend
const refData = {
        "baseUrl": "https://seescrum.atlassian.net/", //use this for both Jira Screens and Jira API
        "restUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/", //Add resource name to the Rest URL
        "getIssuesUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/issue",
        "getEpicsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/",
        "getIssuesWithoutEpicUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/none/issue",
        "getSprintsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/",
        "getBacklogUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/backlog/",
        "getVersionsUrl": "https://seescrum.atlassian.net/rest/agile/latest/board/1/version/",
        "getAllCommitsUrl": "https://api.github.com/repos/jamesmassa/scrumsee/commits/",
        "getCommitsForTimePeriod": "https://api.github.com/repos/jamesmassa/scrumsee/commits?since=2020-09-30T19:20:30-05:00&until=2020-10-02T19:20:30-05:00",
        "getCommitUrl": "https://api.github.com/repos/jamesmassa/scrumsee/commits/",
        //"https://api.github.com/repos/jamesmassa/scrumsee/commits/29dd80185c582c7fef0b4ae02c42d0968e2cae91", //add SHA at end.  Check "stats" key for additions and deletions counts
        "getAllLanguagesUrl": "https://api.github.com/repos/jamesmassa/scrumsee/languages",
        "getAllContributorsUrl": "https://api.github.com/repos/jamesmassa/scrumsee/contributors"
}

//Get all issues for a epic with getEpicsUrl + [epicId] + issue
//https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/10093/issue

//Get all issues for a sprint with getSprintsUrl + [sprintId] + issue
//This works: https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/2/issue

//Unix commands to get Git LOC stats
//git log --no-merges --pretty=format:%an --numstat -C | awk '/./ && !author { author = $0; next } author { ins[author] += $1; del[author] += $2 } /^$/ { author = ""; next } END { for (a in ins) { printf "%10d %10d %10d %s\n", ins[a] - del[a], ins[a], del[a], a } }' | sort -rn
//git log --no-merges --oneline --numstat -C
//git log --no-merges --author="jamesmassa" --oneline --numstat -C

//This gives the number of commits for each user
//git shortlog -s -n

document.addEventListener("DOMContentLoaded", () => {
// TODO Remove JV data
// TODO Replace all json files with flask services and move processing to the backend.  Front end is display only logic.
// TODO Lazy load data which will not be on the initial screen, e.g., chart data
// TODO Make services for Git data

    queue()
        .defer(d3.json, "data/JV-12-7-19.json")
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/jira-issues.json")
        .defer(d3.json, "data/jira-epics.json")
        .defer(d3.json, "data/jira-sprints.json")
        .defer(d3.json, "data/jira-versions.json")
        .defer(d3.json, "data/git-commits.json")
        .defer(d3.json, "data/git-languages.json")
        .defer(d3.json, "data/git-contributors.json")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-history")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-active")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-future")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-sprints")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-epics")
        // .defer(d3.json, "http://127.0.0.1:5000/api/jira-versions")
        // .defer(d3.json, "http://127.0.0.1:5000/api/velocity-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/burn-down-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/release-burn-down-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/epic-burn-down-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/retrospective-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/cumulative-flow-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/ifa")
        .await(visualize);
});

function visualize(error,
                   //Files to remove
                   jiraData, scrumText, issuesData, epicsData, sprintsData, versionsData, commitData, languageData, contributorData,

                   //Services to keep
                    storyHistoryData, activeStoryData, futureStoryData,
                        sprintData,
                   epicData,
                        //versionData,
                   // velocityChartData, burnDownChartData, releaseBurnDownChartData, epicBurnDownChartDate,
                   retrospectiveChartData,
                        //cumulativeFlowChartData,
                  ifaData
                ) {

        console.log("storyHistoryData:", storyHistoryData);
        console.log("activeStoryData:", activeStoryData);
        console.log("futureStoryData:", futureStoryData);
        console.log("sprintData:", sprintData);
        console.log("epicData", epicData);
        // console.log(versionData);
        // console.log(velocityChartData);
        // console.log(burnDownChartData);
        // console.log(releaseBurnDownChartData);
        // console.log(epicBurnDownChartDate);
        console.log("retrospectiveChartData:", retrospectiveChartData);
        // console.log(cumulativeFlowChartData);
       console.log("ifaData", ifaData);

        const gitRepoData = {
                "commits": commitData,
                "languages": languageData,
                "contributors": contributorData
        }

        gitRepo = new GitRepo(gitRepoData);
        console.log(gitRepo.commits);
        console.log(gitRepo.languages);
        console.log(gitRepo.contributors);

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

        const completedSprints = jiraRepo.sprints.completedSprints;
        console.log("completedSprints:");
        console.log(completedSprints);

        console.log("Total Storypoints:")
        completedSprints.forEach(s => console.log(s.totalStoryPoints));

        console.log("Total Stories:")
        completedSprints.forEach(sprint => {
                console.log("Sprint " + sprint.id, sprint.totalStories);
                });

        console.log("Completed Storypoints:")
        completedSprints.forEach(s => console.log(s.completedStoryPoints));

        console.log("Completed Stories:")
        completedSprints.forEach(s => console.log(s.completedStories));

        const issueStore = ( new IssueStore(jiraData, "customfield_10020", "customfield_10028" )) ;
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retrospectiveChartData);

        const marginSeeScrum = {top: 0, right: 0, bottom: 0, left: 0};
        const colorScheme = scrumColorScheme;
        const svgSeeScrum = new Svg("#scrumsee-svg", 1400, 210, marginSeeScrum);

        const visSeeScrum = new SeeScrum(svgSeeScrum, scrumTextStore, retroStore, jiraRepo, ifaData);
        const visVelocity = new VelocityChart(issueStore, "#velocity-chart", colorScheme, eventHandler);
        new RetroChart(retrospectiveChartData.slice(16,21), "#retrospective-chart");

        const marginVelocityBarChart = {top: 20, right: 0, bottom: 20, left: 200};
        const svgVelocity = new SvgBarChart("#chart-area", 1400, 800, marginVelocityBarChart);

        const x = d3.scaleBand().rangeRound([0, svgVelocity.width]);
        const y = d3.scaleLinear().range([svgVelocity.height, 0]);

        barChart = new BarChart(svgVelocity, x, y, jiraRepo, gitRepo);
        barChart.render();

        d3.select("#ranking-type").on("change", () => {
                barChart.rankingType = d3.select("#ranking-type").property("value");
                barChart.render();
        });

        d3.select(window).on(
            'resize.' + svgSeeScrum.containerElem.attr('id'),
            () => {
                    svgSeeScrum.width = parseInt(svgSeeScrum.containerElem.style('width'));
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
                        //TODO update sprint cards
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

