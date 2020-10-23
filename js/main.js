/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
let jiraRepo = null;
let gitRepo = null;
let visVelocity = null;

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

    queue()
        .defer(d3.json, "data/jira-sprints.json")  //TODO call oAuth jira link from flask endpoint
        .defer(d3.json, "data/jira-versions.json") //TODO call oAuth jira link from flask endpoint
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-history")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-active")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-future")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-sprints")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-epics")
        // .defer(d3.json, "http://127.0.0.1:5000/api/jira-versions")
        .defer(d3.json, "http://127.0.0.1:5000/api/velocity-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/burn-down-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/release-burn-down-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/epic-burn-down-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/retrospective-chart")
        // .defer(d3.json, "http://127.0.0.1:5000/api/cumulative-flow-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/ifa")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-commits")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-languages")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-contributors")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-pulls")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-releases")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-deployments")
        .defer(d3.json, "http://127.0.0.1:5000/api/scrum-help-text")
        .await(visualize);
});


function visualize(error,
                   //Files to remove
                   sprintsData, versionsData,

                   //Services to keep
                    storyHistoryData, activeStoryData, futureStoryData,
                        sprintData,
                   epicData,
                        //versionData,
                   velocityChartData,
                   // burnDownChartData, releaseBurnDownChartData, epicBurnDownChartDate,
                   retrospectiveChartData,
                        //cumulativeFlowChartData,
                   ifaData,
                   commitsData,
                   languagesData,
                   contributorsData,
                   pullsData,
                   releasesData,
                   deploymentsData,
                   scrumHelpText
                ) {

        console.log("storyHistoryData:", storyHistoryData);
        console.log("activeStoryData:", activeStoryData);
        console.log("futureStoryData:", futureStoryData);
        console.log("sprintData:", sprintData);
        console.log("epicData", epicData);
        // console.log(versionData);
        console.log(velocityChartData);
        // console.log(burnDownChartData);
        // console.log(releaseBurnDownChartData);
        // console.log(epicBurnDownChartDate);
        console.log("retrospectiveChartData:", retrospectiveChartData);
        // console.log(cumulativeFlowChartData);
        console.log("ifaData", ifaData);
        console.log("commitsData", commitsData);
        console.log("languagesData", languagesData);
        console.log("contributorsData", contributorsData);
        console.log("pullsData", pullsData);
        console.log("releasesData", releasesData);
        console.log("deploymentsData", deploymentsData);


        const gitRepoData = {
                "commits": commitsData,
                "languages": languagesData,
                "contributors": contributorsData
        }

        gitRepo = new GitRepo(gitRepoData);
        console.log(gitRepo.commits);
        console.log(gitRepo.languages);
        console.log(gitRepo.contributors);

        const jiraRepoData = {
                "issues": storyHistoryData.issues.concat(activeStoryData.issues.concat(futureStoryData.issues)),
                "epics": epicData,
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

        const scrumTextStore = new ScrumTextStore(scrumHelpText);
        const retroStore = new RetroStore(retrospectiveChartData);

        const marginSeeScrum = {top: 0, right: 0, bottom: 0, left: 0};
        const svgSeeScrum = new Svg("#scrumsee-svg", 1400, 210, marginSeeScrum);

        const visSeeScrum = new SeeScrum(svgSeeScrum, scrumTextStore, retroStore, jiraRepo, ifaData);

        const marginVelocity = {top: 20, right: 0, bottom: 20, left: 200};
        const svgVelocity = new SvgBarChart("#chart-area", 1400, 800, marginVelocity);
        const x = d3.scaleBand().rangeRound([0, svgVelocity.width]);
        const y = d3.scaleLinear().range([svgVelocity.height, 0]);
        const visVelocity = new BarChart(svgVelocity, x, y, jiraRepo, gitRepo);
        visVelocity.render();

        new RetroChart(retrospectiveChartData.slice(16,21), "#retrospective-chart");

        d3.select("#ranking-type").on("change", () => {
                visVelocity.rankingType = d3.select("#ranking-type").property("value");
                visVelocity.render();
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

