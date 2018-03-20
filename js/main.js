// TODO
// 1. Do we need to store all of the comments? If we don't actually care about the contents of a comment, can't we just
//    run incrementSubredditCommentCount and only incrementSubredditCommentCount for all the comments? We can still have
//    the bubbles function as links to the subreddit without storing the comment data
//    - Side note: remember the duplicating comments thing? That will still matter
//
// 2. If you're looking to try out the functionality in this commit (looking at you, future less tired Daniel) you need to:
//    > var n = new getNewComments( callbackWrapper );
//    > n.start();
//    ...
//    > n.stop();
//    > subreddits;  // Returns array of subreddits
//    > var a = createSimulation();
//    > a.nodes();  // All nodes will have radius, x, y, vx, vy

/*
*       Global Variables
*/


// Object to contain unique subreddits and count how many comments there are in that sub, e.g. {'askreddit': 10, 'iama': 5, ..., 'meirl': 1}
var subreddits = [];

// Array to contain all comments
var comments = [];

/* 
*       Scraping & Parsing Data
*/


// Sleep for ms milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get new comments, call it as a constructor i.e. var x = new getNewComments(callback)
// Methods: start, stop, test
function getNewComments( callback ){

    /*
    * Attributes
    */

    // Boolean: Are you currently getting comments?
    this.gettingComments = false;

    /*
    * Methods
    */

    // Continuously get comments on a one-second interval so long as this.gettingComments
    this.start = async function(){
        this.gettingComments = true;
        while( this.gettingComments ){
            await sleep(1000)
            d3.json('https://www.reddit.com/r/all/comments/.json?limit=100', function(error, data){
                if(error){
                    throw error;
                } else {
                    callback(data);
                }
            });
        }
    }

    // Set this.gettingComments to false, which stops .start()
    this.stop = function(){
        this.gettingComments = false;
    }

    // Get comments once to make sure everything is working
    this.test = function(){
        console.log('Getting new comments...');
        d3.json('https://www.reddit.com/r/all/comments/.json?limit=100', function(error, data){
            if(error){
                throw error;
            } else {
                callback(data);
                console.log('Got comments!');
            }
        });
    }

}

// Trim relevant data from raw JSON results
function trimResponseToRelevantData( jsonResponse ){

    // Create output object
    outputObject = {
        'after': jsonResponse['data']['after'],  // What comment do these come after
        'comments': []
    }

    // For each comment, add the relevant data to outputObject
    comments = jsonResponse['data']['children'];
    comments.forEach( function( commentObject ){

        outputObject['comments'].push({

            // Data about the comment
            'id': commentObject['data']['id'],
            'name': commentObject['data']['name'],
            'body': commentObject['data']['body'],
            'body_html': commentObject['data']['body_html'],
            'author': commentObject['data']['author'],
            'created': commentObject['data']['created'],

            // Information about the post
            'link_id': commentObject['data']['link_id'],
            'link_author': commentObject['data']['link_author'],
            'link_title': commentObject['data']['link_title'],
            'link_permalink': commentObject['data']['link_permalink'],
            'link_url': commentObject['data']['link_url'],

            // Information about the subreddit
            'subreddit_id': commentObject['data']['subreddit_id'],
            'subreddit': commentObject['data']['subreddit']
            

        });
    });

    return outputObject;

}

// Add new comments to an array, avoiding overlap
// NOTE: Modifies input array, AND ALSO returns a copy of input array
function addNewCommentsToArray( newCommentsObject, commentsArray ){

    // Check a comment's name
    function getCommentName( commentObject ){
        return commentObject['name'];
    }

    // The fastest way I can think of to add new comments to the big array
    // is to find the comment with the "highest" name, and only add comments
    // that have names higher than that one. The reason we can't just assume
    // that the comments are in order is because they're not.
    // TODO: Make this faster / more efficient

    // Starting with the 'after', find the highest comment ID in commentsArray
    afterCommentName = newCommentsObject['after']
    for( var i = commentsArray.length - 1; i >= 0; i-- ){
        currentCommentName = getCommentName( commentsArray[i] );
        if ( currentCommentName > afterCommentName ){
            afterCommentName = currentCommentName;
        }
    }

    // Add new comments to commentsArray if they come after afterCommentName
    newCommentsObject['comments'].forEach( function( comment ){

        if( comment['name'] > afterCommentName ){
            commentsArray.push( comment );

            // Also, increment the subreddit count for the subreddit that this comment belongs to
            incrementSubredditCommentCount( comment['subreddit'] );
        }
    });

    return commentsArray;

}

// Wrapper function for trimResponseToRelevantData and addNewCommentsToArray to pass to getNewComments
function callbackWrapper( data ){

    trimmedResponse = trimResponseToRelevantData( data );
    addNewCommentsToArray(trimmedResponse, comments);  // Adds new comments to global object

}


/*
*       Translating data into bubbles
*/


// Check if a subreddit already exists in the global object
function returnSubredditIndex( subredditName ){
    for( var i = 0; i < subreddits.length; i++ ){
        if( subreddits[i].id = subredditName ) return i;
    }
    return false;
}

// Given a subreddit name, increment its count in the global subreddits object
function incrementSubredditCommentCount( sub ){

    // If sub doesn't already exist within the global object, add it
    if (!( returnSubredditIndex( sub ) )) {

        subreddits.push({
            id: sub,
            radius: 1, // radius is equal to the count of the comments in the subreddit TODO: Scale this value so it looks better
            x: 0,  // TODO: Randomize these?
            y: 0,
            vx: 0,
            vy: 0

        });

    } else {

        // Otherwise increment its count because it just got another comment
        subreddits[ returnSubredditIndex( sub ) ]['radius']++;
    }

    return;

}

// Create a D3 force simulation from the subreddits global
function createSimulation(){

    // Create the force simulation
    var force = d3.forceSimulation()
            .nodes( subreddits )
            .force('attraction', d3.forceManyBody().strength(30))
            .force('center', d3.forceCenter())
            .force('collide', d3.forceCollide(function(d){return d.radius}));

    return force;
}


/*
*       Page Functionality
*/


// When the user clicks the bottom button
$('#startStopButton').on('click', function(){

    // If the user just opened the site (there's still the introduction)
    if( $('#svg-wrap').has( 'p' ) ){

        // Clear the introduction and instructions
        $('#svg-wrap').children().fadeOut(250).promise().done(function(){
            $('#svg-wrap').children().remove();
                    
            // Make the SVG wrap fill the page
            var heightUnderNav = $(window).height() - $('.navbar').outerHeight()
            $('#svg-wrap').height(heightUnderNav);
            $('#svg-wrap').css('padding', '0');
        });
    }
    
    // Toggle the button's coloration and visibility
    $(this).toggleClass('btn-success');
    $(this).toggleClass('btn-outline-danger');

    // If the button is btn-success then it shouldn't be getting comments
    if( $(this).hasClass('btn-success') ){
        $(this).text('Get Comments');
        
        // TODO: Stop getting comments

    } else {

        // Likewise, if not, then you should start getting comments
        $(this).text('Stop');
            
        // TODO: Get comments

    }
});
