import os

from flask import Flask, jsonify, render_template, request, redirect, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


@app.route('/api/get-json')
def hello():
    # TODO
    #  1. Change hello world to a call to jira API
    #  2. Add personal access token
    #  3. Add analytics
    #  4. Migrate more JS logic to the back-end

    response = jsonify(hello='world5')  # Returns HTTP Response with {"hello": "world"}
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route("/", methods=["GET"])
def home():
    return redirect(url_for('/api/get-json'))


@app.route("/error", methods=["GET"])
def error():
    errormessage = request.args.get("errormessage")
    return render_template("error.html", errormessage=errormessage)
