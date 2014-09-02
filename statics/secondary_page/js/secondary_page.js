var chattxt = document.getElementById('chattxt');
var sendbutton = document.getElementById('sendbutton');
var session = null;

sendbutton.addEventListener('click', function() {
  session.postMessage(chattxt.value);
})

// For presenter
navigator.presentation.onpresent = function(e) {
  //Presentation.log("This is client presenting");
  //Presentation.log("state:" + e.session.state);
  session = e.session;
  session.onmessage = this.log.bind(this);
};
