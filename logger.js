function Logger() {
    this.level = 0;

    this.colors = {
        gray: "\x1b[0m",
        red: "\x1b[31;1m",
        blue: "\x1b[34;1m",
        cyan: "\x1b[36;1m",
        white: "\x1b[37;1m",
        green: "\x1b[32;1m",
        yellow: "\x1b[33;1m",
        magenta: "\x1b[35;1m"
    };

    this.write = function() {};
}

Logger.prototype.setVerbosity = function(verbosity) {
    this.level = verbosity;
};

Logger.prototype.setFile = function(file) {
    if(typeof file !== "undefined") {
        this.write = function(msg) {
            fs.appendFile(file, [new Date().toUTCString(), ": ", msg, '\n'].join(''),
                function(err) {
                    if(err) {
                        console.error([
                            "Couldn't save: ", msg,
                            " to file. Error: ", err
                            ]);
                    }
                });
        }
    } else {
        this.write = function() {};
    }
};

Logger.prototype.log = function(msg, verbosity, color) {
    verbosity = verbosity || 0;
    color = color || "gray";

    if(this.level >= verbosity) {
        this.write(msg);
        console.log([this.colors[color], msg, "\x1b[0m"].join(''));
    }
};

module.exports = Logger;