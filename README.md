plugged
==========
plugged is a (v|f)ast JavaScript API for the plug.dj service.

Installation
==========
`npm install plugged`

How to use
==========
plugged is relatively easy to use. Most functions are exposed via events, thus it's easy to check for certain data.

To start with a simple bot, do this:

```javascript
var Plugged = require("plugged");
var plug = new Plugged();

// log into the service
plug.login({ email: "examplemail@examplehost.com", password: "examplepassword" });

plug.on(plug.LOGIN_SUCCESS, function _loginSuccess() {
    plug.cacheChat(true);
    plug.connect("exampleroom");
});

plug.on(plug.JOINED_ROOM, function _joinedRoom() {
    plug.on(plug.ADVANCE, function() {
        //WOOT!
        plug.woot();
    });
});
```

Events
==========
Most functionality is exposed via events. The wiki describes how to use what events when.

Server calls
==========
Sometimes you need to call data from the server, for example if you want to get your current playlist, add a new media file or get a certain list of rooms based on a search string.
All Server calls are described in the wiki