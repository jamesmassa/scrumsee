let eventHandler = {};
const useSampleData = false;

document.addEventListener("DOMContentLoaded", () => {

    queue()
        .defer(d3.json, (useSampleData ? "data/CFX-data-scrubbed.json" : "data/JV-12-7-19.json"))
        .defer(d3.json, "data/scrum-process.json")
        .defer(d3.json, "data/metrics.json")
        .await(visualize);
});


function visualize(error, jiraData, scrumText, retroData) {
        const issueStore = (useSampleData ? new IssueStore(jiraData) : new IssueStore(jiraData, "customfield_10020", "customfield_10028" )) ;
        const scrumTextStore = new ScrumTextStore(scrumText);
        const retroStore = new RetroStore(retroData);

        console.log(issueStore.getSprints());
        console.log(scrumTextStore.ceremonies);
        console.log(retroStore.data);

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

        const visScrumSee = new ScrumSee(svgScrumSee, issueStore, scrumTextStore, retroStore);
        const visVelocity = new VelocityChart2(issueStore, svgVelocity, colorScheme, eventHandler);
        const visStory = new StoryChart2(issueStore, svgStory);
        const visScope = new ScopeChart(issueStore, svgScope, visStory,'', colorScheme, eventHandler);
        const visRetro = new RetroChart(retroData.slice(16,21), svgRetro);
        const visEmployee = new EmployeeChart2(issueStore, svgEmployee);

        const visScrumProcess = new ScrumProcess(issueStore);


        d3.select(window).on(
            'resize.' + svgScrumSee.containerElem.attr('id'),
            () => {
                    const w = parseInt(svgScrumSee.containerElem.style('width'));
                    svgScrumSee.width = w;
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
                if (selection == "velocity-visualization") visVelocity.onSelectedVisualizationChange();
                else if (selection == "scope-visualization") visScope.onSelectedVisualizationChange();

        });

        //bind triggers
        d3.select("#issue-property-selector").on("change", function () {
                $(eventHandler).trigger("selectedIssuePropertyChange", d3.select("#issue-property-selector").property("value"));
        });

        d3.select("#issue-metric-selector").on("change", function () {
                $(eventHandler).trigger("selectedMetricChange", d3.select("#issue-metric-selector").property("value"));
        });


}

