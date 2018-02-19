function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function getNewComments( callback ){

    this.start = async function(){
        await sleep(1000)
        d3.json('https://www.reddit.com/r/all/comments/.json?limit=100', callback);
    }

}
