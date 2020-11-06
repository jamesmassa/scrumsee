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


    // VELOCITY CHART
    get statsCodeFrequency(){

        let retVal = [];

        this._statsCodeFrequency.forEach(stat => {
            //Convert unix timestamps for weeks to JS Dates
            const d = new Date(stat[0] * 1000)
            const week = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
            const netLoc = stat[1] + stat[2];

            let statObj = new Object({
                "week": week,
                "linesOfCodeAdded": stat[1],
                "linesOfCodeDeleted": stat[2],
                "netLinesOfCode": netLoc});

            retVal.push(statObj);
        })

        return retVal;
    }

    get statsContributors(){return this._statsContributors;}

    get velocityChartCommitActivity() {

        this.maxVelocityChartDate = this.velocityChartSprints[0].completeDate;
        this.minVelocityChartDate = this.velocityChartSprints.slice(-1)[0].velocityStartDate;

        //convert unix timestamps for the weeks into JS Dates
        this._statsCommitActivity.forEach(stat => {
            stat.week = new Date(stat.week * 1000)
        })


        this._statsCommitActivity.forEach(stat => {
            for (let i = 0; i < 7; i++ ){
                // Replace the native JS int for commits with JS objects carrying more fields:
                let date = new Date(stat.week);
                date.setDate(date.getDate() + i);
                let commits = stat.days[i];
                let sprint = this.getSprintForDay(new Date(date));

                stat.days[i] = new Object({
                    "date": date,
                    "commits": commits,
                    "sprintId": sprint.sprintId,
                    "sprintName": sprint.sprintName
                });
            }
        })

        //Turn nested array of weeks and days into an array of 365 days, i.e., remove outer array of weeks
        let dailyCommits = [];
        this._statsCommitActivity.forEach(stat => dailyCommits = dailyCommits.concat(stat.days))

        //Get only days with commits during the particular sprints on the velocity chart
        let commitsDuringSprints = dailyCommits.filter(day => day.sprintId !== "none")

        // Sum the commits for each velocity chart sprint into a data structure with one entry per sprint:
        // {"sprintId": sprintId, "commits":, commits}
        let velocityChartCommitActivity = [];

        let totalCommitsForSprint = 0;
        let sprintIdToSum = commitsDuringSprints[0].sprintId;
        let sprintNameToSum = commitsDuringSprints[0].sprintName;

        for (let i = 0; i < commitsDuringSprints.length; i++) {

            if (commitsDuringSprints[i].sprintId !== sprintIdToSum) {
                velocityChartCommitActivity.push(
                    new Object({"sprintId": sprintIdToSum, "sprintName": sprintNameToSum, "gitCodeCommits": totalCommitsForSprint}));
                totalCommitsForSprint = 0;
                sprintIdToSum = commitsDuringSprints[i].sprintId;
                sprintNameToSum = commitsDuringSprints[i].sprintName;
            }

            totalCommitsForSprint += commitsDuringSprints[i].commits;
        }
        velocityChartCommitActivity.push(new Object(
            {"sprintId": sprintIdToSum,
                "sprintName": sprintNameToSum,
                "gitCodeCommits": totalCommitsForSprint}));

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
