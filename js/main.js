/* 
        SCRAPING / PARSING DATA RELATED FUNCTIONS
 */

// Sleep for ms milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main constructor (?)
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
        }
    });

    return commentsArray;

}

/*

// Shows functionality of trimResponseToRelevantData and addNewCommentsToArray
function testFunc( data ){

    res = trimResponseToRelevantData( data );
    arr = addNewCommentsToArray(res, testArray);
    console.log(arr)


}

var testArray = [];

*/

/*

        PAGE FUNCTIONALITY RELATED

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
        });
    }
    
    // Toggle the button's coloration and visibility
    $(this).toggleClass('btn-success');
    $(this).toggleClass('btn-outline-danger');

    // If the button is btn-success then it shouldn't be getting comments
    if( $(this).hasClass('btn-success') ){
        $(this).text('Get Comments');
        
        // TODO
        // Stop getting comments

    } else {

        // Likewise, if not, then you should start getting comments
        $(this).text('Stop');
            
        // TODO
        // Get comments

    }
});

$(window).on('resize', function(){

    // Set the height for the wrapper
    var heightUnderNav = $(window).height() - $('.navbar').outerHeight()
    $('#svg-wrap').height(heightUnderNav);

    // Update the SVG viewBox
    d3.select('svg').attr('viewBox', getSvgWrapDimensionsForViewBox())
});
