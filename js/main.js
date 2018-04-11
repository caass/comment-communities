/*
*       Scraping & Parsing Data
*/


// Sleep for ms milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Class to get new comments
class getNewComments {

    /*
    * Attributes
    */

    constructor(callback) {
        this.gettingComments = false;   // Are you currently getting comments?
        this.callback = callback;       // Callback function to pass to .start() and .stop()
    }

    /*
    * Methods
    */

    // Continuously get comments on a one-second interval so long as this.gettingComments
    async start() {
        let callback = this.callback;
        this.gettingComments = true;
        while (this.gettingComments) {
            await sleep(1000);
            d3.json('https://www.reddit.com/r/all/comments/.json?limit=100', function (error, data) {
                if (error) {
                    throw error;
                } else {
                    callback(data);
                }
            });
        }
    }

    // Set this.gettingComments to false, which stops .start()
    stop() {
        this.gettingComments = false;
    }

    // Get comments once to make sure everything is working
    test() {
        console.log('Getting new comments...');
        let callback = this.callback
        d3.json('https://www.reddit.com/r/all/comments/.json?limit=100', function (error, data) {
            if (error) {
                throw error;
            } else {
                callback(data);
                console.log('Got comments!');
            }
        });
    }

}

// Trim relevant data from raw JSON results
function trimResponseToRelevantData(jsonResponse) {

    // Create output object
    outputObject = {
        'after': jsonResponse['data']['after'],  // What comment do these come after
        'comments': []
    }

    // For each comment, add the relevant data to outputObject
    comments = jsonResponse['data']['children'];
    comments.forEach(function (commentObject) {

        outputObject['comments'].push({

            // Data about the comment
            'id': commentObject['data']['id'],
            'body': commentObject['data']['body'],
            'author': commentObject['data']['author'],
            'link': commentObject['data']['permalink'],

            // Information about the subreddit
            'subreddit': commentObject['data']['subreddit']


        });
    });

    return outputObject;

}

// Add new comments to their appropraite sub in the subreddits global
function addNewCommentsToArray(newCommentsObject) {

    // Check which subreddit a comment belongs to
    function getCommentSubreddit(commentObject) {
        return commentObject['subreddit'];
    }

    // Check if a subreddit already exists in the global object. If it does, return its index.
    function getSubredditIndex(subredditName) {
        for (var i = 0; i < subreddits.length; i++) {
            if (subreddits[i].id === subredditName) return i;
        }
        return false;
    }

    // Generate a random color from D3 Palette
    let color = d3.scaleOrdinal(d3.schemeCategory20);
    function randomColor() {
        return color(Math.floor(Math.random() * 20));
    }

    // Add the new comment to its appropriate subreddit if it doesn't already exist
    newCommentsObject['comments'].forEach(function (comment) {

        // If sub doesn't already exist within the global object, add it
        let subIndex = getSubredditIndex(comment.subreddit);
        if (!(subIndex)) {

            subreddits.push({
                id: comment.subreddit,
                radius: 3,
                comments: [comment],
                color: randomColor(),
                x: 0,  // TODO: Randomize these?
                y: 0,
                vx: 0,
                vy: 0

            });

        } else {

            let commentExists = false;

            // Iterate over each comment in the subreddit
            for (let i = 0; i < subreddits[subIndex].comments.length; i++) {

                // Check to see if this comment has the same ID as the incoming comment
                if (subreddits[subIndex].comments[i].id === comment.id) {

                    commentExists = true;
                }

            }

            // If you've checked every comment and none of them have the same ID, then add the new one
            if (!(commentExists)) {
                subreddits[subIndex].radius += 1;
                subreddits[subIndex].comments.push(comment);
            }

        }

    });

}

// Update the simulation with the new data
function updateBubbles() {

    console.log('update');

    let svg = d3.select('svg');
    let g = d3.select('g');

    let bubble = g
        .selectAll('circle')
        .data(subreddits);

    bubble.exit().remove();

    bubble
        .enter()

        // Put link elements over all of the bubbles to create popovers
        .append('a')
        .attr('data-toggle', 'popover')
        .attr('title', function (d) { return d.id; })   // Title according to subreddit
        .attr('data-content', generatePopoverContents)  // Create contents from the comments in the subreddit
        .attr('data-container', '.container-fluid')     // The parent needs to be the container, since the SVG won't hold it
        .attr('data-html', 'true')                      // Render HTML inside the popover

        // Put circles inside the links with some radius and color
        .append('circle')
        .attr('r', function (d) { return d.radius; })
        .attr("fill", function (d) { return d.color; });

    simulation
        .nodes(subreddits)
        .on('tick', function (e) {
            bubble
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .attr('r', function (d) { return d.radius; })
        });

    simulation.alphaTarget(0.4).restart();

}

// All-In-One Data Trimmer, Comments Adder, Bubbles Updater. Pass to getNewComments
function callbackWrapper(data) {

    trimmedResponse = trimResponseToRelevantData(data);
    addNewCommentsToArray(trimmedResponse);

    // This is kind of a trash workaround but...if the user clicked "Stop" then don't update the bubbles.
    if (commentGetter.gettingComments) {
        updateBubbles();
    }

}

/*
*       Page Functionality
*/

// Returns a string formatted for viewBox
function getSvgWrapDimensionsForViewBox() {

    // Get the SVG Wrap's dimensions
    var h = $('#svg-wrap').height();
    var w = $('#svg-wrap').width();

    // The minimum x and y values should be negative 1/2 * height and width
    var minx = Math.round(-0.5 * w);
    var miny = Math.round(-0.5 * h);

    // Return a string formatted for viewBox: min-x, min-y, width, height
    return minx + ' ' + miny + ' ' + w + ' ' + h;
}

