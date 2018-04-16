# Comment Communities

This is a project by the [Gerogia Tech Big Data Club](https://github.com/gt-big-data) to visualize the comment activity going on all across reddit in real time. We built this web app with [D3](d3js.org) and [Boostrap](https://getbootstrap.com) to visualize the comment activity happening on [reddit](https://reddit.com) in real time over the course of the Spring 18 semester, working at and between weekly club meetings. We brainstormed the idea, [drafted a rough plan](https://imgur.com/a/VYQEn), found online resources to learn from, and worked from there.

There are three main components to this project:

1. [Scraping the data](#data-scraping)
2. [Cleaning and organizing the data](#data-cleaning)
3. [Visualizing the data](#visualization)

## Data Scraping

The first step for this project was to get comment data from reddit.

We expiremented with using [the Python Reddit API Wrapper (PRAW)](https://praw.readthedocs.io/en/latest/) alongside [Flask](http://flask.pocoo.org/) in order to build the web app, because PRAW makes it really easy to get all the new comments with [`reddit.subreddit('all').stream.comments()`](http://praw.readthedocs.io/en/latest/code_overview/other/subredditstream.html?highlight=comments#praw.models.reddit.subreddit.SubredditStream.comments). Unfortunately, Daniel wasn't able to figure out how to get those comments passed between the backend Python and the frontend Javascript (despite spending hours and hours fiddling with [Flask-SocketIO](https://flask-socketio.readthedocs.io/en/latest/)), so we decided to write our own wrapper for getting comments in the front-end.

That's right, data scraping with client-side javascript. Ouch. We forked [his repo](https://github.com/dfridkin/comment-communities) and got to work.

Actually, it was pretty easy to get new comments; because we do all of our scraping client-side, we can't use API keys, so we just poke [this URL](https://www.reddit.com/r/all/comments/.json?limit=100) every second or so. We can use [`D3.json()`](https://github.com/d3/d3-fetch/blob/master/README.md#json) on a timer to catch new comments often enough that we shouldn't miss any.

We put our scraping functionality into a single class:

```javascript 
class getNewComments {

    constructor(callback) {

        // Are you currently getting comments?
        this.gettingComments = false;

        // Callback once you get data
        this.callback = callback;
    }


    // Continuously get comments on a one-second interval 
    // so long as this.gettingComments is true
    async start() {
        ...
    }

    // Set this.gettingComments to false, which stops .start()
    stop() {
        ...
    }

    // Get comments once to make sure everything is working
    test() {
        ...
    }

}

```

The callback we passed to `getNewComments` was a wrapper for all of our data cleaning functionality.

## Data Cleaning

If you looked at the URL that we poke to get new comments, you'll see that the JSON response

1. is loaded with extraneous information,
2. has kind of an inconvenient format for our purposes,
2. puts the comments all out of order,

and if you refresh the page as often as we do,

3. sometimes repeats comments across requests.

This means that we can't just add new comments directly from the JSON response to our visualization, instead we have to pre-process some to deal with the four problems we found. We deal with problems one and two with a function called `trimResponseToRelevantData`, and three and four with `addNewCommentsToArray`.

`trimResponseToRelevantData` does exactly what the name implies: it trims the JSON response to just the relevant data, and formats its output so that it's just an array of comment objects, instead of nesting all the comments three layers deep in an object.

`addNewCommentsToArray` takes the output from `trimResponseToRelevantData`, and adds any new content to the global `subreddits` object. Once there's content in `subreddits`, we can initialize the visualization.

## Visualization

The visualization itself is custom implementation of a [D3 force-directed graph](https://bl.ocks.org/mbostock/4062045). The nodes are set to the `subreddits` global, and their size is set according to the number of comments left in a subreddit. A centering force is applied to keep the nodes in the middle of the page, and collision and repulsive forces are added to keep the nodes separated.

In order to update the graph in real time, we wrote a function `updateBubbles()` which does exactly that -- update the bubbles. It gets called every time there are more nodes added, which causes the graph to update in real time.