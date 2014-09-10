var express = require('express');
var http = require('http');
var sys = require('sys');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use('/statics', express.static(__dirname + '/../statics'));
app.use(bodyParser.json());

var nextRoom = 0;
var primary = {};
var secondary = {};

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/primary/:roomNum', function(req, res) {
  fs.createReadStream(__dirname + '/../statics/primary/index.html').pipe(res);
});

app.get('/secondary_host/:roomNum', function(req, res) {
  fs.createReadStream(__dirname + '/../statics/secondary_host/index.html').pipe(res);
});

app.get('/events/primary/:roomNum', function(req, res) {
  var roomNum = req.params.roomNum;
  sendSSEHeader(res);
  if (!!primary[roomNum]) {
    primary[roomNum].push(res);
  } else {
    primary[roomNum] = [res];
  }
  console.log("Secondary:" + (secondary[roomNum] ? secondary[roomNum].length : 0));
  console.log("Primary:" + (primary[roomNum] ? primary[roomNum].length : 0));
  if (secondary[roomNum]) {
    notifySecondarychange(roomNum);
  }
  res.on('close', removeFromRoom.bind(null, primary, roomNum, res));
});


app.get('/events/secondary_host/:roomNum', function(req, res) {
  var roomNum = req.params.roomNum;
  sendSSEHeader(res);
  if (!!secondary[roomNum]) {
    secondary[roomNum].push(res);
  } else {
    secondary[roomNum] = [res];
  }
  console.log("Secondary:" + (secondary[roomNum] ? secondary[roomNum].length : 0));
  console.log("Primary:" + (primary[roomNum] ? primary[roomNum].length : 0));
  notifySecondarychange(roomNum);
  res.on('close', removeFromRoom.bind(null, secondary, roomNum, res));
});

app.post('/offer', function(req, res) {
  secondaryBroadcast(req.body.roomNum, 'offer', req.body);
  sendPostResult(res, true);
});

app.post('/answer', function(req, res) {
  primaryBroadcast(req.body.roomNum, 'answer', req.body);
  sendPostResult(res, true);
});

app.post('/primaryicecandidate', function(req, res) {
  secondaryBroadcast(req.body.roomNum, 'icecandidate', req.body);
  sendPostResult(res, true);
});

app.post('/secondary_hosticecandidate', function(req, res) {
  primaryBroadcast(req.body.roomNum, 'icecandidate', req.body);
  sendPostResult(res, true);
});

function removeFromRoom(pool, roomNum, req) {
  pool[roomNum].splice(pool[roomNum.indexOf(req)], 1);
  if(pool === secondary) {
    notifySecondarychange(roomNum);
  }
};

function notifySecondarychange(roomNum) {
  // TODO: use true IDs
  var secondaryId = [];
  for(var i = 0; i < secondary[roomNum].length; i++) {
    secondaryId.push(i);
  }
  primaryBroadcast(roomNum, 'secondarychange', { screens: secondaryId });
}

function primaryBroadcast(roomNum, event, data) {
  primary[roomNum] && primary[roomNum].forEach(function(res) {
    appendSSE(res, event, data);
  });
}

function secondaryBroadcast(roomNum, event, data) {
  secondary[roomNum] && secondary[roomNum].forEach(function(res) {
    appendSSE(res, event, data);
  });
}

function sendPostResult(res, isSuccess) {
  res.header('Content-Type', 'application/json');
  res.header('Cache-Control', 'no-cache');
  res.end(JSON.stringify({isSuccess: isSuccess}));
}
app.listen(8000);

function sendSSEHeader(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    "Access-Control-Allow-Headers": "X-Requested-With"
  });
  appendSSE(res, 'ping', {ping: "hello"});

}

function appendSSE(res, event, data) {
  if (typeof data == 'object') {
    data = JSON.stringify(data);
  }
  console.log("event: " + event);
  console.log(res.write("event: " + event + '\n'));
  console.log(res.write("data: " + data + '\n\n'));
  console.log("=======\n\n")
}

function debugHeaders(req) {
  sys.puts('URL: ' + req.url);
  for (var key in req.headers) {
    sys.puts(key + ': ' + req.headers[key]);
  }
  sys.puts('\n\n');
}
