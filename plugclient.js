var EventEmitter = require("events").EventEmitter;
var models = require("./state.js");
var Query = require("./query");
var WebSocket = require("ws");
var async = require("async");
var util = require("util");

var baseURL = "https://plug.dj";

var endpoints = {
    /*--------------- GET ---------------*/
    CSRF: baseURL,
    NEWS: baseURL +         "/_/news",
    BANS: baseURL +         "/_/bans",
    STAFF: baseURL +        "/_/staff",
    ROOMS: baseURL +        "/_/rooms",
    MUTES: baseURL +        "/_/mutes",
    TOKEN: baseURL +        "/_/auth/token",
    FRIENDS: baseURL +      "/_/friends",
    HISTORY: baseURL +      "/_/rooms/history",
    IGNORES: baseURL +      "/_/ignores",
    INVITES: baseURL +      "/_/friends/invites",
    PRODUCTS: baseURL +     "/_/store/products",
    INVENTORY: baseURL +    "/_/store/inventory",
    ROOMSTATS: baseURL +    "/_/rooms/state",
    USERSTATS: baseURL +    "/_/users/",
    PLAYLISTS: baseURL +    "/_/playlists",
    USERHISTORY: baseURL +  "/_/users/me/history",
    FAVORITEROOM: baseURL + "/_/rooms/favorites",
    VALIDATEROOM: baseURL + "/_/rooms/validate/",
    /*--------------- PUT ---------------*/
    LOCK: baseURL +         "/_/booth/lock",
    BLURB: baseURL +        "/_/profile/blurb",
    CYCLE: baseURL +        "/_/booth/cycle",
    LOGIN: baseURL +        "/_/auth/login",
    AVATAR: baseURL +       "/_/users/avatar",
    STATUS: baseURL +       "/_/users/status",
    LANGUAGE: baseURL +     "/_/users/language",
    IGNOREFRIEND: baseURL + "/_/friends/ignore",
    /*--------------- POST --------------*/
    VOTES: baseURL +        "/_/votes",
    RESET: baseURL +        "/_/auth/reset/me",
    PURCHASE: baseURL +     "/_/store/purchase",
    FACEBOOK: baseURL +     "/_/auth/facebook",
    JOINROOM: baseURL +     "/_/rooms/join",
    ADDBOOTH: baseURL +     "/_/booth/add",
    BULKUSERS: baseURL +    "/_/users/bulk",
    JOINBOOTH: baseURL +    "/_/booth",
    SKIPBOOTH: baseURL +    "/_/booth/skip",
    MOVEBOOTH: baseURL +    "/_/booth/move",
    CREATEROOM: baseURL +   "/_/rooms",
    UPDATEROOM: baseURL +   "/_/rooms/update",
    UPDATESTAFF: baseURL +  "/_/staff/update",
    /*-------------- DELETE -------------*/
    CHAT: baseURL +         "/_/chat/",
    SESSION: baseURL +      "/_/auth/session",
    REMOVEBOOTH: baseURL +  "/_/booth/remove/",
    NOTIFICATION: baseURL + "/_/notifications/"
};

WebSocket.prototype.sendMessage = function(type, data, offset) {
    offset = offset || 0;

    if(typeof type === "string" && (typeof data === "string" || typeof data === "number")) {
        this.send([
            '"{\\"a\\":\\"', type, '\\",\\"p\\":\\"', data, 
            '\\",\\"t\\":\\"', Date.now() - offset, '\\"}"'
            ].join(''));
    }
};

function setErrorMessage(statusCode, msg) {
    return {
        code: statusCode,
        message: msg
    };
}

function loginClient(client, tries, callback) {
    async.waterfall([
        client.getCSRF.bind(client),
        client.setLogin.bind(client),
        client.getAuthAndServerTime.bind(client)
    ], function(err) {
        if(!err) {

            client.connectSocket(function(err) {
                if(!err)
                    callback.call(client, null);
                else
                    callback.call(client, err);
            });

        } else {

            if(tries < 2) {
                client.log("an error occured while trying to log in", 0, "red");
                client.log("err: " + err.code, 1, "red");
                client.log("trying to reconnect...", 0);
                loginClient(client, ++tries, callback);
            } else {
                client.log("couldn't log in.", 0, "red");
                callback.call(client, err);
            }

        }
    });
}

