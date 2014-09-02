# Presentation API Polyfill

This is a pure javascript implementation of Presentation API using WebRTC as transferring channel, with an HTTP server for signaling.
Runs on Firefox.

## Requirement

You will need `node.js` with `express` package to run the signaling server. do:

> npm install express

to install express package if you haven't installed `express` yet.
## Running

1. Run `node.js server/server.js`.
2. On your primary device, use browser to open
```
http://your.ip.address:8000/primary/0
```
whereas `0` is the room number that can be specified as arbitirary interger.
3. On your secondary device, use browser to open
```
http://your.ip.address:8000/secondary_host/0
```
whereas `0` is the room number specified above.
4. If signaling is completed correctly, you will see 'screen 0' appears on your primary device. Select it and click 'connect'.
5. An Iframe pops up on your secondary device. You can try typing something to chat between the two devices.

## Develop your own application
The block diagram of current Presentation API polyfill is shown below:
```
   +-----------[Server]----------+
   |                             |
   |User agent 1                 |User agent 2
[Primary]                 [Secondary_host]
                                 |
                                 |
                          [Secondary_page]
```

* **Primary page**:

  Primary page is shown on the primary screen, which is usually the screen close to an user. So in this page developers should prepare the contents that need to be shown on the primary screen. Meanwhile, primary page also responsible for calling `presentation.openSession(<url_to_secondary_page>)` to bring up connection between primary and secondary_page page.

  An example of primary page is located in `/statics/primary/index.html`. You should use `http://your.ip.address:8000/primary/<room_number>` to access it on the web browser.
  You need to include the following polyfill library in your primary page before using Presentation API:
```
<script defer src='/statics/lib/js/adapter.js'></script>
<script defer src='/statics/lib/js/server_config.js'></script>
<script defer src='/statics/lib/js/http_signal_peer.js'></script>
<script defer src='/statics/lib/js/polyfill_presentation_session.js'></script>
<script defer src='/statics/lib/js/polyfill_primary.js'></script>
```

* **Secondary_page page**:

  secondary_page page (sorry for the poor naming :-/) contains anything that need to be shown on the second screen. dvelopers should prepare the contents that need to be shown on the second screen, which is usually the screen away from an user. Meanwhile, secondary_page page also responsible for listening to `presentation.onpresent` to confirm the session from primary page is correctly established, and start further communication.

  An example of primary page is located in `/statics/primary/index.html`. You should use `http://your.ip.address:8000/secondary_host/<room_number>` to access it on the web browser.

  You need to include the following polyfill library in your secondary_page page before using Presentation API:
```
<script defer src='/statics/lib/js/adapter.js'></script>
<script defer src='/statics/lib/js/server_config.js'></script>
<script defer src='/statics/lib/js/polyfill_presentation_session.js'></script>
<script defer src='/statics/lib/js/polyfill_secondary_page.js'></script>
```
* **Secondary_host page**:

  Developers shouldn't make changes to this page.

  Secondary_host page is not part of an app, but you need to open it on your second screen first. Once secondary_host page has been loaded, it would appear on the screen list of primary page. When primary page opens a session, secondary_host page brings up the web page specified by primary page by embedding an iframe, and helps establish the underlying connection.
