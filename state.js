var util = require("util");

var PlugTimeRegex = /(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+).(\d+)/g;

var convertPlugTimeToDate = function(plugTime) {
    var res = PlugTimeRegex.exec(plugTime);
    var time = "";

    if(res === null)
        return;

    for(var i = res.length - 1; i >= 0; i--) {
        //clean array from unnecessary info
        if(isNaN(res[i]) && !isFinite(res[i]))
            res.splice(i, 1);
    }

    if(res.length === 3) {
        res.unshift("%d-%d-%d");
        time = util.format.apply(util, res);
    } else if(res.length === 6) {
        res.unshift("%d-%d-%d %d:%d:%dZ");
        time = util.format.apply(util, res);
    } else if(res.length === 7) {
        res.unshift("%d-%d-%d %d:%d:%d.%dZ");
        time = util.format.apply(util, res);
    }

    return time;
}

var parseSelf = function(data) {
    data = data || {};

    return {
        joined: convertPlugTimeToDate(data.joined),
        username: data.username || "",
        avatarID: data.avatarID || "base01",
        language: data.language || "en",
        blurb: data.blurb || "",
        slug: data.slug || "",
        notifications: data.notification || [],
        ignores: data.ignores || [],
        friends: data.friends || [],
        level: data.level || 0,
        gRole: data.gRole || 0,
        badge: data.badge || 0,
        role: data.role || 0,
        vote: data.vote || 0,
        sub: data.sub || 0,
        ep: data.ep || 0,
        xp: data.xp || 0,
        id: data.id || -1
    };
};

var parseUser = function(data) {
    data = data || {};

    return {
        joined: convertPlugTimeToDate(data.joined),
        username: data.username || "",
        avatarID: data.avatarID || "base01",
        language: data.language || "en",
        blurb: data.blurb || "",
        slug: data.slug || "",
        level: data.level || 0,
        gRole: data.gRole || 0,                 //global role
        badge: data.badge || "",                //long time users got a badge
        role: data.role || 0,
        sub: data.sub || 0,
        id: data.id || -1
    };
};

var parseUserUpdate = function(data) {
    data = data || {};

    return {
        id: data.i || -1,
        level: data.level || undefined,
        avatarID: data.avatarID || undefined,
        username: data.username || undefined
    };
};

var parseMedia = function(data) {
    data = data || {};

    return {
        author: data.author || "",
        title: data.title || "",
        image: data.image || "",
        cid: data.cid || "",
        duration: data.duration || 0,
        format: data.format || 1,         //most media played on plug originates from youtube.
        id: data.id || -1
    }
};

var parseMutes = function(data) {
    data = data || {};
    var arr = [];

    for(var key in data) {
        arr.push({
            id: key,
            time: data[key]
        });
    }

    return arr;
};

var parseMute = function(data) {
    data = data || {};

    return {
        username: data.t || "",      //name of the user
        id: data.i || -1,            //user ID
        moderator: data.m || "",
        duration: data.d || 's',
        reason: data.r || 1
    };
};

var parseGrabs = function(data) {
    data = data || {};
    var arr = [];

    for(var key in data)
        arr.push(key);

    return arr;
};

var parseModAddDJ = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        moderatorID: data.mi || -1,
        username: data.t || ""
    };
};

var parseModMove = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        moderatorID: data.mi || -1,
        username: data.u || "",
        oldIndex: data.o || 0,
        newIndex: data.n || 0
    };
};

var parsePlayback = function(data) {
    data = data || {};

    return {
        media: parseMedia(data.media),
        historyID: data.historyID || "",
        playlistID: data.playlistID || -1,
        startTime: convertPlugTimeToDate(data.startTime)
    };
};

var parseVotes = function(data) {
    data = data || {};
    var arr = [];

    for(var key in data) {
        arr.push({
            id: key,
            direction: data[key]
        });
    }

    return arr;
};

var pushVote = function(vote) {
    return {
        id: vote.i || -1,
        direction: vote.v || 1
    };
};

var parseExtendedRoom = function(data) {
    data = data || {};

    return {
        cid: data.cid || "",
        dj: data.dj,
        favorite: data.favorite || false,
        format: data.format || 1,
        host: data.host || "",
        id: data.id || -1,
        image: data.image || "",
        media: data.media || "",
        name: data.name || "",
        population: data.population || 0,
        private: data.private || false,
        slug: data.slug || ""
    };
};

var parseRoom = function(data) {
    data = data || {};

    return {
        booth: parseBooth(data.booth),
        fx: data.fx || [],
        grabs: parseGrabs(data.grabs),
        meta: parseMeta(data.meta),
        mutes: parseMutes(data.mutes),
        playback: parsePlayback(data.playback),
        minChatLevel: data.minChatLevel || 0,
        role: data.role || 0,
        users: data.users || [],
        votes: parseVotes(data.votes)
    };
};

