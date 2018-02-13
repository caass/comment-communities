# Imports
from random import randint
import praw
from functools import wraps
from flask import Flask, request, g, request, redirect, url_for, render_template
app = Flask(__name__)

# State should be a global
STATE = None

#### Set up reddit stuff ####
def get_authorization_link():
    name = '/u/sombreromanjr3'
    user_agent = 'Python comment scraper by ' + name
    redirect = 'http://localhost:5000'
    global STATE
    STATE = str(randint(-420,420))
    with open('credentials','r') as c:
        credentials = c.read().splitlines()
    client_id = credentials[0]
    client_secret = credentials[1]

    # Request authorization token
    reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, redirect_uri=redirect, user_agent=user_agent, state=STATE)
    return reddit.auth.url(['identity'], STATE, 'permanent')

@app.route('/')
def index():
    global STATE
    state = request.args.get('state', None)
    code = request.args.get('code', None)
    if(code and state == STATE):
        return render_template('index.html', code=code)
    elif(code):
        return render_template('failed.html', code=code, state=state, expected=STATE)
    else:
        return render_template('authenticate.html', auth=get_authorization_link())

# def key_required(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         if g.key is None:
#             return redirect(url_for('auth', next=request.url))
#         return f(*args, **kwargs)
#     return decorated_function