# TODO
#  Fix Bugs
#  1. Fix url Jira calls with oAuth
#     Create private/public keys and an application link:  https://developer.atlassian.com/server/jira/platform/oauth/
#     Authenticate:  https://jira.readthedocs.io/en/master/examples.html#oauth
#     3 legged auth
#  JIRA
#  https://jira.readthedocs.io/en/master/examples.html
#  Analytics
#  0. Add JQL pagination
#       a.  Make one call and check "total" field in the results
#       b.  Divide by 100 and subract 1 to determine how many more calls are needed
#       c.  Make all the calls, leveraging "startAt" and keep merging JSON payloads and return the final payload
#  1. Remove test harness code (print statements at top and test service)
#  2. sprint.analyze() using hard coded next sprint
#       a.  Find stories with zero story points
#       b.  Find stories with non Fibonacci story points
#       c.  Find stories with no assignee
#       d.  Find stories with no epic
#       e.  Find stories with more than 8 story points and need to be split
#  3. Display analytics results in front end
#  4. Decommission jira files for issues and repoint to issue data from the API
#  5. Create sprint objects for all sprints which have lazy load of collections for stories, tasks, and bugs
#  6. Loop over future sprints to find active sprint + 1 based up on naming convention, else prompt for next sprint
#  7. sprint.loadStories(): Get all stories in nextSprint using JQL and add the collection to nextSprint
#  Environment
#  0. Add pycache to .gitignore
#  1. Run flask from within pycharm debugger (or other debugger)
#  2. Add unit testing.  Grab framework from CS33a homeworks
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


fibonacci = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
for issue in futureSprintStories:
    if issue.fields.customfield_10026 is None:
        print('{}: {}: {}: {}'.format("UNESTIMATED", issue.key, issue.fields.summary, issue.fields.customfield_10026))
    elif issue.fields.customfield_10026 not in fibonacci:
        print('{}: {}: {}: {}'.format("FIBONACCI:", issue.key, issue.fields.summary, issue.fields.customfield_10026))


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
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/velocity.json?rapidViewId=1')


# TODO Detect active sprint (or receive in param) and set the sprintId value in the url
@app.route('/api/burn-down-chart')
def burndown_chart():
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId=1&sprintId=6&statisticFieldId=field_customfield_10026')


@app.route('/api/release-burn-down-chart')
def release_burn_down_chart():
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/xboard/plan/backlog/versions.json?rapidViewId=1')


# TODO Decide which of the 2 URLs to use
# TODO Accept GET parameter with the epic ID/Key
@app.route('/api/epic-burn-down-chart')
def epic_burn_down_chart():
# https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicreport?rapidViewId=1&epicKey=SS-94&_=1602620674330
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicprogresschart?rapidViewId=1&epicKey=SS-1')


# TODO Load from file
@app.route('/api/retrospective-chart')
def retrospecitve_chart():
    return get_json_file_response('retrospective-scores.json')


@app.route('/api/cumulative-flow-chart')
def cumulative_flow_chart():
    return get_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/cumulativeflowdiagram.json?rapidViewId=1&swimlaneId=1&columnId=4&columnId=5&columnId=6')


# TODO Need to return all analytics in a single json.
# TODO Currently only returning issues without epics
@app.route('/api/ifa')
def items_for_attention():
    return get_url_response('https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/none/issue')


def get_jql_response(jql):

    return get_response(jira.search_issues(jql, json_result=True, maxResults=100))


def get_url_response(url):
    url += "?os_username=" + user + "&os_password=" + apikey
    url_response = requests.get(url)
    data = url_response.text
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
