(function(exports) {
'use strict';

function PresentationSession(signaler) {
  this.signaler = signaler;
  this._currentstate = 'disconnected';
  this.pc = new RTCPeerConnection(pc_config, pc_constraints);
  this.pc.onicecandidate = function(e) {
    if (e.candidate == null) {
      return;
    }
    this.signaler.send('icecandidate', e.candidate.toJSON(), this.id);
    this.pc.onicecandidate = null;
  }.bind(this);
}

PresentationSession.prototype = {
  pc: null,
  get state() {
    return this._currentstate;
  },
  postMessage: function ps_postMessage(message) {
    this.dc.send(JSON.stringify(message));
  },
  close: function ps_close() {
    this.pc.close();
  },
  request: function ps_request(url) {
    this.signaler.send('opensession', url);
    this._url = url;
    this.id = url;
  },
  _sendAnswer: function ps_sendAnswer(offer) {
    var qqq = new RTCSessionDescription(offer);
    this.pc.setRemoteDescription(qqq, function() {
      this.pc.createAnswer(function(answer) {
        this.pc.setLocalDescription(answer);
        this.signaler.send('presentanswer', answer, this.id);
      }.bind(this), error);
    }.bind(this), error);
    this.pc.ondatachannel = this._onDataChannel.bind(this);
  },
  _sendOffer: function pc_sendOffer() {
    this._onDataChannel({channel: this.pc.createDataChannel('present')});
    this.pc.createOffer(function(offer) {
      // Compability for both firefox/chrome
      var offerData = offer.toJSON ? offer.toJSON() : JSON.parse(JSON.stringify(offer));

      this.signaler.send('presentoffer', offerData, this.id);
      this.pc.setLocalDescription(offer);
    }.bind(this)  , error);
  },
  _receiveAnswer: function ps_receiveAnswer(message) {
    this.pc.setRemoteDescription(new RTCSessionDescription(message.data));
  },
  _onDataChannel: function ps_onDataChannel(evt) {
    this.dc = evt.channel;
    this.dc.onmessage = this._onDataChannelReceive.bind(this);
    this.dc.onopen = this._onDataChannelOpened.bind(this);
    this.dc.onclose = this._onDataChannelClosed.bind(this);

    this.currentstate = 'connected';
    this._emit('statechange');
  },
  _onDataChannelOpened: function ps_onDataChannelOpened(evt) {
    this.signaler.onpresent({session: this});
  },
  _onDataChannelClosed: function ps_onDataChannelClosed(evt) {
    this.signaler.onclose(evt, this.id);
  },
  _onDataChannelReceive: function ps_onDataChannelReceive(evt){
    this._emit('message', evt.data);
  },
  _emit: function ps_emit(eventname, data) {
    var cbname = 'on' + eventname;
    if (typeof this[cbname] == 'function' ) {
      this[cbname](data);
    }
  },
  //TODO: implement onstatechange


  _url: null
};

exports.PresentationSession = PresentationSession;

})(window);