"use strict";

class FakeSocket {
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.isCloseReq = false;
    }
    sendPacket() {}
    close() {
        this.isCloseReq = true;
    }
}

module.exports = FakeSocket;