var parseMeta = function(data) {
    data = data || {};

    return {
        description: data.description || "",
        favorite: data.favorite || false,
        hostID: data.hostID || -1,
        hostName: data.hostName || "",
        id: data.id || -1,
        name: data.name || "",
        population: data.population || 0,
        slug: data.slug || undefined,
        welcome: data.welcome || ""
    };
};

var parseBooth = function(data) {
    data = data || {};

    return {
        dj: data.currentDJ || -1,               //id of the active DJ
        isLocked: data.isLocked || false,       //is waitlist locked?
        shouldCycle: data.shouldCycle || true,  //should it cycle?
        waitlist: data.waitingDJs || []         //array of IDs
    };
};

var parseModBan = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        moderatorID: data.mi || -1,
        username: data.t || "",
        duration: data.d || 'h'
    };
};

var parseModRemove = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        moderatorID: data.mi || -1,
        username: data.t || "",
        wasPlaying: data.d || false
    };
};

var parseBan = function(data) {
    data = data || {};

    return {
        reason: data.r || undefined,
        duration: data.l || undefined
    };
};

var parseCycle = function(data) {
    data = data || {};

    return {
        shouldCycle: data.f || false,
        moderator: data.m || "",
        moderatorID: data.mi || -1
    };
};

var parseLock = function(data) {
    data = data || {};

    return {
        clearWaitlist: data.c || false,
        isLocked: data.f || false,
        moderator: data.m || "",
        moderatorID: data.mi || -1
    };
};

var parsePromotion = function(data) {
    data = data || {};

    if(data.hasOwnProperty('u') && data.u.length === 1) {
        return {
            moderator: data.m || "",
            moderatorID: data.mi || -1,
            username: data.u[0].n || "",
            id: data.u[0].i || -1,
            role: data.u[0].p || 0
        };
    }

    return {};
};

var parseXP = function(data) {
    data = data || {};

    return {
        xp: data.xp || 0,
        ep: data.ep || 0,
        level: data.level || -1
    };
};

var parseChat = function(data) {
    data = data || {};

    return {
        message: data.message || "",
        username: data.un || "",
        id: data.uid || -1,         //user ID
        cid: data.cid || -1,        //chat ID
        sub: data.sub || 0          //subscription identification
    };
};

var parseChatDelete = function(data) {
    data = data || {};

    return {
        moderatorID: data.mi || -1,     //ID of mod that issued the deletion
        cid: data.c || -1               //chat ID
    };
};

var createState = function(data) {
    data = data || {};

    return {
        credentials: data.credentials || {},
        self: parseSelf(data.self),
        room: parseRoom(data.room),
        usercache: data.usercache || [],
        chatcache: data.chatcache || []
    };
};

var parseRoomNameUpdate = function(data) {
    data = data || {};

    return {
        name: data.n || "",
        moderatorID: data.u || -1
    };
};

var parseRoomDescriptionUpdate = function(data) {
    data = data || {};

    return {
        description: data.d || "",
        moderatorID: data.u || -1
    };
};

var parseRoomWelcomeUpdate = function(data) {
    data = data || {};

    return {
        welcome: data.w || "",
        moderatorID: data.u || -1
    };
};

exports.parseXP = parseXP;
exports.parseBan = parseBan;
exports.pushVote = pushVote;
exports.parseChat = parseChat;
exports.parseSelf = parseSelf;
exports.parseUser = parseUser;
exports.parseRoom = parseRoom;
exports.parseMeta = parseMeta;
exports.parseLock = parseLock;
exports.parseMute = parseMute;
exports.parseMutes = parseMutes;
exports.parseCycle = parseCycle;
exports.parseGrabs = parseGrabs;
exports.parseMedia = parseMedia;
exports.parseVotes = parseVotes;
exports.parseBooth = parseBooth;
exports.parseModBan = parseModBan;
exports.createState = createState;
exports.parseModMove = parseModMove;
exports.parseModAddDJ = parseModAddDJ;
exports.parsePlayback = parsePlayback;
exports.parsePromotion = parsePromotion;
exports.parseModRemove = parseModRemove;
exports.parseUserUpdate = parseUserUpdate;
exports.parseChatDelete = parseChatDelete;
exports.parseExtendedRoom = parseExtendedRoom;
exports.parseRoomNameUpdate = parseRoomNameUpdate;
exports.convertPlugTimeToDate = convertPlugTimeToDate;
exports.parseRoomWelcomeUpdate = parseRoomWelcomeUpdate;
exports.parseRoomDescriptionUpdate = parseRoomDescriptionUpdate;