function PlugClient() {
    this.log = function() {};
    this.state = models.createState();
    this.query = new Query();
    this.credentials = null;
    this.keepAliveID = null;
    this.sock = null;
    this.auth = null;
    this.offset = null;
}

util.inherits(PlugClient, EventEmitter);

PlugClient.prototype.BANDURATION = {
    HOUR:   'h',
    DAY:    'd',
    PERMA:  'f'
};

PlugClient.prototype.MUTEDURATION = {
    SHORT:  's',
    MEDIUM: 'm',
    LONG:   'l'
};

PlugClient.prototype.USERROLE = {
    NONE:       0,
    RESIDENTDJ: 1,
    BOUNCER:    2,
    MANAGER:    3,
    COHOST:     4,
    HOST:       5
};

PlugClient.prototype.USERSTATUS = {
    AVAILABLE:  1,
    AWAY:       2,
    WORKING:    3,
    GAMING:     4
};

PlugClient.prototype.CHAT = "chat";
PlugClient.prototype.VOTE = "vote";
PlugClient.prototype.GRAB = "grab";
PlugClient.prototype.EARN = "earn";
PlugClient.prototype.MOD_BAN = "modBan";
PlugClient.prototype.ADVANCE = "advance";
PlugClient.prototype.MOD_SKIP = "modSkip";
PlugClient.prototype.MOD_MUTE = "modMute";
PlugClient.prototype.MOD_STAFF = "modStaff";
PlugClient.prototype.SOCK_OPEN = "sockOpen";
PlugClient.prototype.USER_SKIP = "userSkip";
PlugClient.prototype.USER_JOIN = "userJoin";
PlugClient.prototype.SOCK_ERROR = "sockError";
PlugClient.prototype.USER_LEAVE = "userLeave";
PlugClient.prototype.MOD_MOVE_DJ = "modMoveDJ";
PlugClient.prototype.USER_UPDATE = "userUpdate";
PlugClient.prototype.SOCK_CLOSED = "sockClosed";
PlugClient.prototype.CHAT_DELETE = "chatDelete";
PlugClient.prototype.SCORE_UPDATE = "scoreUpdate";
PlugClient.prototype.SCORE_UPDATE = "scoreUpdate";
PlugClient.prototype.CHAT_COMMAND = "chatCommand";
PlugClient.prototype.DJ_LIST_CYCLE = "djListCycle";
PlugClient.prototype.DJ_LIST_LOCKED = "djListLocked";
PlugClient.prototype.HISTORY_UPDATE = "historyUpdate";
PlugClient.prototype.WAIT_LIST_UPDATE = "waitListUpdate";
PlugClient.prototype.ROOM_NAME_UPDATE = "roomNameUpdate";
PlugClient.prototype.MAINTENANCE_MODE = "plugMaintenance";
PlugClient.prototype.ROOM_WELCOME_UPDATE = "roomWelcomeUpdate";
PlugClient.prototype.ROOM_DESCRIPTION_UPDATE = "roomDescriptionUpdate";

PlugClient.prototype.getAuthAndServerTime = function(data, callback) {
    callback = callback || function() {};
    callback.bind(this);

    //the endpoint is the same but the site's content has changed due
    //to the user being logged in.
    this.query.query("GET", endpoints["CSRF"], function(err, body) {
        if(!err) {
            var idx = body.indexOf("_jm=\"") + 5;
            var token;
            var time;

            token = body.substr(idx, body.indexOf("\"", idx) - idx);
            idx = body.indexOf("_st=\"") + 5;
            time = body.substr(idx, body.indexOf("\"", idx) - idx);

            time = Date.parse(time);

            //a valid token is always 128 characters in length
            if(token.length == 128 && !isNaN(time)) {
                this.log("auth token: " + token, 2, "yellow");
                this.log("time: " + time, 2, "yellow");
                this.offset = Date.now() - time;
                this.auth = token;

                callback(null, token, time);
            } else {
                callback(setErrorMessage(200, "couldn't fetch auth token or servertime"));
            }

        } else {
            callback(err);
        }
    }.bind(this));
};

