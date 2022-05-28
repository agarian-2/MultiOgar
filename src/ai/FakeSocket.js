function FakeSocket(server) {
    this.server = server;
    this.isCloseReq = false;
}

module.exports = FakeSocket;

FakeSocket.prototype.sendPacket = function() {};

FakeSocket.prototype.close = function() {
    this.isCloseReq = true;
};
