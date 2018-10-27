'use strict';
const http = require('http');
const https = require('https');
const inherits = require('util').inherits;
const httpSocketHandler = http._connectionListener;
const Logger = require('./modules/Logger');
const isOldNode = /^v0\.10\./.test(process.version);

function Server(tlsconfig, requestListener) {
    if (!(this instanceof Server)) return new Server(tlsconfig, requestListener);
    if (typeof tlsconfig === 'function') {
        requestListener = tlsconfig;
        tlsconfig = undefined;
    }
    if (typeof tlsconfig === 'object') {
        this.removeAllListeners('connection');
        https.Server.call(this, tlsconfig, requestListener);
        var event = this._events.connection;
        if (typeof connev === 'function') this._tlsHandler = event;
        else this._tlsHandler = event[event.length - 1];
        this.removeListener('connection', this._tlsHandler);
        this._connListener = connectionListener;
        this.on('connection', connectionListener);
        this.timeout = 2 * 60 * 1000;
        this.allowHalfOpen = 0;
        this.httpAllowHalfOpen = 0;
    } else http.Server.call(this, requestListener);
}
inherits(Server, https.Server);

Server.prototype.setTimeout = function (msecs, callback) {
    this.timeout = msecs;
    if (callback) this.on('timeout', callback);
};

Server.prototype.__httpSocketHandler = httpSocketHandler;

var connectionListener;
if (isOldNode) {
    connectionListener = function (socket) {
        var logip = socket.remoteAddress + ":" + socket.remotePort;
        socket.on('error', function (err) {
            Logger.writeError("[" + logip + "] " + err.stack);
        });
        var self = this;
        socket.ondata = function (d, start, end) {
            var firstByte = d[start];
            if (firstByte < 32 || firstByte >= 127) {
                socket.ondata = null;
                self._tlsHandler(socket);
                socket.push(d.slice(start, end));
            } else {
                self.__httpSocketHandler(socket);
                socket.ondata(d, start, end);
            }
        };
    };
} else {
    connectionListener = function (socket) {
        var logip = socket.remoteAddress + ":" + socket.remotePort;
        socket.on('error', function (err) {
            Logger.writeError("[" + logip + "] " + err.stack);
        });
        var self = this;
        var data = socket.read(1);
        if (data === null) {
            socket.once('readable', function () {
                self._connListener(socket);
            });
        } else {
            var firstByte = data[0];
            socket.unshift(data);
            if (firstByte < 32 || firstByte >= 127) {
                this._tlsHandler(socket);
            } else this.__httpSocketHandler(socket);
        }
    };
}

exports.Server = Server;

exports.createServer = function (tlsconfig, requestListener) {
    return new Server(tlsconfig, requestListener);
};