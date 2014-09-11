var chattxt = document.getElementById('chattxt');
var sendbutton = document.getElementById('sendbutton');
var secondaryPageURL = document.getElementById('secondaryPageURL');
var session = null;

sendbutton.addEventListener('click', function() {
  session.postMessage(chattxt.value);
});

// For guest
navigator.presentation.onavailablechange = function(e) {
  session = navigator.presentation.requestSession(secondaryPageURL.value);
  session.onmessage = this.log.bind(this);
  session.onstatechange = function() {
    console.log(session.state);
  }.bind(this);
};
var UI = {
  btnDisconnect: document.getElementById('btnDisconnect'),
  init: function ui_init() {
    this.btnDisconnect.onclick = this.disconnect.bind(this);
  },
  disconnect: function php_disconnect() {
    session.close();
  }
}
UI.init();