/*================== WebSocket ==================*/
PlugClient.prototype.connectSocket = function(callback) {
    callback = callback || function() {};
    var self = this;
    var reconnect = false;
    var sid = Math.floor(Math.random() * 1000);
    var id = "xxxxxxxx".replace(/x/g, function() {
        return "abcdefghijklmnopqrstuvwxyz0123456789_".charAt(Math.floor(Math.random() * 37));
    });

    this.log("Server: " + sid, 3, "yellow");
    this.log("ID: " + id, 3, "yellow");

    if(this.sock) {
        this.sock = null;
        reconnect = true;
    }

    this.sock = new WebSocket("wss://shalamar.plug.dj/socket/" + sid + '/' + id + "/websocket");

    /*================= SOCK OPENED =================*/
    this.sock.on("open", function _sockOpen() {
        self.log("socket opened", 3, "magenta");
        self.emit(self.SOCK_OPEN, self);
        callback.call(self, null);
    });

    /*================= SOCK CLOSED =================*/
    this.sock.on("close", function _sockClose() {
        self.log("sock closed", 3, "magenta");
        self.emit(self.SOCK_CLOSED, self);
    });

    /*================= SOCK ERROR ==================*/
    this.sock.on("error", function _sockError(err) {
        self.log("sock error!", 3, "magenta");
        self.emit(self.SOCK_ERROR, self, err);
        callback.call(self, err);
    });

    /*================= SOCK MESSAGE =================*/
    this.sock.on("message", function(msg) {
        //self.log(["sock message: ", msg].join(''), 2, "white");

        switch(msg.charAt(0)) {
            case "o":
                self.keepAliveTimer.call(self);
                //the auth message has to be send on the first connect only
                if(!reconnect)
                    this.sendMessage("auth", self.auth, self.offset);
                break;

            case "h":
                self.keepAliveTimer.call(self);
                break;

            case "a":
                self.wsaprocessor(self, msg);
                break;

            default:
                self.log(["unknown message: ", msg].join(''), 1, "yellow");
                break;
        }
    });
};

//WebSocket "a" (answer) processor
PlugClient.prototype.wsaprocessor = function(self, msg) {
    var data = JSON.parse(msg.substr(3, msg.length - 5));
    console.log(data);
    var previous = undefined;
    
    switch(data.a) {
        case self.ADVANCE:
        previous = self.state.booth.media;
        self.state.booth = models.parseBooth(data.p);

        self.emit(self.ADVANCE, self.state.booth, previous);
        break;

        case self.CHAT:
        if(data.p.message.charAt(0) == '/')
            self.emit(self.CHAT_COMMAND, models.parseChat(data.p));
        else
            self.emit(self.CHAT, models.parseChat(data.p));
        break;

        case self.CHAT_DELETE:
        self.emit(self.CHAT_DELETE, models.parseChatDelete(data.p));
        break;

        case self.DJ_LIST_CYCLE:
        self.state.booth.cycle = data.p.f;
        self.emit(self.DJ_LIST_CYCLE, self.state.booth, data.p.u, data.p.m);
        break;

        case self.DJ_LIST_LOCKED:
        self.state.booth.locked = data.p.f;
        
        self.emit(self.DJ_LIST_LOCKED, models.parseLock(data.p), data.p.c, data.p.u, data.p.m);
        break;

        case "djListUpdate":
        self.state.room.waitlist = data.p;
        self.emit(self.WAIT_LIST_UPDATE, data.p);
        break;

        case self.EARN:
        self.state.self.xp = data.p.xp;
        self.state.self.ep = data.p.ep;
        self.emit(self.EARN, data.p);
        break;

        case self.GRAB:
        self.emit(self.GRAB_UPDATE, data.p);
        break;

        case self.MOD_BAN:
        self.emit(self.MOD_BAN, data.p);
        break;

        case self.MOD_MOVE_DJ:
        self.emit(self.MOD_MOVE_DJ, data.p);
        break;

        case self.MOD_MUTE:
        self.emit(self.MOD_MUTE, data.p);
        break;

        case self.MOD_STAFF:
        self.emit(self.MOD_STAFF, null);
        break;

        case self.MOD_SKIP:
        self.emit(self.MOD_SKIP, data.p);
        break;

        case self.ROOM_NAME_UPDATE:
        self.state.room.name = data.p.n;
        self.emit(self.ROOM_NAME_UPDATE, data.p.n, data.p.u);
        break;

        case self.ROOM_DESCRIPTION_UPDATE:
        self.state.room.description = data.p.d;
        self.emit(self.ROOM_DESCRIPTION_UPDATE, data.p.d, data.p.u);
        break;

        case self.ROOM_WELCOME_UPDATE:
        self.state.room.welcome = data.p.w;
        self.emit(self.ROOM_WELCOME_UPDATE, data.p.w, data.p.u);
        break;

        case self.USER_LEAVE:
        self.emit(self.USER_LEAVE, data.p);
        break;

        case self.USER_JOIN:
        self.emit(self.USER_JOIN, data.p);
        break;

        case self.USER_UPDATE:
        self.emit(self.USER_UPDATE, data.p);
        break;

        case self.VOTE:
        self.emit(self.VOTE, data.p.v, data.p.u);
        break;
    }
};

