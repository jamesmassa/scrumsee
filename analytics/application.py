import os
import requests
import json

from flask import Flask, jsonify, render_template, request, redirect, url_for
from flask_socketio import SocketIO, emit
from datetime import datetime
from post import Post

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

CONST_MAX_MESSAGES = 100
nextpostid = 0
posts = set()
channels = set()
displaynames = set()

@app.route('/api/get-json')
def hello():
    response = jsonify(hello='world')  # Returns HTTP Response with {"hello": "world"}
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route("/", methods=["GET"])
def home():
    return redirect(url_for('index'))

@app.route("/index", methods=["GET"])
def index(displayname=None):
    if len(channels) > 0:
        for channel in channels:
            channelname = channel
            break
        url="http://127.0.0.1:5000/index/" + channelname
        if request.args.get('displayname'): 
            url += "?displayname=" + request.args.get('displayname')
        return redirect(url)
    else:
        emptyposts = set()
        return render_template("index.html", posts=emptyposts, errormessage="", displayname=request.args.get('displayname'), channels=channels)

@app.route("/index/<string:channelname>", methods=["GET"])
def index_channelname(channelname, displayname=None):
    filteredPosts = set()
    for post in posts:
        if post.channelname == channelname:
            filteredPosts.add(post)
    return render_template("index.html", posts=filteredPosts, errormessage="", displayname=request.args.get('displayname'), channels=channels)

@app.route("/register", methods=["GET", "POST"])
def register(): 
    if request.method == 'GET':
        return render_template("register.html")
    elif request.method == 'POST':
        displayname=request.form.get("displayname")
        if displayname in displaynames:
            return redirect(url_for('error'))
        else:
            displaynames.add(displayname)
            return redirect(url_for('index', displayname=displayname))

@app.route("/error", methods=["GET"])
def error():
    errormessage=request.args.get("errormessage")
    return render_template("error.html", errormessage=errormessage)

#do not cache the static content, e.g., index.js
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

@socketio.on("add post")
def add_post(data):
    global nextpostid
    nextpostid += 1
    post = Post(id="{0:0>5}".format(nextpostid),
                posttext=data["posttext"],
                displayname= data["displayname"],
                channelname=data["channelname"],
                timestamp=datetime.now().strftime("%m/%d/%Y %H:%M:%S")) 
    posts.add(post)
    emit("new post", post.toDict(), broadcast=True)
    
    #Only save 100 messages for each channel
    filteredPosts = set() 
    oldest = None
    for post in posts:
        if post.channelname == data["channelname"]:
            filteredPosts.add(post)
            if oldest == None or oldest.timestamp > post.timestamp:
                oldest = post
    if len(filteredPosts) > CONST_MAX_MESSAGES:
        posts.remove(oldest)

@socketio.on("delete post")
def delete_post(data):
    postid = str(data["postid"][0])
    found = False
    for post in posts: 
        if str(post.id) == postid:
            found = True
            posts.remove(post)
            emit("client delete post", postid, broadcast=True)
            break

    if found == False:
        emit("redirect", url_for('error', errormessage="Post does not exist"))

@socketio.on("add channel")
def addchannel(data):
    channelname=data["channelname"]
    if channelname in channels:
        emit("redirect", url_for('error', errormessage="Channel name already in use"))
    else:
        channels.add(channelname)
        emit("client add channel", channelname, broadcast=True)
        emit("redirect", "http://127.0.0.1:5000/index/" + channelname)


