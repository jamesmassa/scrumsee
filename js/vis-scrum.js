//Main page controller class
class ScrumProcess {
    constructor(issueStore) {
        this._issueStore = issueStore;


        this.populateSprintSelector();
        this.setStats();
        this.setClickHandlers();
    }

    populateSprintSelector() {
        const selectorElem = document.querySelector("#sprint-selector");

        const sprints = this.issueStore.getSprints();
        sprints.forEach((sprint)=> {
            const optionElement = document.createElement("option");
            optionElement.value= sprint.id;
            selectorElem.appendChild(optionElement);

            let sprintName = sprint.name;
            if (sprint.state === "ACTIVE") {
                sprintName += " - Active Sprint";
                selectorElem.value = sprint.id;
            }
            optionElement.innerHTML = sprintName;

        })
    }


    setStats(){
        const activeSprint = this.issueStore.activeSprint;
        const velocity = this.issueStore.previousSprint.completedStoryPoints;

        document.querySelector("#scrum-velocity").innerText = velocity + " story points";
        document.querySelector("#total-blockers").innerText = activeSprint.totalBlockers;
        document.querySelector("#sprint-goal").innerText = activeSprint.goal;

    }

    setClickHandlers() {
        document.querySelector("#sprint-selector").onchange = () => {
            $(eventHandler).trigger("selectedSprintChange", d3.select("#sprint-selector").property("value"));
        };

        document.querySelector("#velocity-card").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/secure/RapidBoard.jspa?projectKey=JV&rapidView=1&view=reporting&chart=velocityChart", "_blank")
        };

        const activeSprint = this.issueStore.activeSprint;
        document.querySelector("#blockers-card").onclick = () => {
            window.open("https://cs171-jira.atlassian.net/issues/?jql=project%20%3D%20JV%20and%20status%20%3D%20Blocked%20and%20sprint%3D" + activeSprint.id, "_blank")
        };

        const visualizations = document.querySelectorAll(".viz");
        visualizations.forEach( viz => { viz.style.display = "none";});


    }

    get issueStore(){return this._issueStore;}

}