PlugClient.prototype.keepAliveTimer = function() {
    clearTimeout(this.keepAliveID);

    this.keepAliveID = setTimeout(function(self) {
        self.log("haven't received a keep alive message from host for more than 80 seconds, trying to reconnect...", 1, "red");

        self.connectSocket(function(err) {
            if(err) {
                self.log("couldn't reconnect to websocket. Error: " + err, 1, "red");
                process.exit(1);
            } else {
                if(self.state.room.slug)
                    self.joinRoom(self.state.room.slug);
            }
        });
    }, 80*1000, this);
};

PlugClient.prototype.sendChat = function(message) {
    if(typeof message !== "string")
        message = message.toString();

    if(message.indexOf('"') >= 0)
        message = message.split('"').join("&#34;");

    if(message.indexOf("'") >= 0)
        message = message.split("'").join("&#39;");

    //this.log(["sending message: ", message].join(''), 3, "cyan");

    this.sock.sendMessage("chat", message, this.offset);
};

PlugClient.prototype.invokeLogger = function(log) {
    log = log || function(msg, verbosity) { if(verbosity <= 1) console.log(msg); };
    this.log = log;
};

PlugClient.prototype.login = function(credentials, callback) {
    if(typeof callback !== "function")
        throw new Error("callback has to be defined");

    if(typeof credentials !== "object")
        throw new Error("credentials has to be of type object");

    if(!credentials.hasOwnProperty("email") || !credentials.hasOwnProperty("password"))
        throw new Error("property email or password are not defined");

    this.credentials = credentials;

    this.log("logging in with account: " + credentials.email, 2, "yellow");

    //0 indicating the amount of tries
    loginClient(this, 0, callback);
};

PlugClient.prototype.connect = function(room, callback) {
    if(!room)
        throw new Error("room has to be defined");

    if(typeof callback !== "function")
        throw new Error("callback has to be declared");

    this.joinRoom(room, function(err) {
        if(!err) {
            this.getRoomStats(function(err, stats) {

                if(!err) {
                    //console.log(stats);
                    this.state.room = models.parseRoom(stats);
                    callback(null, this.state);
                } else {
                    callback(err);
                }

            }.bind(this));

        } else {
            callback(err);
        }
    }.bind(this));
};

/*================ ROOM CALLS ================*/

PlugClient.prototype.getNews = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["NEWS"], callback);
};

PlugClient.prototype.getAuthToken = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["TOKEN"], callback);
};

PlugClient.prototype.getRoomStats = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["ROOMSTATS"], callback);
};

PlugClient.prototype.findRooms = function(name, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", [endpoints["ROOMS"], "?q=", name, "&page=0&limit=100"].join(''), callback);
};

PlugClient.prototype.getRooms = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["ROOMS"] + "?q=&page=0&limit=100", callback);
};

PlugClient.prototype.getStaff = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["STAFF"], callback);
};

