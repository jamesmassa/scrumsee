import os
import requests
from jira import JIRA

from flask import Flask, jsonify, render_template, request, redirect, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config['ENV'] = 'development'
app.config['DEBUG'] = True
app.config['TESTING'] = True

user = 'jam7652@g.harvard.edu'
apikey = 'uJQghNNd6KFGxIAoEnW73385'
server = 'https://seescrum.atlassian.net'

options = {
 'server': server
}

# Manual test:  curl -D- -u jam7652@g.harvard.edu:uJQghNNd6KFGxIAoEnW73385 -X GET -H "Content-Type: application/json" https://seescrum.atlassian.net/rest/agile/latest/board/1/issue
jira = JIRA(options, basic_auth=(user, apikey))

issueId = 'SS-135'
issue = jira.issue(issueId)
summary = issue.fields.summary
print('ticket: ', issueId, summary)

# Print the story points for every story in the repo
for issue in jira.search_issues('project = "SS" AND issuetype = Story ORDER BY created ASC'):
    print('{}: {}'.format(issue.key, issue.fields.customfield_10026))


closedSprintStories = jira.search_issues('project = "SS" and Sprint in closedSprints()')
openSprintStories = jira.search_issues('project = "SS" and Sprint in openSprints()')
futureSprintStories = jira.search_issues('project = "SS" and Sprint in futureSprints()')

print("FUTURE SPRINT TYPE", type(futureSprintStories))
print("CLOSED STORY COUNT:", len(closedSprintStories))
print("CLOSED STORY COUNT:", len(closedSprintStories))

fibonacci = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
for issue in futureSprintStories:
    if issue.fields.customfield_10026 is None:
        print('{}: {}: {}: {}'.format("UNESTIMATED", issue.key, issue.fields.summary, issue.fields.customfield_10026))
    elif issue.fields.customfield_10026 not in fibonacci:
        print('{}: {}: {}: {}'.format("FIBONACCI:", issue.key, issue.fields.summary, issue.fields.customfield_10026))


@app.route('/api/get-json')
def hello():
    # TODO
    #  JIRA
    #  https://jira.readthedocs.io/en/master/examples.html
    #  Analytics
    #  2. Create sprint objects for all sprints which have lazy load of collections for stories, tasks, and bugs
    #  3. Loop over future sprints to find active sprint + 1 based up on naming convention, else prompt for next sprint
    #  4. sprint.loadStories(): Get all stories in nextSprint using JQL and add the collection to nextSprint
    #  5. sprint.analyze():
    #       a.  Find stories with zero story points
    #       b.  Find stories with non Fibonacci story points
    #       c.  Find stories with no assignee
    #       d.  Find stories with no epic
    #  6. Display analytics results in front end
    #  Environment
    #  1. run flask from within pycharm debugger (or other debugger)
    #  Security
    #  1. Read in apikey from a file in .gitignore
    #  2. Create a read only jira user
    #  2. Log in as the read only user and create a new personal access token
    #     https://id.atlassian.com/manage-profile/security/api-tokens
    #  3. Revoke the old token
    #  3. Set up Duo for 2 step verification
    #       https://confluence.atlassian.com/cloud/two-step-verification-976161185.html#Secureyouraccountwithtwo-stepverification-saml_gsuite
    #  4. Set read-only permissions on the personal access token
    #  Architecture
    #  1. Replace d3.queue file loads with calls to my flask routes which call the Jira api
    #  -------------------------------------------
    #  GIT
    #  1. Install python Git module and use oAuth personal access token to increase to 5,000 daily calls
    #     https://stackoverflow.com/questions/23659744/access-github-api-using-personal-access-token-with-python-urllib2
    #     https://stackoverflow.com/questions/17622439/how-to-use-github-api-token-in-python-for-requesting
    #     https://gitpython.readthedocs.io/en/stable/search.html?q=authentication&check_keywords=yes&area=default
    #  2. Save historical Git data and just request new data on-demand.  Degrade gracefully
    #  3. Add Git Analytics, e.g., Jira coming due but no commits
    #  -------------------------------------------
    #  GENERAL
    #  1. Migrate more JS logic to the back-end, e.g., "get issues for sprint"

    apiresponse = requests.get("https://jsonplaceholder.typicode.com/todos/1")
    # apiresponse = requests.get("https://seescrum.atlassian.net/rest/agile/latest/board/1/issue")

    response = jsonify(apiresponse.json())
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

@app.route('/api/get-future-sprints')
def futureSprints():
    futureSprintStories = jira.search_issues('project = "SS" and Sprint in futureSprints()', json_result=True)
    response = jsonify(futureSprintStories)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

@app.route("/", methods=["GET"])
def home():
    return redirect(url_for('/api/get-json'))


@app.route("/error", methods=["GET"])
def error():
    errormessage = request.args.get("errormessage")
    return render_template("error.html", errormessage=errormessage)
