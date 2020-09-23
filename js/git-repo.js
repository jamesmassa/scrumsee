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

class GitRepo {

    constructor(data) {
        this._commits = new Commits(data.commits);
        this._languages = new Languages(data.languages);
        this._contributors = new Contributors(data.contributors);
    }

    get commits() {return this._commits;}
    get languages(){return this._languages;}
    get contributors(){return this._contributors;}


}
