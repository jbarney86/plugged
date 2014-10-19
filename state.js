var parseUser = function(data) {
    data = data || {};

    return {
        username: data.username || undefined,
        avatarID: data.avatarID || "default01",
        language: data.language || "en",
        blurb: data.blurb || "",
        slug: data.slug || undefined,
        notifications: data.notification || [],
        ignores: data.ignores || [],
        status: data.status || 0,
        joined: data.joined || 0,
        level: data.level || 0,
        gRole: data.gRole || 0,
        role: data.role || 0,
        grab: data.grab || 0,
        vote: data.vote || 0,
        ep: data.ep || 0,
        xp: data.xp || 0,
        id: data.id || -1
    };
}

var parseBannedUser = function(data) {
    data = data || {};

    return {
        timestamp: data.timestamp || 0,
        username: data.username || "",
        moderator: data.moderator || "",
        duration: data.duration || '',
        id: data.id || -1
    };
}

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
}

var parseMutedUser = function(data) {
    data = data || {};

    return {
        moderator: data.moderator || "",
        username: data.username || "",
        expires: data.expires || 0,
        id: data.id || 0
    };
}

var parseRoom = function(data) {
    data = data || {};

    return {
        description: data.description || "",
        hostName: data.hostName || "",
        welcome: data.welcome || "",
        name: data.name || "",
        slug: data.slug || "",
        favorite: data.favorite || "",
        hostID: data.hostID || -1,
        id: data.id || -1,
        cycle: data.cycle || true,
        locked: data.locked || false,
        waitlist: data.waitlist || [],
        mutes: data.mutes || [],
        bans: data.bans || []
    };
}

var parseBooth = function(data) {
    data = data || {};

    return {
        media: parseMedia(data.m),
        historyID: data.h || "",
        playlistID: data.p || -1,
        timestamp: data.t || -1,
        dj: data.c || -1
    };
};

var parseChat = function(data) {
    data = data || {};

    return {
        message: data.message,
        username: data.un,
        type: data.type,
        uid: data.uid,
        cid: data.cid
    };
};

var parseChatDelete = function(data) {
    data = data || {};

    return {
        cid: data.c,
        uid: data.u
    };
};

var parseModMove = function(data) {
    data = data || {};

    return {
        username: data.p
    }
}

var createState = function(data) {
    data = data || {};

    return {
        credentials: data.credentials || {},
        self: parseUser(data.self),
        room: parseRoom(data.room),
        booth: parseBooth(data.booth),
        users: data.users || [],
        usercache: data.usercache || []
    };
};

exports.parseChat = parseChat;
exports.parseUser = parseUser;
exports.parseRoom = parseRoom;
exports.parseMedia = parseMedia;
exports.parseBooth = parseBooth;
exports.createState = createState;
exports.parseMutedUser = parseMutedUser;
exports.parseBannedUser = parseBannedUser;
exports.parseChatDelete = parseChatDelete;