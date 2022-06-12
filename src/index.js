"use strict";
const Log = require("./modules/Logger");
const Commands = require("./modules/CommandList");
const GameServer = require("./GameServer");
const readline = require("readline");
const parseCommands = str => {
    Log.write(">" + str);
    if (str === "") return;
    let split = str.split(" ");
    if (Commands[split[0].toLowerCase()]) Commands[split[0].toLowerCase()](gameServer, split);
    else Log.warn("That is an invalid command.");
};
let in_;
const prompt = () => {
    in_.question(">", str => {
        try {
            parseCommands(str);
        } catch(error) {
            Log.error(error.stack);
        } finally {
            setTimeout(prompt, 0);
        }
    });
};
let showConsole = true;

Log.start();

process.on("exit", error => {
    Log.debug("process.exit(" + error + ")");
    Log.shutdown();
});
process.on("uncaughtException", error => {
    Log.fatal(error.stack);
    process.exit(1);
});
process.argv.forEach(val => {
    if (val === "--noconsole") showConsole = false;
    else if (val === "--help") {
        Log.print("Proper Usage: node index.js");
        Log.print("    --noconsole         Disables the console");
        Log.print("    --help              Help menu.");
        Log.print("");
    }
});

let gameServer = new GameServer();
Log.info("\u001B[1m\u001B[32mMultiOgar-Edited " + gameServer.version + "\u001B[37m - An open source multi-protocol ogar server!\u001B[0m");
gameServer.start();
if (showConsole) {
    in_ = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    setTimeout(prompt, 100);
}
