//TODO Constructor should connect to the JiraRepo and assign Git data to sprints using sprint and code timestamps
//Unix commands to get Git LOC stats
//git log --no-merges --pretty=format:%an --numstat -C | awk '/./ && !author { author = $0; next } author { ins[author] += $1; del[author] += $2 } /^$/ { author = ""; next } END { for (a in ins) { printf "%10d %10d %10d %s\n", ins[a] - del[a], ins[a], del[a], a } }' | sort -rn
//git log --no-merges --oneline --numstat -C
//git log --no-merges --author="jamesmassa" --oneline --numstat -C

//This gives the number of commits for each user
//git shortlog -s -n

class Commit {
    constructor(commit) {
        this._commit = commit;
    }

}

class Commits {
    constructor(data) {
        this._commits = data.map(commit => new Commit(commit));
    }

    addCommit(commit){
        this._commits.push(commit);
    }
}

class Language {
    constructor(language, lines) {
        this._language = language;
        this._lines = lines;
    }

    get language(){return this._language;}
    get lines(){return this._lines;}

}

class Languages {
    constructor(data) {
        this._languages = [];

        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                this.addLanguage(new Language(key, data[key]));
            }
        }
    }

    addLanguage(language){
        this._languages.push(language);
    }
}

class Contributor {
    constructor(contributor) {
        this._contributor = contributor;
    }

}
class Contributors {
    constructor(data) {
        this._contributors = data.map(contributor => new Contributor(contributor));
    }

    addContributor(contributor){
        this._contributors.push(contributor);
    }
}


class Pull {
    constructor(pull) {
        this._pull = pull;
    }

}
class Pulls {
    constructor(data) {
        this._pulls = data.map(pull => new Pull(pull));
    }

    addPull(pull){
        this._pulls.push(pull);
    }
}

class Release {
    constructor(release) {
        this._release = release;
    }

}
class Releases {
    constructor(data) {
        this._releases = data.map(release => new Release(release));
    }

    addRelease(release){
        this._releases.push(release);
    }
}


class Deployment {
    constructor(release) {
        this._release = release;
    }

}
class Deployments {
    constructor(data) {
        this._deployments = data.map(deployment => new Release(deployment));
    }

    addDeployment(deployment){
        this._deployments.push(deployment);
    }
}

class GitRepo {

    constructor(data) {
        this._commits = new Commits(data.commits);  //last 30 commits
        this._languages = new Languages(data.languages); //LOC by language for the current state
        this._contributors = new Contributors(data.contributors); //Total all time commits for each user
        this._pulls = new Pulls(data.pulls);
        this._releases = new Releases(data.releases);
        this._deploymentss = new Deployments(data.deployments);

        this._statsCommitActivity = data.statsCommitActivity; //Last 52 weeks array of 7 day arrays of daily commits
        this._statsCodeFrequency =  data.statsCodeFrequency;  //Last 52 weeks array of weekly additions & deletions
        this._statsContributors = data.statsContributors;     //Last 52 weeks array of weekly additions, deletions, and changes by author

        this._velocityChartSprints = jiraRepo.velocityChartSprints;
    }


    // VELOCITY CHART GETTERS
    get velocityChartCommitActivity() {

        this.maxVelocityChartDate = this.velocityChartSprints[0].velocityStartDate;
        this.minVelocityChartDate = this.velocityChartSprints.slice(-1)[0].completeDate;

        //convert unix timestamps for the weeks into JS Dates
        this._statsCommitActivity.forEach(stat => stat.week = new Date(stat.week * 1000))

        this._statsCommitActivity.forEach(stat => {
            for (let i = 0; i < 7; i++ ){
                // Replace the native JS int for commits with JS objects carrying more fields:
                let date = new Date(stat.week) + i;
                let commits = stat.days[i];
                let sprint = this.getSprintForDay(new Date(date));

                stat.days[i] = new Object({
                    "date": date,
                    "commits": commits,
                    "sprintId": sprint.sprintId,
                    "sprintName": sprint.sprintName
                });

                console.log("stat.days[" + i + "]: ", stat.days[i]);
            }
        })
        //TODO Only sprints 1 through 4 returned but need sprint 0 and 5 with zero commits
        //TODO getting sprint Ids which apparently are 1 larger than the SS Sprint Name and 1 less than sprint number
        console.log("AUG 17 SPRINT ID: ", this.getSprintForDay((new Date("Sat Aug 17 2020 20:00:00"))))
        console.log("OCT 11 SPRINT ID: ", this.getSprintForDay((new Date("Sat Oct 11 2020 20:00:00"))))

        //Turn nested array of weeks and days into an array of 365 days, i.e., remove outer array of weeks
        let dailyCommits = [];
        this._statsCommitActivity.forEach(stat => dailyCommits = dailyCommits.concat(stat.days))

        console.log("this._statsCommitActivity", this._statsCommitActivity);
        console.log("dailyCommits", dailyCommits);

        //Get only days with commits during the particular sprints on the velocity chart
        let commitsDuringSprints = dailyCommits.filter(day => day.sprintId !== "none")
        console.log("commitsDuringSprints", commitsDuringSprints);

        // Sum the commits for each velocity chart sprint into a data structure with one entry per sprint:
        // {"sprintId": sprintId, "commits":, commits}
        let velocityChartCommitActivity = [];

        let totalCommitsForSprint = 0;
        let sprintIdToSum = commitsDuringSprints[0].sprintId;

        console.log("commitsDuringSprints", commitsDuringSprints);
        for (let i = 0; i < commitsDuringSprints.length; i++) {

            if (commitsDuringSprints[i].sprintId !== sprintIdToSum) {
                velocityChartCommitActivity.push(
                    new Object({"sprintId": sprintIdToSum, "gitCodeCommits": totalCommitsForSprint}));
                totalCommitsForSprint = 0;
                sprintIdToSum = commitsDuringSprints[i].sprintId;
            }

            totalCommitsForSprint += commitsDuringSprints[i].commits;
        }
        velocityChartCommitActivity.push(new Object(
            {"sprintId": sprintIdToSum,
                "gitCodeCommits": totalCommitsForSprint}));

        console.log("velocityChartCommitActivity", velocityChartCommitActivity)
        return velocityChartCommitActivity;
    }

    getSprintForDay(day){

        if (day < this.minVelocityChartDate || day > this.maxVelocityChartDate) {
            return new Object({"sprintId": "none", "sprintName": "notAVelocitySprint"});}

        for (let i = 0; i < this.velocityChartSprints.length; i++){
            const sprint = this.velocityChartSprints[i];
            const startDate = new Date(sprint.velocityStartDate);
            const completeDate = new Date(sprint.completeDate);

            if (startDate <= day && day <= completeDate) {
                return new Object({"sprintId": sprint.id, "sprintName": sprint.name});
            }
        }
    }

    get velocityChartSprints(){return this._velocityChartSprints;}

    get velocityChartAdditions(){return this._velocityChartAdditions;}
    get velocityChartDeletions(){return this._velocityChartDeletions;}
    get velocityChartNetLoc(){return this._velocityChartNetLoc;}
    get velocityChartContributors(){return this._velocityChartContributors}
    get velocityChartLanguages(){return this._languages;}

    get minVelocityChartDate(){return this._minVelocityChartDate;}
    get maxVelocityChartDate(){return this._maxVelocityChartDate;}

    set minVelocityChartDate(date){this._minVelocityChartDate = new Date(date);}
    set maxVelocityChartDate(date){this._maxVelocityChartDate = new Date(date);}
}
