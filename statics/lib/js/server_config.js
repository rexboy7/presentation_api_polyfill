'use strict';

var _globals = window.location.href.split('/');
var roomNum = _globals.pop();
var rank = _globals.pop();
var eventUrl = '/events/' + rank + "/" + roomNum;

var pc_config = webrtcDetectedBrowser === 'firefox' ?
  {'iceServers':[{'url':'stun:23.21.150.121'}]} : // number IP
  {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

var pc_constraints = webrtcDetectedBrowser === 'firefox' ? {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]} : {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]}
  ;
var serverURL = '127.0.0.1';
var serverPort = 8000;



function error(e) {
  console.log(JSON.stringify(e));
  throw e;
}