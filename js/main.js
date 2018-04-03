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

// Globally accessible instance of a comment fetcher
var commentGetter = new getNewComments( callbackWrapper );

// Force simulation
var simulation = d3.forceSimulation();

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
            radius: 5, // radius is equal to the count of the comments in the subreddit TODO: Scale this value so it looks better
            x: 0,  // TODO: Randomize these?
            y: 0,
            vx: 0,
            vy: 0

        });

    } else {

        // Otherwise increment its count because it just got another comment
        subreddits[ returnSubredditIndex( sub ) ]['radius'] += 1;
    }

    return;

}


/*
*       Page Functionality
*/

// Returns a string formatted for viewBox
function getSvgWrapDimensionsForViewBox(){

    // Get the SVG Wrap's dimensions
    var h = $('#svg-wrap').height();
    var w = $('#svg-wrap').width();

    // The minimum x and y values should be negative 1/2 * height and width
    var minx = Math.round( -0.5 * w);
    var miny = Math.round( -0.5 * h);

    // Return a string formatted for viewBox: min-x, min-y, width, height
    return minx + ' ' + miny + ' ' + w + ' ' + h;
}

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

            // Add an svg element to fill the spot (using D3, because jQuery apparently passes .css as lowercase)
            d3.select('#svg-wrap').append('svg')
                .attr('viewBox', getSvgWrapDimensionsForViewBox())
                .attr('preserveAspectRatio', 'xMinYMin meet');

            // Create the skeleton of the visualization, to put content in later
            // Based off of https://bl.ocks.org/mbostock/4062045

            var svg = d3.select('svg');
            var color = d3.scaleOrdinal(d3.schemeCategory20);

            // Initial simulation setup
            simulation
                .force('attract', d3.forceManyBody().strength(30))  // Attractive force for nodes
                .force('center', d3.forceCenter(0, 0))  // Center will always be at 0, 0 because of getSvgWrapDimensionsForViewBox()
                .force('collide', d3.forceCollide( function(d){ return d.radius; }));  // Collision

            // Create a data enter for bubbles
            var bubble = svg.append('g')
                .attr('class', 'bubbles')
              .selectAll('circle')
              .data(subreddits)
              .enter().append('circle')
                .attr('r', function(d) { return d.radius; })
                .attr("fill", function(d) { return color(Math.floor(Math.random() * 20)); }) // Randomize color

                // Drag functionality
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            // Set the nodes for the simulation and also the tick behavior (update bubbles position)
            simulation
                .nodes( subreddits )
                .on('tick', function(e){ 
                    bubble
                        .attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; });
                });

            // Drag functionality
            function dragstarted(d) {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                }
                
                function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
                }
                
                function dragended(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
                }
        });
    }
    
    // Toggle the button's coloration and visibility
    $(this).toggleClass('btn-success');
    $(this).toggleClass('btn-outline-danger');

    // If the button is btn-success then it shouldn't be getting comments
    if( $(this).hasClass('btn-success') ){
        $(this).text('Get Comments');
        
        commentGetter.stop();

    } else {

        // Likewise, if not, then you should start getting comments
        $(this).text('Stop');
            
        commentGetter.start();

    }
});

$(window).on('resize', function(){

    // Set the height for the wrapper
    var heightUnderNav = $(window).height() - $('.navbar').outerHeight()
    $('#svg-wrap').height(heightUnderNav);

    // Update the SVG viewBox
    d3.select('svg').attr('viewBox', getSvgWrapDimensionsForViewBox())
});