// When the user clicks the bottom button
$('#startStopButton').on('click', function () {

    // If the user just opened the site (there's still the introduction)
    if ($('#svg-wrap').has('p')) {

        // Clear the introduction and instructions
        $('#svg-wrap').children().fadeOut(250).promise().done(function () {
            $('#svg-wrap').children().remove();

            // Make the SVG wrap fill the page
            var heightUnderNav = $(window).height() - $('.navbar').outerHeight();
            $('#svg-wrap').height(heightUnderNav);
            $('#svg-wrap').css('padding', '0');

            // Add an svg element to fill the spot (using D3, because jQuery apparently passes .css as lowercase)
            d3.select('#svg-wrap').append('svg')
                .attr('viewBox', getSvgWrapDimensionsForViewBox())
                .attr('preserveAspectRatio', 'xMinYMin meet');

            // Create the skeleton of the visualization, to put content in later
            // Based off of https://bl.ocks.org/mbostock/4062045

            let svg = d3.select('svg');

            // Initial simulation setup
            simulation
                .force('repel', d3.forceManyBody().strength(-20))  // Make the nodes repel each other
                .force('centerX', d3.forceX(0).strength(.3))  // Center will always be at 0, 0 because of getSvgWrapDimensionsForViewBox()
                .force('centerY', d3.forceY(0).strength(.3))
                .force('collide', d3.forceCollide(function (d) { return d.radius + Math.sqrt(d.radius); }));  // Collision

            // Create a data join for bubbles
            let g = svg.append('g').attr('class', 'bubbles');
            let bubble = g
                .selectAll('circle')
                .data(subreddits)
                .enter()

                // Put link elements over all of the bubbles to create popovers
                .append('a')
                .attr('data-toggle', 'popover')
                .attr('title', function (d) { return d.id; })   // Title according to subreddit
                .attr('data-content', generatePopoverContents)  // Create contents from the comments in the subreddit
                .attr('data-container', '.container-fluid')     // The parent needs to be the container, since the SVG won't hold it
                .attr('data-html', 'true')                      // Render HTML inside the popover

                // Put circles inside the links with some radius and color
                .append('circle')
                .attr('r', function (d) { return d.radius; })
                .attr("fill", function (d) { return d.color; });

            //Initialize popovers
            $('[data-toggle="popover"]').popover();

            // Set the nodes for the simulation and also the tick behavior (update bubbles position)
            simulation
                .nodes(subreddits)
                .on('tick', function (e) {
                    bubble
                        .attr("cx", function (d) { return d.x; })
                        .attr("cy", function (d) { return d.y; })
                        .attr('r', function (d) { return d.radius; });
                });

        });
    }

    // Toggle the button's coloration and visibility
    $(this).toggleClass('btn-success');
    $(this).toggleClass('btn-outline-danger');

    // If the button is btn-success then it shouldn't be getting comments
    if ($(this).hasClass('btn-success')) {
        $(this).text('Get Comments');

        commentGetter.stop();
        simulation.alphaTarget(0).restart();

    } else {

        // Likewise, if not, then you should start getting comments
        $(this).text('Stop');

        commentGetter.start();

    }
});

// Resize the SVG when the window is resized
$(window).on('resize', function () {

    // Set the height for the wrapper
    var heightUnderNav = $(window).height() - $('.navbar').outerHeight()
    $('#svg-wrap').height(heightUnderNav);

    // Update the SVG viewBox
    d3.select('svg').attr('viewBox', getSvgWrapDimensionsForViewBox())
});

// Reset the visualization when "reset visualization" is clicked
$('.reset-visualization').on('click', function () {

    // Clear the subreddit data
    subreddits = [];

    // TODO: Also make the SVG empty? maybe my forcing the simulation to update?
    d3.select('g').remove();

})

// Popover the bubble information when they're clicked
function generatePopoverContents(d) {

    // Create an output string to add content to
    var outputText = '';

    // Pull out the comments
    var comments = d.comments;

    // Add to the output text to make some useful information about the subreddit
    outputText += '<p class="lead mb-1">' + comments.length + ' comment' + (comments.length === 1 ? '' : 's') + ' so far.</p><ul class="list-unstyled">';

    // Add list items for each comment
    comments.forEach(function (comment) {

        // Add a new list element with a link to the comment
        outputText += '<li><a target="_blank" href="https://reddit.com' + comment.link + '">';

        // Add the first three words of the comment  TODO: Only put an ellipsis if there's more than 3 words in the comment.
        outputText += comment.body.split(' ').slice(0, 3).join(' ') + '...';

        // Close the link and list item
        outputText += '</a></li>';

    });

    // Close the list and return the HTML string
    return outputText + '</ul>';

}

// Remove popovers when the user clicks outside of one -- https://stackoverflow.com/a/20468809/6894799
$('body').on('click', function (e) {
    $('[data-toggle=popover]').each(function () {
        // hide any open popovers when the anywhere else in the body is clicked
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
        }
    });
});

/*
*       Global Variables
*/

// Object to contain unique subreddits and the comments belonging to each
var subreddits = [];

// Globally accessible instance of a comment fetcher
var commentGetter = new getNewComments(callbackWrapper);

// Force simulation
var simulation = d3.forceSimulation();
