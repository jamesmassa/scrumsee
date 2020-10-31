/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
let jiraRepo = null;
let gitRepo = null;
let visVelocity = null;

document.addEventListener("DOMContentLoaded", () => {

// TODO: Velocity Chart
//      1. Use completed data from the Velocity Chart Data service and remove my JS calculations
//      2. Tag Git data with sprints and visualize it
//      3. Add estimated (committed) bars
//      4. Add reliability index (committed vs. completed)
//      5. Normalize for team size, i.e., December has a lower absolute velocity but may be higher relative to team size
//      6. Add selectors for Assignee, story size, component, epic, time period
//
// TODO: Auto-Tag the retro data with the same sprint names as Jira and automate the same number of completed sprints
// TODO: Lazy load data which will not be on the initial screen, e.g., chart data

    queue()

        //Jira Data
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-history")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-active")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-future")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-sprints")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-epics")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-versions")
        .defer(d3.json, "http://127.0.0.1:5000/api/velocity-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/burn-down-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/release-burn-down-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/epic-burn-down-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/cumulative-flow-chart")

        //Git Data
        .defer(d3.json, "http://127.0.0.1:5000/api/git-commits")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-languages")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-contributors")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-pulls")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-releases")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-deployments")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-commit-activity")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-code-frequency")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-contributors")

        //See Scrum Other Data
        .defer(d3.json, "http://127.0.0.1:5000/api/ifa")
        .defer(d3.json, "http://127.0.0.1:5000/api/retrospective-chart")
        .defer(d3.json, "http://127.0.0.1:5000/api/scrum-help-text")
        .await(visualize);
});


function visualize(error,

                   //Jira Data
                   storyHistoryData,
                   activeStoryData,
                   futureStoryData,
                   sprintData,
                   epicData,
                   versionData,
                   velocityChartData,
                   burnDownChartData,
                   releaseBurnDownChartData,
                   epicBurnDownChartDate,
                   cumulativeFlowChartData,

                   //Git Data
                   commitsData,
                   languagesData,
                   contributorsData,
                   pullsData,
                   releasesData,
                   deploymentsData,
                   statsCommitActivityData,
                   statsCodeFrequencyData,
                   statsContributorsData,

                   //See Scrum Other Data
                   ifaData,
                   retrospectiveChartData,
                   scrumHelpText
                ) {

        //Jira Data
        console.log("storyHistoryData:", storyHistoryData);
        console.log("activeStoryData:", activeStoryData);
        console.log("futureStoryData:", futureStoryData);
        console.log("sprintData:", sprintData);
        console.log("epicData", epicData);
        console.log("versionData", versionData);
        console.log("velocityChartData", velocityChartData);
        console.log("burnDownChartData", burnDownChartData);
        console.log("releaseBurnDownChartData", releaseBurnDownChartData);
        console.log("epicBurnDownChartDate", epicBurnDownChartDate);
        console.log("cumulativeFlowChartData", cumulativeFlowChartData);

        //Git Data
        console.log("commitsData", commitsData);
        console.log("languagesData", languagesData);
        console.log("contributorsData", contributorsData);
        console.log("pullsData", pullsData);
        console.log("releasesData", releasesData);
        console.log("deploymentsData", deploymentsData);
        console.log("statsCommitActivityData", statsCommitActivityData);
        console.log("statsCodeFrequencyData", statsCodeFrequencyData);
        console.log("statsContributorsData", statsContributorsData);

        //See Scrum Other Data
        console.log("ifaData", ifaData);
        console.log("retrospectiveChartData", retrospectiveChartData);
        console.log("Scrum Text", scrumHelpText);

        const gitRepoData = {
                "commits": commitsData,
                "languages": languagesData,
                "contributors": contributorsData,
                "pulls": pullsData,
                "releases": releasesData,
                "deployments": deploymentsData,
                "statsCommitActivity": statsCommitActivityData,
                "statsCodeFrequency": statsCodeFrequencyData,
                "statsContributors": statsContributorsData
        }

        gitRepo = new GitRepo(gitRepoData);

        const jiraRepoData = {
                "storyHistoryData": storyHistoryData,
                "activeStoryData": activeStoryData,
                "futureStoryData": futureStoryData,
                "epics": epicData,
                "sprints": sprintData,
                "versions": versionData,
                "velocityChartData": velocityChartData,
                "burnDownChartData": burnDownChartData,
                "releaseBurnDownChartData": releaseBurnDownChartData,
                "epicBurnDownChartDate": epicBurnDownChartDate,
                "cumulativeFlowChartData": cumulativeFlowChartData
        }

        jiraRepo = new JiraRepo(jiraRepoData);

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

}

