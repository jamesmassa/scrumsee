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

jira = JIRA(options, basic_auth=(user, apikey))

ticket = 'SS-135'
issue = jira.issue(ticket)

summary = issue.fields.summary

print('ticket: ', ticket, summary)

@app.route('/api/get-json')
def hello():
    # TODO
    #  JIRA
    #  0. pip install jira  https://jira.readthedocs.io/en/master/examples.html
    #     curl -D- -u jam7652@g.harvard.edu:uJQghNNd6KFGxIAoEnW73385 -X GET -H "Content-Type: application/json" https://seescrum.atlassian.net/rest/agile/latest/board/1/issue
    #  1. Change api stub call to jira python module with authentication and JQL
    #  2. Add analytics and IFAs for jira data
    #  GIT
    #  3. Install python Git module and use oAuth personal access token to increase to 5,000 daily calls
    #     https://stackoverflow.com/questions/23659744/access-github-api-using-personal-access-token-with-python-urllib2
    #     https://stackoverflow.com/questions/17622439/how-to-use-github-api-token-in-python-for-requesting
    #     https://gitpython.readthedocs.io/en/stable/search.html?q=authentication&check_keywords=yes&area=default
    #  4. Save historical Git data and just request new data on-demand.  Degrade gracefully
    #  5. Add Git Analytics, e.g., Jira coming due but no commits
    #  GENERAL
    #  5. Migrate more JS logic to the back-end, e.g., "get issues for sprint"

    apiresponse = requests.get("https://jsonplaceholder.typicode.com/todos/1")
    # apiresponse = requests.get("https://seescrum.atlassian.net/rest/agile/latest/board/1/issue")

    response = jsonify(apiresponse.json())
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


@app.route("/", methods=["GET"])
def home():
    return redirect(url_for('/api/get-json'))


@app.route("/error", methods=["GET"])
def error():
    errormessage = request.args.get("errormessage")
    return render_template("error.html", errormessage=errormessage)