PlugClient.prototype.getUser = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["USERSTATS"] + '/' + userID, callback);
};

PlugClient.prototype.getRoomHistory = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["HISTORY"], callback);
};

PlugClient.prototype.validateRoomName = function(name, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["VALIDATEROOM"] + name, callback);
};

PlugClient.prototype.getMutes = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["MUTES"], callback);
};

// here's some work needed to set the data properly
PlugClient.prototype.setLock = function(lock, removeAllDJs, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["LOCK"], { 
        isLocked: lock, 
        removeAllDJs: removeAllDJs 
    }, callback);
};

PlugClient.prototype.setCycle = function(shouldCycle, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["CYCLE"], { shouldCycle: shouldCycle }, callback);
};

PlugClient.prototype.setLogin = function(csrf, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["LOGIN"], {
        "csrf": csrf,
        "email": this.credentials.email,
        "password": this.credentials.password
    }, callback);
};

PlugClient.prototype.joinRoom = function(slug, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["JOINROOM"], { slug: slug }, callback);
};

PlugClient.prototype.joinWaitlist = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["JOINBOOTH"], callback);
};

PlugClient.prototype.addToWaitlist = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["ADDBOOTH"], { id: userID }, callback);
};

PlugClient.prototype.skipDJ = function(userID, historyID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);

    if(userID === this.state.self.id)
        this.query.query("POST", endpoints["SKIPBOOTH"] + "/me", callback);
    else
        this.query.query("POST", endpoints["SKIPBOOTH"], { 
            userID: userID, 
            historyID: historyID 
        }, callback);
};

PlugClient.prototype.moveDJ = function(userID, position, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["MOVEBOOTH"], {
        userID: userID,
        position: position
    }, callback);
};

PlugClient.prototype.createRoom = function(name, private, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["CREATEROOM"], { 
        name: name, 
        private: private 
    }, callback);
};

PlugClient.prototype.updateRoomInfo = function(name, description, welcome, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["UPDATEROOM"], { 
        name: name, 
        description: description, 
        welcome: welcome 
    }, callback);
};

PlugClient.prototype.banUser = function(userID, time, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["BANS"] + "/add", { 
        userID: userID, 
        reason: 1,
        duration: time
    }, callback);
};

PlugClient.prototype.muteUser = function(userID, time, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["MUTES"], { 
        userID: userID, 
        reason: 1,
        duration: time
    }, callback);
};

PlugClient.prototype.addStaff = function(userID, role, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["STAFF"] + "/update", { 
        userID: userID, 
        roleID: role 
    }, callback);
};

PlugClient.prototype.ignoreUser = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["IGNORES"], { id: userID }, callback);
};

PlugClient.prototype.deletePlaylist = function(playlistID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["PLAYLISTS"] + '/' + playlistID, callback);
};

PlugClient.prototype.removeDJ = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("DELETE", endpoints["REMOVEBOOTH"] + '/' + userID, callback);
};

PlugClient.prototype.unbanUser = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("DELETE", endpoints["BANS"] + '/' + userID, callback);
};

PlugClient.prototype.deleteMessage = function(chatID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("DELETE", endpoints["CHAT"] + chatID, callback);
};

PlugClient.prototype.logout = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);

    this.query.query("DELETE", endpoints["SESSION"], function(err, body) {
        if(!err) {
            this.log("Logged out.", 1, "green");
            this.auth = null;
            this.offset = 0;

            callback(null);
        } else {
            callback(err);
        }
    }.bind(this));
};

/*================ USER CALLS ================*/

PlugClient.prototype.getSelf = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["USERSTATS"] + "/me", callback);
};

PlugClient.prototype.getMyHistory = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["USERHISTORY"], callback);
};

PlugClient.prototype.getFriends = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["FRIENDS"], callback);
};

PlugClient.prototype.getFriendInvites = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["INVITES"], callback);
};

PlugClient.prototype.searchMediaPlaylist = function(name, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["PLAYLISTS"] + "/media?q=" + name, callback);
};

PlugClient.prototype.getPlaylist = function(id, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", [endpoints["PLAYLISTS"], '/', id, "/media"].join(''), callback);
};

