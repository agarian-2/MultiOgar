'use strict';
function FakeSocket(server) {
    this.server = server;
    this.isCloseReq = 0;
}

module.exports = FakeSocket;

FakeSocket.prototype.sendPacket = function() {};

FakeSocket.prototype.close = function() {
    this.isCloseReq = 1;
};