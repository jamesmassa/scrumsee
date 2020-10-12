import os
import requests

from flask import Flask, jsonify, render_template, request, redirect, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config['ENV'] = 'development'
app.config['DEBUG'] = True
app.config['TESTING'] = True


@app.route('/api/get-json')
def hello():
    # TODO
    #  1. Change api stub call to jira API with personal access token
    #  2. Add analytics
    #  3. Migrate more JS logic to the back-end

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
