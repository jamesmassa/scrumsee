/*jshint esversion: 6 */
/*globals d3,$,eventHandler:false */
let eventHandler = {};
let jiraRepo = null;
let gitRepo = null;
let visVelocity = null;

document.addEventListener("DOMContentLoaded", () => {

// TODO: group the api calls into these categories (JQL, Jira API, Jira undocumented, Git API, SeeScrum)
// TODO: Make a Controller class which which orchestrates 1) JiraRepo 2) GitRepo 3) Charts by Sprint, Epic, or Version
// TODO: Lazy load data which will not be on the initial screen, e.g., chart data

    queue()
        .defer(d3.json, "data/jira-sprints.json")  //TODO call oAuth jira link from flask endpoint
        .defer(d3.json, "data/jira-versions.json") //TODO call oAuth jira link from flask endpoint
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-history")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-active")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-stories-future")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-sprints")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-epics")
        .defer(d3.json, "http://127.0.0.1:5000/api/jira-versions")
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

        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-commit-activity")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-code-frequency")
        .defer(d3.json, "http://127.0.0.1:5000/api/git-stats-contributors")

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
                   versionData,
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
                   statsCommitActivityData,
                   statsCodeFrequencyData,
                   statsContributorsData,
                   scrumHelpText
                ) {

// TODO: sort log statements in same order as the queue
        console.log("storyHistoryData:", storyHistoryData);
        console.log("activeStoryData:", activeStoryData);
        console.log("futureStoryData:", futureStoryData);
        console.log("sprintData:", sprintData);
        console.log("epicData", epicData);
        console.log("versionData", versionData);
        console.log("velocityChartData", velocityChartData);
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

        console.log("statsCommitActivityData", statsCommitActivityData);
        console.log("statsCodeFrequencyData", statsCodeFrequencyData);
        console.log("statsContributorsData", statsContributorsData);

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
                "issues": storyHistoryData.issues.concat(activeStoryData.issues.concat(futureStoryData.issues)),
                "epics": epicData,
                "sprints": sprintsData,
                "versions": versionsData,
        }

        jiraRepo = new JiraRepo(jiraRepoData);

        const completedSprints = jiraRepo.sprints.completedSprints;
        console.log("completedSprints:");
        console.log(completedSprints);

        console.log("Total Story Points:")
        completedSprints.forEach(s => console.log(s.totalStoryPoints));

        console.log("Total Stories:")
        completedSprints.forEach(sprint => {
                console.log("Sprint " + sprint.id, sprint.totalStories);
                });

        console.log("Completed Story Points:")
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

}

