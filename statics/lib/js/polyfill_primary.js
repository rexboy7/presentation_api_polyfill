/* global HTTPSignalPeer, PresentationSession, RTCIceCandidate, roomNum */
(function(exports) {
'use strict';

const DisableSignalingPanel = false;

var PolyFillPrimary = {
  channelPeer: new HTTPSignalPeer(),
  sessions: {},
  peerList: [],

  init: function() {
    this.channelPeer.init();
    this.channelPeer.ondatachannelopen = this.onDataChannelOpened.bind(this);
    this.channelPeer.ondatachannelreceive =
                                           this.onDataChannelReceive.bind(this);
    this.channelPeer.onsecondarychange = this.updateSecondaryList.bind(this);
    this.channelPeer.ondatachannelclose = (function() {
      this._emit('availablechange', {available: false});
    }).bind(this);
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
    this.peerList = [].concat(screens);
    this._emit('secondaryupdate', screens);
  },
  connectPeer: function php_connectPeer(idx) {
    var peerId = this.peerList[idx];
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
var SignalingPanel = {
  peerList: document.getElementById('peerList'),
  btnConnect: document.getElementById('btnConnect'),
  init: function sp_init() {
    if (DisableSignalingPanel) {
      return;
    }
    PolyFillPrimary.onsecondaryupdate = this.updateSecondaryListUI.bind(this);
    this.btnConnect.onclick = this.connectPeer.bind(this);
  },
  updateSecondaryListUI: function sp_updateSecondaryListUI() {
    this.peerList.innerHTML = '';
    PolyFillPrimary.peerList.forEach(function(screen) {
      this.peerList.options.add(new Option('screen ' + screen, screen));
    }.bind(this));
  },
  connectPeer: function php_connectPeer() {
    PolyFillPrimary.connectPeer(this.peerList.selectedIndex);
  }
}

var PrimarySessionSignaler = {
  send: function pss_sendMessage(event, data, id) {
    PolyFillPrimary.channelPeer.dataChannelSend(event, data, id);
  },
  onpresent: function pss_onopened() {},
  onclose: function pss_onclose() {}
};

PolyFillPrimary.init();
SignalingPanel.init();

exports.navigator.presentation = PolyFillPrimary;

var roomTag = document.getElementById('room');
if (roomTag) {
  roomTag.textContent = roomNum;
}

})(window);
