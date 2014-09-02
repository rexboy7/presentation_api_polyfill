(function(exports) {
'use strict';

var Presentation = {
  channelPeer: HTTPSignalPeer,
  sessions: {},
  peerList: document.getElementById('peerList'),
  btnConnect: document.getElementById('btnConnect'),

  lblStatus: document.getElementById('lblStatus'),
  init: function() {
    this.channelPeer.init();
    this.channelPeer.ondatachannelopen = this.onDataChannelOpened.bind(this);
    this.channelPeer.ondatachannelreceive = this.onDataChannelReceive.bind(this);
    this.channelPeer.onsecondarychange = this.updateSecondaryList.bind(this);
    this.btnConnect.onclick = this.connectPeer.bind(this);
  },
  onDataChannelOpened: function pr_onRemoteJoin() {
    this._emit('availablechange', {available: true});
  },
  // TODO: implement onRemoteLeave, check if remote server exists.
  requestSession: function pr_requestSession(url) {
    if (!url) {
      return;
    }
    var session = new PresentationSession(PrimarySessionSignaler);
    session.request(url);
    this.sessions[url] = session;
    return session;
  },
  onDataChannelReceive: function p_onDataChannelReceive(message) {
    switch(message.event) {
      case 'presentoffer':
        this.sessions[message.id]._sendAnswer(message.data);
        break;
      case 'secondaryicecandidate':
        var q = new RTCIceCandidate(message.data);
        this.sessions[message.id].pc.addIceCandidate(q);
        break;
    }
  },
  log: function p_log(message) {
    this.channelPeer.log(message);
  },
  //////////////////////////////////////
  updateSecondaryList: function php_updateSecondaryList(screens) {
    this.peerList.innerHTML = '';
    screens.forEach(function(screen) {
      this.peerList.options.add(new Option('screen ' + screen, screen));
    }.bind(this));
  },
  connectPeer: function php_connectPeer() {
    this.log(this.peerList.options[this.peerList.selectedIndex].value);
    var peerId = this.peerList.options[this.peerList.selectedIndex].value;
    this.channelPeer.sendOffer(peerId);
  },
  disconnect: function php_disconnect() {
    this.channelPeer.reset();
  },
  _emit: function ps_emit(eventname, data) {
    var cbname = 'on' + eventname;
    if (typeof this[cbname] == 'function' ) {
      this[cbname](data);
    }
  },
  ///////////////////////////////////////////////////////////
  onavailablechange: null,
  onpresent: null
};

var PrimarySessionSignaler = {
  send: function pss_sendMessage(event, data, id) {
    Presentation.channelPeer.dataChannelSend(event, data, id);
  },
  onpresent: function pss_onopened() {}
};

Presentation.init();

exports.navigator.presentation = Presentation;

var roomTag = document.getElementById('room');
if (roomTag) {
  roomTag.textContent = roomNum;
}

})(window);
