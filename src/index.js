var Log = require("./modules/Logger"),
    Commands = require("./modules/CommandList"),
    GameServer = require("./GameServer"),
    showConsole = true;

function prompt() {
    in_.question(">", function (str) {
        try {
            parseCommands(str);
        } catch (error) {
            Log.error(error.stack);
        } finally {
            setTimeout(prompt, 0);
        }
    });
}

function parseCommands(str) {
    Log.write(">" + str);
    if (str === "") return;
    var split = str.split(" "),
        first = split[0].toLowerCase(),
        execute = Commands.list[first];
    if (typeof execute !== "undefined") execute(gameServer, split);
    else Log.warn("That is an invalid command.");
}

Log.start();
process.on("exit", function(error) {
    Log.debug("process.exit(" + error + ")");
    Log.shutdown();
});
process.on("uncaughtException", function(error) {
    Log.fatal(error.stack);
    process.exit(1);
});
process.argv.forEach(function (val) {
    if (val === "--noconsole") showConsole = false;
    else if (val === "--help") {
        Log.print("Proper Usage: node index.js");
        Log.print("    --noconsole         Disables the console");
        Log.print("    --help              Help menu.");
        Log.print("");
    }
});
var gameServer = new GameServer();
Log.info("\u001B[1m\u001B[32mMultiOgar-Edited " + gameServer.version + "\u001B[37m - An open source multi-protocol ogar server!\u001B[0m");
gameServer.start();
if (showConsole === true) {
    var readline = require("readline"),
        in_ = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    setTimeout(prompt, 100);
}
