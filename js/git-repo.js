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
        this._commits = new Commits(data.commits);
        this._languages = new Languages(data.languages);
        this._contributors = new Contributors(data.contributors);
        this._pulls = new Pulls(data.pulls);
        this._releases = new Releases(data.releases);
        this._deploymentss = new Deployments(data.deployments);

// TODO Process stats data
//         this._statsCommitActivity = new StatsCommitActivityWeek(data.statsCommitActivity);
//         this._statsCodeFrequency =  new StatsLocWeek(data.statsCodeFrequency);
//         this._statsContributors = new StatsLocByAuthorWeek(data.statsContributors);
    }

    get commits() {return this._commits;}
    get languages(){return this._languages;}
    get contributors(){return this._contributors;}


}
