var request = require("request");
var verbs = ["GET", "POST", "PUT", "DELETE"];

function processEntry(query, entry, flush) {
    flush = flush || false;

    request(entry.options, function requestCB(err, res, body) {
        query.active--;

        if(body.hasOwnProperty("data"))
            body = body.data;

        if(!err && res.statusCode == 200) {
            entry.options = {};
            entry.callback(null, body);
        } else {

            if(!flush && ((res ? res.statusCode : 0) >= 500 && entry.tries < 2)) {
                entry.tries++;
                setTimeout(pushAndProcess, 5*1000, query, entry)
            } else {
                entry.options = {};
                entry.callback({ code: (res ? res.statusCode : 0), message: null });
            }

        }

    });
}

function pushAndProcess(query, entry) {
    query.push(entry);
    query.process();
}

function watcher(query) {
    if(query.queue.length === 0)
        query.stopWatcher();

    for(var i = 0; i < Math.min(5, query.queue.length); i++)
        query.process();
}

function Query(jar) {
    this.jar = (typeof jar === "undefined" ? request.jar() : jar);
    this.queue = [];
    this.active = 0;
    this.watcherID = 0;
    this.startWatcher();
}

Query.prototype.query = function(verb, url, data, callback, flush) {
    flush = flush || false;

    //reorganize arguments since data is optional
    if(typeof data === "function") {
        if(typeof callback === "boolean")
            flush = callback;
        callback = data;
        data = {};
    }

    if(!verb || verbs.indexOf(verb.toUpperCase()) < 0)
        throw new Error("verb was not defined or invalid");
    if(!url || typeof url !== "string")
        throw new Error("url was not defined or not of type string");
    if(typeof callback !== "function")
        throw new Error("callback has to be defined and of type function");

    var entry = {
        tries: 0,
        callback: callback,
        options: {
            url: url,
            method: verb,
            jar: this.jar,
            encoding: "utf8",
            body: data,
            json: true,
            headers: {
                "User-Agent": "PlugClient/1.0 (NODE)",
                "Content-Type": "application/json"
            }
        }
    };

    if(!flush) {
        this.queue.push(entry);
        this.process();
    } else {
        this.active++;
        processEntry(this, entry, true);
    }
};

Query.prototype.flushQueue = function() {
    this.queue = [];
};

Query.prototype.process = function() {
    if(this.queue.length > 0) {

        if(this.active <= 5) {
            clearTimeout(this.timeoutID);
            this.timeoutID = 0;
            this.active++;
            processEntry(this, this.queue.shift());
        } else if(this.watcherID === 0) {
            this.startWatcher();
        }

    }
};

Query.prototype.startWatcher = function() {
    if(this.watcherID > 0)
        this.stopWatcher();

    //otherwise plug flips its shit and tells us to stop flooding its API
    this.watcherID = setInterval(watcher, 5*1000, this);
};

Query.prototype.stopWatcher = function() {
    clearInterval(this.watcherID);
    this.watcherID = 0;
};

module.exports = Query;