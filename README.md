# Comment Communities

Web app built with [Flask](http://flask.pocoo.org/), [PRAW](https://praw.readthedocs.io/en/latest/), [SocketIO](https://socket.io/) and [D3](d3js.org) to visualize the activity going on on Reddit in real time.

* [Overview](#overview)
* [Getting an OAuth2 Token](#authorization)
* [Streaming new content](#streaming)
* [Passing content IDs to the front-end](#websockets)
* ~~[Getting detailed information](#ajax)~~ TODO
* ~~[Visualizing data](#viz)~~ TODO

### Overview

The best solution I could find for streaming new content from Reddit was to use [PRAW](https://praw.readthedocs.io/en/latest/), the Python Reddit API Wrapper. Every new post or comment on reddit has a unique string identifier, and by using PRAW's [SubredditStream](http://praw.readthedocs.io/en/latest/code_overview/other/subredditstream.html#) class, ([thanks /u/throwaway_the_fourth](https://www.reddit.com/r/redditdev/comments/6w0r3o/best_method_to_get_stream_of_new_postscomments/dm4mbxh/)), we can generate a constant stream of all new post or comment IDs. These can then be passed to front-end Javascript where we can get [more info about the comment](https://www.reddit.com/r/redditdev/comments/6wddne/accessing_a_submission_or_comment_by_id_only/dm77tz0/). Then, we can use D3 to turn that information into a beautiful, live-updating bubble chart.


### Getting an OAuth2 Token<a name="authorization"></a>

The reddit API doesn't _require_ user authorization, per se, but the rate-limit is vastly improved, so we ask all our users to authorize this app to use their reddit account. We only ask for their identity and read privileges, which is info anyone on the internet could find.

In order to actually get and use a token, we have to send reddit a request with the appropiate info. After creating variables with the appropriate information and generating a unique state, PRAW makes this easy:

```python
def generate_reddit_instance(params):
    ...
    # Request authorization token
    reddit = Reddit(client_id=client_id, client_secret=client_secret, redirect_uri=redirect, user_agent=user_agent, state=state)
    return {'state': state, 'url': reddit.auth.url(['identity', 'read'], state, 'permanent'), 'instance': reddit}
```

We can then use Flask to pass the authorization url to the user, and set our state as a cookie to check against later:

```python
auth = generate_reddit_instance()
resp = make_response(render_template('authenticate.html', auth=auth['url']))
resp.set_cookie('state', auth['state'])

return resp
```

This generates [an html template](/templates/authenticate.html) with `{{ auth }}`, our authorization url.

Once the user authorizes our app, the state and code is passed back by reddit as url parameters, so we can grab it and send it back to our backend. We'll talk more about the specifics of how we do this [later](#websockets).

### Streaming new content<a name="streaming"></a>

Once we get an authozation code, we can start streaming new content from reddit with PRAW:

```python
# Given a json of the authorization code, start streaming comments
def generate_comments(json):

    code = json['code']
    reddit = generate_reddit_instance()['instance']
    reddit.auth.authorize(code)

    def generate():
        for comment in reddit.subreddit('all').stream.comments():
            # Do something
    return generate()
```

We now have access to the `comments()` generator, which will continually generate the IDs of new reddit comments. But what should `generate()` actually do? How can we pass these IDs to the front end?

### Passing content IDs to the front-end<a name="websockets"></a>

We pass data back and forth between the front- and back-end using WebSockets, made easy with [SocketIO](https://socket.io/) (and the Flask extension, [flask-SocketIO](https://flask-socketio.readthedocs.io/en/latest/)). We need to do this because we need bidirectional communication between the client and the server- we need to pass the authorization code back in order to pass comment IDs up. On the front end, to pass the authorization code back:

```javascript
// Connect to the /comments namespace
var socket = io.connect('http://' + document.domain + ':' + location.port + '/comments');

// Send the code back as an 'authorization_code' event
socket.on('connect', function() {
     socket.emit('authorization_code', {code: getUrlParameter('code')});
 });
```

And then in Python we wrap `generate_comments()` to trigger once we get a code:
```python
# Catch 'authorization_code' event
@socketio.on('authorization_code', namespace='/comments')
def generate_comments(json):
    ...
    def generate():
        for comment in reddit.subreddit('all').stream.comments():
            # Emit comment ID as a json to '/comment' namespace
            emit('comment', dumps({'id': str(comment)}))
    return generate()
```

Unfortunately, for reasons unbeknownst to me, the comment IDs currently don't come through until I kill the websocket with `Ctrl-C` in the terminal. Hopefully I'll have that fixed by Monday night.