var parseSelf = function(data) {
    data = data || {};

    return {
        username: data.username || undefined,
        avatarID: data.avatarID || "default01",
        language: data.language || "en",
        blurb: data.blurb || "",
        slug: data.slug || "",
        notifications: data.notification || [],
        ignores: data.ignores || [],
        status: data.status || 0,
        joined: data.joined || 0,
        level: data.level || 0,
        gRole: data.gRole || 0,
        badge: data.badge || 0,
        role: data.role || 0,
        grab: data.grab || 0,
        vote: data.vote || 0,
        ep: data.ep || 0,
        xp: data.xp || 0,
        id: data.id || -1
    };
};

var parseUser = function(data) {
    data = data || {};

    return {
        username: data.username || undefined,
        avatarID: data.avatarID || "base01",
        blurb: data.blurb || undefined,
        slug: data.slug || undefined,
        status: data.status || 0,
        joined: data.joined || 0,
        level: data.level || 0,
        gRole: data.gRole || 0,                 //global role
        badge: data.badge || 0,                 //long time users got a badge
        role: data.role || 0,
        grab: data.grab || 0,                   //grabbed current song
        id: data.id || -1,
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

var pushMute = function(mute) {
    mute = mute || {};

    return {
        id: mute.i || -1,
        time: mute.d || 's'
    };
};

var parseMute = function(data) {
    data = data || {};

    return {
        username: data.t || "",      //name of the user
        id: data.i || -1,                  //user ID
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

var parseRemoveDJ = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        username: data.t || "",
        isCurrentlyPlaying: data.d || false
    };
};

var parseModMove = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        username: data.u || "",
        oldIndex: data.o || 0,
        newIndex: data.n || 0
    };
}

var parsePlayback = function(data) {
    data = data || {};

    return {
        media: parseMedia(data.media),
        historyID: data.historyID || "",
        playlistID: data.playlistID || -1,
        startTime: data.startTime || 0
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
        id: vote.i,
        direction: vote.v
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
        slug: data.slug || "",
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

var parseBan = function(data) {
    data = data || {};

    return {
        moderator: data.m || "",
        username: data.t || "",
        id: data.u || -1,
        duration: data.d || 'h'
    }
}

/*var parsePromotion = function(data) {
    data = data || {};
    var obj = {
        users: [],
        moderator: data.m
    };

    for(var i = 0; i < data.u.length; i++) {
        obj.users.push({
            username: data.u[i].n,
            id: data.u[i].i,
            role: data.u[i].r
        });
    }

    return obj;
};*/

var parsePromotion = function(data) {
    data = data || {};

    if(data.hasOwnProperty('u') && data.u.length === 1) {
        return {
            moderator: data.m,
            username: data.u[0].n,
            id: data.u[0].i,
            role: data.u[0].p
        };
    }

    return {};
};

var parseChat = function(data) {
    data = data || {};

    return {
        message: data.message || "",
        username: data.un || "",
        type: data.type || "message", //type of message (always "message")
        uid: data.uid || -1,          //user ID
        cid: data.cid || -1           //chat ID
    };
};

var parseChatDelete = function(data) {
    data = data || {};

    return {
        uid: data.u,        //ID of mod that issued the deletion
        cid: data.c         //chat ID
    };
};

var createState = function(data) {
    data = data || {};

    return {
        credentials: data.credentials || {},
        self: parseSelf(data.self),
        room: parseRoom(data.room),
        usercache: data.usercache || []
    };
};

exports.parseBan = parseBan;
exports.pushVote = pushVote;
exports.pushMute = pushMute;
exports.parseChat = parseChat;
exports.parseSelf = parseSelf;
exports.parseUser = parseUser;
exports.parseRoom = parseRoom;
exports.parseMeta = parseMeta;
exports.parseMute = parseMute;
exports.parseMutes = parseMutes;
exports.parseGrabs = parseGrabs;
exports.parseMedia = parseMedia;
exports.parseVotes = parseVotes;
exports.parseBooth = parseBooth;
exports.createState = createState;
exports.parseModMove = parseModMove;
exports.parseRemoveDJ = parseRemoveDJ;
exports.parsePlayback = parsePlayback;
exports.parsePromotion = parsePromotion;
exports.parseChatDelete = parseChatDelete;