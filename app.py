# Imports
from functools import wraps
from random import randint
from uuid import uuid4

from praw import Reddit
from prawcore.exceptions import OAuthException
from flask import Flask, render_template, request, url_for, make_response, Response
from flask_socketio import SocketIO, send, emit
from json import dumps

app = Flask(__name__)
socketio = SocketIO(app)

# Create a link and state for an OAuth2 Token
def generate_reddit_instance():
    name = '/u/sombreromanjr3'
    user_agent = 'PRAW comment scraper by ' + name
    redirect = 'http://localhost:5000'
    state = str(uuid4())
    with open('credentials','r') as c:
        credentials = c.read().splitlines()
    client_id = credentials[0]
    client_secret = credentials[1]

    # Request authorization token
    reddit = Reddit(client_id=client_id, client_secret=client_secret, redirect_uri=redirect, user_agent=user_agent, state=state)
    return {'state': state, 'url': reddit.auth.url(['identity', 'read'], state, 'permanent'), 'instance': reddit}

@app.route('/', methods=['GET', 'POST'])
def index():

    # If someone is accessing the page
    if request.method == 'GET':

        # Do this so you don't get 500 errors
        resp = None

        # Check to see if they have a state and code from reddit
        state = request.args.get('state', None)
        code = request.args.get('code', None)

        # If they have a state in their cookies, check if it's the right one
        if 'state' in request.cookies:
            expected_state = request.cookies.get('state')
            if(code and state == expected_state):
                resp = make_response(render_template('index.html', code=code))
                resp.set_cookie('state', '', expires=0)
                                    
            elif(code):
                resp = make_response(render_template('failed.html', code=code, state=state, expected=expected_state))
        
        # Otherwise make 'em get authorization
        if not resp:
            auth = generate_reddit_instance()
            resp = make_response(render_template('authenticate.html', auth=auth['url']))
            resp.set_cookie('state', auth['state'])
        
        return resp

@socketio.on('authorization_code', namespace='/comments')
def generate_comments(json):

    code = json['code']
    reddit = generate_reddit_instance()['instance']
    reddit.auth.authorize(code)

    def generate():
        for comment in reddit.subreddit('all').stream.comments():
            emit('comment', dumps({'id': str(comment)}))
    return generate()