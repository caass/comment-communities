function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function getNewComments( callback ){

    this.gettingComments = false;

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

    this.stop = function(){
        this.gettingComments = false;
    }

}
