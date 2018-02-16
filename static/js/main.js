// Get a parameter (i.e. code) -- https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// Open up the websocket
var socket = io.connect('http://' + document.domain + ':' + location.port + '/comments');

// Send the authorization code to Flask
socket.on('connect', function() {
     socket.emit('authorization_code', {code: getUrlParameter('code')});
 });

// Do something with the data stream
socket.on('comment', function(data){
    console.log(JSON.parse(data).id);
});