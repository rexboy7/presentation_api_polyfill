var chattxt = document.getElementById('chattxt');
var sendbutton = document.getElementById('sendbutton');
var session = null;

sendbutton.addEventListener('click', function() {
  session.postMessage(chattxt.value);
})

// For presenter
navigator.presentation.onpresent = function(e) {
  session = e.session;
  session.onmessage = this.log.bind(this);
  session.onstatechange = function() {
    console.log(session.state);
  }.bind(this);
};
