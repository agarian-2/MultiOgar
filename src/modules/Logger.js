"use strict";
const fs = require("fs");
const util = require("util");
const EOL = require("os").EOL;
const LogLevelEnum = require("../enum/LogLevelEnum");
const logFolder = "./logs";
const logBackupFolder = "./logs/LogBackup";
const logFileName = "ServerLog";
//const colorBlack = "[30m";
const colorRed = "[31m";
//const colorGreen = "[32m";
const colorYellow = "[33m";
//const colorBlue = "[34m";
//const colorMagenta = "[35m";
//const colorCyan = "[36m";
const colorWhite = "[37m";
const colorBright = "[1m";
let consoleLog = null,
    logVerbosity = LogLevelEnum.DEBUG,
    logFileVerbosity = LogLevelEnum.DEBUG,
    writeErr = false,
    writeCounter = false,
    writeShutdown = false,
    writeStarted = false,
    writeQueue = [];
const debug = message => {
    writeCon(colorWhite, LogLevelEnum.DEBUG, message);
    writeLog(LogLevelEnum.DEBUG, message);
};
const info = message => {
    writeCon(colorWhite + colorBright, LogLevelEnum.INFO, message);
    writeLog(LogLevelEnum.INFO, message);
};
const warn = message => {
    writeCon(colorYellow + colorBright, LogLevelEnum.WARN, message);
    writeLog(LogLevelEnum.WARN, message);
};
const error = message => {
    writeCon(colorRed + colorBright, LogLevelEnum.ERROR, message);
    writeLog(LogLevelEnum.ERROR, message);
};
const fatal = message => {
    writeCon(colorRed + colorBright, LogLevelEnum.FATAL, message);
    writeLog(LogLevelEnum.FATAL, message);
};
const print = message => {
    writeCon(colorWhite, LogLevelEnum.NONE, message);
    writeLog(LogLevelEnum.NONE, message);
};
const write = message => {
    writeLog(LogLevelEnum.NONE, message);
};
const writeDebug = message => {
    writeLog(LogLevelEnum.DEBUG, message);
};
const writeError = message => {
    writeLog(LogLevelEnum.ERROR, message);
};
const getDateString = () => {
    let date = new Date(),
        dy = date.getFullYear(),
        dm = date.getMonth() + 1,
        dd = date.getDate(),
        th = date.getHours(),
        tm = date.getMinutes(),
        ts = date.getSeconds(),
        tz = date.getMilliseconds();
    dy = ("0000" + dy).slice(-4);
    dm = ("00" + dm).slice(-2);
    dd = ("00" + dd).slice(-2);
    th = ("00" + th).slice(-2);
    tm = ("00" + tm).slice(-2);
    ts = ("00" + ts).slice(-2);
    tz = ("000" + tz).slice(-3);
    return dy + "-" + dm + "-" + dd + "T" + th + "-" + tm + "-" + ts + "-" + tz;
};
const getTimeString = () => {
    let date = new Date(),
        th = date.getHours(),
        tm = date.getMinutes(),
        ts = date.getSeconds();
    th = ("00" + th).slice(-2);
    tm = ("00" + tm).slice(-2);
    ts = ("00" + ts).slice(-2);
    return th + ":" + tm + ":" + ts;
};
const writeCon = (color, level, message) => {
    if (level > logVerbosity) return;
    message = util.format(message);
    let prefix = "";
    if (level === LogLevelEnum.DEBUG) prefix = "[DEBUG] ";
    else if (level === LogLevelEnum.INFO) prefix = "[INFO] ";
    else if (level === LogLevelEnum.WARN) prefix = "[WARN] ";
    else if (level === LogLevelEnum.ERROR) prefix = "[ERROR] ";
    else if (level === LogLevelEnum.FATAL) prefix = "[FATAL] ";
    process.stdout.write(color + prefix + message + "\u001B[0m" + EOL);
};
const writeLog = (level, message) => {
    if (level > logFileVerbosity || writeErr) return;
    message = util.format(message);
    let prefix = "";
    if (level === LogLevelEnum.DEBUG) prefix = "[DEBUG]";
    else if (level === LogLevelEnum.INFO) prefix = "[INFO]";
    else if (level === LogLevelEnum.WARN) prefix = "[WARN]";
    else if (level === LogLevelEnum.ERROR) prefix = "[ERROR]";
    else if (level === LogLevelEnum.FATAL) prefix = "[FATAL]";
    else if (level === LogLevelEnum.NONE) prefix = "[NONE]";
    prefix += "[" + getTimeString() + "] ";
    writeQueue.push(prefix + message + EOL);
    if (writeShutdown) flushSync();
    else if (writeCounter === 0) flushAsync();
};
const flushAsync = () => {
    if (writeShutdown || consoleLog == null || writeQueue.length === 0) return;
    writeCounter++;
    consoleLog.write(writeQueue.shift(), () => {
        writeCounter--;
        flushAsync();
    });
};
const flushSync = () => {
    try {
        let tail = "";
        while (writeQueue.length > 0) tail += writeQueue.shift();
        let fileName = logFolder + "/" + logFileName + ".log";
        fs.appendFileSync(fileName, tail);
    } catch (error) {
        writeErr = true;
        writeCon(colorRed + colorBright, LogLevelEnum.ERROR, error.message);
        writeCon(colorRed + colorBright, LogLevelEnum.ERROR, "Failed to append log file!");
    }
};
const start = () => {
    if (writeStarted) return;
    writeStarted = true;
    try {
        console.log = message => {
            print(message);
        };
        let timeString = getDateString(),
            fileName = logFolder + "/" + logFileName + ".log",
            fileName2 = logBackupFolder + "/" + logFileName + "-" + timeString + ".log";
        if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);
        else if (fs.existsSync(fileName)) {
            if (!fs.existsSync(logBackupFolder)) fs.mkdirSync(logBackupFolder);
            fs.renameSync(fileName, fileName2);
        }
        fs.writeFileSync(fileName, "=== Started " + timeString + " ===" + EOL);
        let file = fs.createWriteStream(fileName, {flags: "a"});
        file.on("open", () => {
            if (writeShutdown) return file.close();
            consoleLog = file;
            flushAsync();
        });
        file.on("error", error => {
            writeErr = true;
            consoleLog = null;
            writeCon(colorRed + colorBright, LogLevelEnum.ERROR, error.message);
        });
    } catch (error) {
        writeErr = true;
        consoleLog = null;
        writeCon(colorRed + colorBright, LogLevelEnum.ERROR, error.message);
    }
};
const shutdown = () => {
    writeShutdown = true;
    if (writeErr) return;
    if (consoleLog != null) {
        consoleLog.end();
        consoleLog.close();
        consoleLog.destroy();
        consoleLog = null;
    }
    writeQueue.push("=== Shutdown " + getDateString() + " ===" + EOL);
    flushSync();
};

module.exports.debug = debug;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;
module.exports.fatal = fatal;
module.exports.print = print;
module.exports.write = write;
module.exports.writeDebug = writeDebug;
module.exports.writeError = writeError;
module.exports.start = start;
module.exports.shutdown = shutdown;
module.exports.setVerbosity = level => {
    logVerbosity = level;
};
module.exports.setFileVerbosity = level => {
    logFileVerbosity = level;
};
module.exports.getVerbosity = () => logVerbosity;
module.exports.getFileVerbosity = () => logFileVerbosity;