PlugClient.prototype.getHistory = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["USERHISTORY"], callback);
};

PlugClient.prototype.getIgnores = function(callback) {
    callback.bind(this);
    this.query.query("GET", endpoints["IGNORES"], callback);
};

PlugClient.prototype.getFavoriteRooms = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["FAVORITEROOM"], callback);
};

PlugClient.prototype.getCSRF = function(callback) {
    callback.bind(this);

    this.query.query("GET", endpoints["CSRF"], function(err, body) {
        if(!err) {
            var idx = body.indexOf("_csrf") + 9;

            body = body.substr(idx, body.indexOf('\"', idx) - idx);

            if(body.length == 60) {
                this.log("CSRF token: " + body, 2, "yellow");
                callback(null, body);
            } else {
                callback(setErrorMessage(200, "CSRF token was not found"));
            }

        } else {
            callback(err);
        }
    }.bind(this));
};

PlugClient.prototype.setProfileMessage = function(message, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["BLURB"], { blurb: message }, callback);
};

PlugClient.prototype.setAvatar = function(avatarID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["AVATAR"], { id: avatarID }, callback);
};

PlugClient.prototype.setStatus = function(status, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["STATUS"], { status: status }, callback);
};

PlugClient.prototype.setLanguage = function(language, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["LANGUAGE"], { language: language }, callback);
};

PlugClient.prototype.rejectFriendRequest = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["IGNOREFRIEND"], { id: userID }, callback);
};

PlugClient.prototype.activatePlaylist = function(playlistID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["PLAYLISTS"] + '/' + playlistID + "/activate", callback);
};

PlugClient.prototype.moveMedia = function(playlistID, mediaArray, beforeID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", 
        endpoints["PLAYLISTS"] + '/' + playlistID + "/media/move", 
        { ids: mediaArray, beforeID: beforeID }, callback);
};

PlugClient.prototype.updateMedia = function(playlistID, mediaID, author, title, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT",
        endpoints["PLAYLISTS"] + '/' + playlistID + "/media/update",
        { id: mediaID, author: author, title: title }, callback);
};

PlugClient.prototype.shufflePlaylist = function(playlistID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("PUT", endpoints["PLAYLISTS"] + '/' + playlistID + "/shuffle", callback);
};

PlugClient.prototype.addFriend = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["FRIENDS"], { id: userID }, callback);
};

PlugClient.prototype.deleteMedia = function(playlistID, mediaIDs, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST",
        endpoints["PLAYLISTS"] + '/' + playlistID + "/media/delete",
        { ids: mediaIDs },
        callback);
};

PlugClient.prototype.insertMedia = function(playlistID, mediaIDs, append, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST",
        endpoints["PLAYLISTS"] + '/' + playlistID + "/media/insert",
        { ids: mediaIDs, append: append },
        callback);
};

PlugClient.prototype.woot = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["VOTES"], { 
        direction: 1, 
        historyID: this.state.booth.historyID 
    }, callback);
};

PlugClient.prototype.meh = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["VOTES"], { 
        direction: -1,
        historyID: this.state.booth.historyID
    }, callback);
};

PlugClient.prototype.favoriteRoom = function(roomID) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["FAVORITEROOM"], { id: roomID }, callback);
};

PlugClient.prototype.deleteNotification = function(id, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("DELETE", endpoints["NOTIFICATION"] + id, callback);
};

PlugClient.prototype.removeFriend = function(userID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("DELETE", endpoints["FRIENDS"] + '/' + userID, callback);
};

/*================ STORE CALLS ================*/

PlugClient.prototype.getInventory = function(callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["INVENTORY"], callback);
};

PlugClient.prototype.getProducts = function(category, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["PRODUCTS"] + "/avatars/" + category, callback);
};

PlugClient.prototype.getPlaylists = function(playlistID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("GET", endpoints["PLAYLISTS"] + '/' + playlistID, callback);
};

PlugClient.prototype.purchaseItem = function(itemID, callback) {
    callback = (typeof callback !== "undefined" ? callback.bind(this) : undefined);
    this.query.query("POST", endpoints["PURCHASE"], { id: itemID }, callback);
};

module.exports = PlugClient;