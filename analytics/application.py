# TODO
#  GIT
#  1. Call 3 git stats apis from JS
#  2. Replace git repo LOC calculations with git stats API
#  3. Add git stats to the Velocity chart
#  4. Fine tune git stats to line up with sprints using the /commits-for-time-period endpoint
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
#  4. Do all the sprint planning analytics Jiras
#  5. Create sprint objects for all sprints which have lazy load of collections for stories, tasks, and bugs
#  6. Loop over future sprints to find active sprint + 1 based up on naming convention, else prompt for next sprint
#  7. sprint.loadStories(): Get all stories in nextSprint using JQL and add the collection to nextSprint
#  -------------------------------------------
#  Environment
#  0. Add pycache to .gitignore
#  1. Run flask from within pycharm debugger (or other debugger)
#  2. Add unit testing.  Grab framework from CS33a homeworks
#  3. Set up Duo for 2 step verification in Jira
#       https://confluence.atlassian.com/cloud/two-step-verification-976161185.html#Secureyouraccountwithtwo-stepverification-saml_gsuite
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


def jira_login():
    try:
        with open('tokens.json') as file:
            login_data = json.load(file)['jira']
    except IOError as err:
        print("I/O error: {0}".format(err))
    except Exception as err:
        print("Exception: {0}".format(err))

    apikey = login_data['apikey']
    user = login_data['user']
    server = login_data['server']

    options = {
     'server': server
    }

    return JIRA(options, basic_auth=(user, apikey))


def get_git_credentials():
    with open('tokens.json') as file:
        login_data = json.load(file)

    return login_data['git']


# Load jira issue data into global json objects
jira = jira_login()

closedSprintStories = jira.search_issues('project = "SS" and Sprint in closedSprints()')
openSprintStories = jira.search_issues('project = "SS" and Sprint in openSprints()')
futureSprintStories = jira.search_issues('project = "SS" and Sprint in futureSprints()')

git_credentials = get_git_credentials()

print("Server Ready")


# weekly and daily commits for the last year
@app.route('/api/git-stats-commit-activity')
def git_stats_commit_activity():
    return get_git_url_response("/stats/commit_activity")


# Weekly LOC additions and deletions
@app.route('/api/git-stats-code-frequency')
def git_stats_code_frequency():
    return get_git_url_response("/stats/code_frequency")


# Weekly adds, deletes, and changes by author for the last year
@app.route('/api/git-stats-contributors')
def git_stats_contributors():
    return get_git_url_response("/stats/contributors")


# Returns all commits
@app.route('/api/git-commits')
def git_commits():
    return get_git_url_response("/commits")


# Returns all commits between 2 timestamps of format 2020-09-30T19:20:30-05:00
@app.route('/api/git-commits-for-period', methods=["GET"])
def git_commits_for_period():

    since = request.args["since"]
    until = request.args["until"]

    params = {'since': since, 'until': until}
    return get_git_url_response("/commits", params)


# Returns a single commit
@app.route('/api/git-commit', methods=["GET"])
def git_commit():

    commit_sha = request.args["sha"]

    params = {'sha': commit_sha}
    return get_git_url_response("/commits", params)


@app.route('/api/git-languages')
def git_languages():
    return get_git_url_response("/languages")


@app.route('/api/git-contributors')
def git_contributors():
    return get_git_url_response("/contributors")


@app.route('/api/git-pulls')
def git_pulls():
    return get_git_url_response("/pulls")


@app.route('/api/git-releases')
def git_releases():
    return get_git_url_response("/releases")


@app.route('/api/git-deployments')
def git_deployments():
    return get_git_url_response("/deployments")


def get_git_url_response(resource, params=None):

    git_commit_url = git_credentials['server'] + resource
    token = git_credentials['apikey']
    headers = {'Authorization': f'token {token}'}

    if params is None:
        url_response = requests.get(git_commit_url, headers=headers)
    else:
        url_response = requests.get(git_commit_url, headers=headers, params=params)

    data = url_response.json()
    response = jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


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
    return get_jira_url_response('https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/')


@app.route('/api/jira-epics')
def jira_epics():
    return get_jql_response('project = "SS" and issuetype = Epic')


@app.route('/api/jira-versions')
def jira_versions():
    return get_jira_url_response('https://seescrum.atlassian.net/rest/agile/latest/board/1/version/')


@app.route('/api/jira-issues-for-epic', methods=["GET"])
def jira_issues_for_epic():
    # Compare JQL results to //https://seescrum.atlassian.net/rest/agile/latest/board/1/epic/10093/issue
    return get_jql_response('project = "SS" and issuetype = Story and epic = ' + request.args["epic"])


@app.route('/api/jira-issues-for-sprint', methods=["GET"])
def jira_issues_for_sprint():
    # Compare JQL results to https://seescrum.atlassian.net/rest/agile/latest/board/1/sprint/2/issue
    return get_jql_response('project = "SS" and issuetype = Story and sprint = ' + request.args["sprint"])


@app.route('/api/velocity-chart')
def velocity_chart():
    return get_jira_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/velocity.json?rapidViewId=1')


# TODO Detect active sprint (or receive in param) and set the sprintId value in the url
@app.route('/api/burn-down-chart')
def burn_down_chart():
    return get_jira_url_response('https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId=1&sprintId=6&statisticFieldId=field_customfield_10026')


@app.route('/api/release-burn-down-chart')
def release_burn_down_chart():
    return get_jira_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/xboard/plan/backlog/versions.json?rapidViewId=1')


# TODO Decide which of the 2 URLs to use
# TODO Accept GET parameter with the epic ID/Key
@app.route('/api/epic-burn-down-chart')
def epic_burn_down_chart():
    # https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicreport?rapidViewId=1&epicKey=SS-94&_=1602620674330
    return get_jira_url_response(
        'https://seescrum.atlassian.net/rest/greenhopper/1.0/rapid/charts/epicprogresschart?rapidViewId=1&epicKey=SS-1')


@app.route('/api/retrospective-chart')
def retrospecitve_chart():
    return get_json_file_response('retrospective-scores.json')


@app.route('/api/scrum-help-text')
def scrum_help_text():
    return get_json_file_response('scrum-help-text.json')


@app.route('/api/cumulative-flow-chart')
def cumulative_flow_chart():
    return get_jira_url_response(
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


def get_jira_url_response(url):

    try:
        with open('tokens.json') as file:
            login_data = json.load(file)
    except IOError as err:
        print("I/O error: {0}".format(err))
    except Exception as err:
        print("Exception: {0}".format(err))

# TODO get oAuth credentials for Jira
    apikey = login_data['jira']['apikey']
    user = login_data['jira']['user']
    server = login_data['jira']['server']

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
