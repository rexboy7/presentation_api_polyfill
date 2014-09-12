(function(exports) {
'use strict';

function HTTPSignalPeer() {
}

HTTPSignalPeer.prototype = {
  get isIdle() {
    return !(this.dc);
  },
  init: function php_init() {
    this.rank = rank;
    this.dc = null;
    this.pc && this.pc.close();
    this.evtSrc && this.evtSrc.close();

    this.pc = new RTCPeerConnection(pc_config, pc_constraints);
    this.evtSrc = new EventSource(eventUrl);
    this.evtSrc.addEventListener('secondarychange', this);
    this.evtSrc.addEventListener('icecandidate', this);
    this.evtSrc.addEventListener('requestsession', this);
    this.evtSrc.addEventListener('offer', this);
    this.evtSrc.addEventListener('answer', this);
    this.evtSrc.addEventListener('ping', this);
    this.evtSrc.onerror = error;
    this.evtSrc.onclose = this.reset.bind(this);
    this.pc.onicecandidate = function (e) {
      if (e.candidate == null) {
        return;
      }
      this.serializeSend( {
        roomNum: roomNum,
        candidate: e.candidate,
        event: this.rank + "icecandidate"
      });
      this.pc.onicecandidate = null;
    }.bind(this);
    this.pc.onsignalingstatechange = function() {
    }.bind(this);
  },
  onopen: function php_onopen() {
  },
  handleEvent: function php_ondata(evt) {
    var message = JSON.parse(evt.data);
    switch (evt.type) {
      case 'secondarychange':
        this.rank = 'primary';
        this.log(message.length + ' screens available:' + message);
        this.emit('secondarychange', message.screens);
        break;
      case 'offer':
        this.rank = 'secondary_host';
        if (this.isIdle) {
          this.gotRemoteOffer(message.data);
        }
        break;
      case 'answer':
        this.gotRemoteAnswer(message.data);
        break;
      case 'ping':
        this.log('Connected to signaling server:' + message.ping);
        break;
      case 'icecandidate':
        this.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        break;
    }
  },

/////////////////////////////////////
  sendOffer: function php_sendOffer(secondaryId) {
    // create Data channel and set receiver for it
    // (we call onDataChannel manually since it's only triggered on answer side)
    try{
      this.onDataChannel({channel: this.pc.createDataChannel("sendDataChannel", {reliable: false})});
    } catch(e) {
      alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled');
      trace('createDataChannel() failed with exception: ' + e.message);
    }
    this.pc.createOffer(function(offer) {
      this.pc.setLocalDescription(offer);
      this.serializeSend({
        event: 'offer',
        data: offer,
        roomNum: roomNum,

      });
    }.bind(this), error);
  },
  serializeSend: function php_serializeSend(message) {
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open('POST', serverUrl + '/' + message.event);

    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
    xhr.setRequestHeader('Accept','application/json');

    xhr.send(JSON.stringify(message));
    xhr.onload = this.log.bind();
  },
  gotRemoteOffer: function php_gotRemoteOffer(offer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
      this.pc.createAnswer(function(answer) {
        this.pc.setLocalDescription(answer);
        this.serializeSend({
          event: 'answer',
          data: answer,
          roomNum: roomNum
        });
      }.bind(this), error);
    }.bind(this), error);
    this.pc.ondatachannel = this.onDataChannel.bind(this);
  },
  gotRemoteAnswer: function php_gotRemoteAnswer(answer) {
    if (this.rank == 'secondary_host') {
      return;
    }
    this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  },

  //////
  onDataChannel: function php_onDataChannel(evt) {
    this.dc = evt.channel;
    this.dc.onmessage = function(evt) {
      this.emit('datachannelreceive', JSON.parse(evt.data));
    }.bind(this);
    this.dc.onopen = this._onDataChannelOpened.bind(this);
    this.dc.onerror = error;
    this.dc.onclose = this.reset.bind(this);
  },
  _onDataChannelOpened: function p_onDataChannelOpened(evt) {
    this.emit('datachannelopen', evt);
  },
  dataChannelSend: function php_send(type, data, id) {
    this.dc.onerror = error;
    this.dc.send(JSON.stringify({
      event: type,
      data: data,
      id: id
    }));
  },
  reset: function php_reset() {
    this.emit('datachannelclose');
    this.init();
  },
  log: function php_log(message) {
    var div = document.createElement('div');
    div.textContent = message;
    document.body.appendChild(div);
  },
  emit: function php_emit(eventname, data) {
    var cbname = 'on' + eventname;
    if (typeof this[cbname] == 'function' ) {
      this[cbname](data);
    }
  }
};

exports.HTTPSignalPeer = HTTPSignalPeer;


})(window);
