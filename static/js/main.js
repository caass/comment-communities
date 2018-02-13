console.log('trap');

function getAccess(){
    d3.selectAll('input').each(function(){
        if (this.value !== 'Submit') console.log(this.value);
    })
}