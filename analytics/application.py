# TODO
#  GIT
#  1. Install python Git module and use oAuth personal access token to increase to 5,000 daily calls
#     https://stackoverflow.com/questions/23659744/access-github-api-using-personal-access-token-with-python-urllib2
#     https://stackoverflow.com/questions/17622439/how-to-use-github-api-token-in-python-for-requesting
#     https://gitpython.readthedocs.io/en/stable/search.html?q=authentication&check_keywords=yes&area=default
#  2. Return Git data to front end and add it to the Velocity chart
#  3. Save historical Git data and just request new data on-demand.  Degrade gracefully
#  4. Add Git Analytics, e.g., Jira coming due but no commits
#  -------------------------------------------
#  JIRA
#  https://jira.readthedocs.io/en/master/examples.html
#  Analytics
#  1. Add JQL pagination
#       a.  Make one call and check "total" field in the results
#       b.  Divide by 100 and subract 1 to determine how many more calls are needed
#       c.  Execute a loop using "startAt" to get the next 100 rows, and merge the JSON payload into the final payload
#       d.  Change the loop to fire off all the API calls needed simultaneously and asynchronously.  Investigate asyncio
#  2. Fix url Jira calls with oAuth
#     Create private/public keys and an application link:  https://developer.atlassian.com/server/jira/platform/oauth/
#     Authenticate:  https://jira.readthedocs.io/en/master/examples.html#oauth
#     http://blog.appliedinformaticsinc.com/how-to-get-authorize-and-request-access-token-for-jira/
#     http://blog.appliedinformaticsinc.com/how-to-get-auth-configured-and-consumer-key-for-jira-issue-tracker/
#  3. Decommission jira files for issues and repoint to issue data from the API
#  4. Do all the analytics Jiras
#  5. Create sprint objects for all sprints which have lazy load of collections for stories, tasks, and bugs
#  6. Loop over future sprints to find active sprint + 1 based up on naming convention, else prompt for next sprint
#  7. sprint.loadStories(): Get all stories in nextSprint using JQL and add the collection to nextSprint
#  -------------------------------------------
#  Environment
#  0. Add pycache to .gitignore
#  1. Run flask from within pycharm debugger (or other debugger)
#  2. Add unit testing.  Grab framework from CS33a homeworks
#  -------------------------------------------
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
#  GENERAL
#  1. Migrate more JS logic to the back-end, e.g., "get issues for sprint"

import os
import requests
import json
from jira import JIRA

from flask import Flask, jsonify, render_template, request, redirect, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config['ENV'] = 'development'
app.config['DEBUG'] = True
app.config['TESTING'] = True

# JIRA Authentication
user = 'jam7652@g.harvard.edu'
apikey = 'uJQghNNd6KFGxIAoEnW73385'
server = 'https://seescrum.atlassian.net'

options = {
 'server': server
}

# Manual test:  curl -D- -u jam7652@g.harvard.edu:uJQghNNd6KFGxIAoEnW73385 -X GET -H "Content-Type: application/json" https://seescrum.atlassian.net/rest/agile/latest/board/1/issue
jira = JIRA(options, basic_auth=(user, apikey))

closedSprintStories = jira.search_issues('project = "SS" and Sprint in closedSprints()')
openSprintStories = jira.search_issues('project = "SS" and Sprint in openSprints()')
futureSprintStories = jira.search_issues('project = "SS" and Sprint in futureSprints()')

#Git Authentication
git_commit_url = "https://api.github.com/repos/jamesmassa/scrumsee/commits?since=2020-09-30T19:20:30-05:00&until=2020-10-02T19:20:30-05:00"
response = requests.get(git_commit_url, auth=('jam7652@g.harvard.edu', '376a28fc7db53417e5e7da54c11b8199ae36b2ca'))
print("RESPONSE:", response.text)

print("Server Ready")


@app.route('/api/jira-stories-history')
def jira_stories_history():
    return get_jql_response('project = "SS" and Sprint in closedSprints()')


@app.route('/api/jira-stories-active')
def jira_stories_active():
    return get_jql_response('project = "SS" and Sprint in openSprints()')


@app.route('/api/jira-stories-future')
def jira_stories_future():
    return get_jql_response('project = "SS" and Sprint in futureSprints()')


@app.route('/api/jira-sprints')
def jira_sprints():
    return get_url_response('https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/')


@app.route('/api/jira-epics')
def jira_epics():
    return get_jql_response('project = "SS" and issuetype = Epic')


@app.route('/api/jira-versions')
def jira_versions():
    return get_url_response('https://seescrum.atlassian.net/rest/agile/latest/board/1/version/')


@app.route('/api/velocity-chart')
def velocity_chart():
    return get_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/velocity.json?rapidViewId=1')


# TODO Detect active sprint (or receive in param) and set the sprintId value in the url
@app.route('/api/burn-down-chart')
def burndown_chart():
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId=1&sprintId=6&statisticFieldId=field_customfield_10026')


@app.route('/api/release-burn-down-chart')
def release_burn_down_chart():
    return get_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/xboard/plan/backlog/versions.json?rapidViewId=1')


# TODO Decide which of the 2 URLs to use
# TODO Accept GET parameter with the epic ID/Key
@app.route('/api/epic-burn-down-chart')
def epic_burn_down_chart():
    # https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicreport?rapidViewId=1&epicKey=SS-94&_=1602620674330
    return get_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicprogresschart?rapidViewId=1&epicKey=SS-1')


@app.route('/api/retrospective-chart')
def retrospecitve_chart():
    return get_json_file_response('retrospective-scores.json')


@app.route('/api/cumulative-flow-chart')
def cumulative_flow_chart():
    return get_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/cumulativeflowdiagram.json?rapidViewId=1&swimlaneId=1&columnId=4&columnId=5&columnId=6')


@app.route('/api/ifa')
def items_for_attention():
    fibonacci = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]

    not_estimated = [(issue.id, issue.key) for issue in futureSprintStories if issue.fields.customfield_10026 is None]

    not_fibonacci = [(issue.id, issue.key) for issue in futureSprintStories
                     if issue.fields.customfield_10026 not in fibonacci]

    unassigned = [(issue.id, issue.key) for issue in futureSprintStories if issue.fields.assignee is None]

    must_split = [(issue.id, issue.key) for issue in futureSprintStories
                  if issue.fields.customfield_10026 is not None and
                  int(issue.fields.customfield_10026) > 8]

    no_epic = [(issue.id, issue.key) for issue in futureSprintStories if issue.fields.customfield_10014 is None]

    data = {
        "notEstimated": not_estimated,
        "notFibonacci": not_fibonacci,
        "unassigned": unassigned,
        "mustSplit": must_split,
        "noEpic": no_epic
    }

    return get_response(data)


def get_jql_response(jql):
    return get_response(jira.search_issues(jql, json_result=True, maxResults=100))


def get_url_response(url):
    url += "?os_username=" + user + "&os_password=" + apikey

    print("PRE URL CALL")
    url_response = requests.get(url)
    print("POST URL CALL")
    data = url_response.text
    print("DATA FROM URL:", data)

    response = jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


def get_json_file_response(path):
    with open(path) as file:
        return get_response(json.load(file))


def get_response(data):
    response = jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route("/", methods=["GET"])
def home():
    return redirect(url_for('/api/get-json'))


@app.route("/error", methods=["GET"])
def error():
    errormessage = request.args.get("errormessage")
    return render_template("error.html", errormessage=errormessage)
