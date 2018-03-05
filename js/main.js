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

// Function to trim relevant data from raw JSON results
function trimResponseToRelevantData( jsonResponse ){

    // Create output object
    outputObject = {
        'after': jsonResponse['data']['after'],  // What comment do these come after
        'comments': {}
    }

    // For each comment, add the relevant data to outputObject
    comments = jsonResponse['data']['children'];
    comments.forEach( function( commentObject ){

        outputObject['comments'][commentObject['data']['id']] = {

            // Data about the comment
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
            
        };
    });

    return outputObject;

}
