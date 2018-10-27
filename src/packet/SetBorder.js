'use strict';
function SetBorder(playerTracker, border, gameType, serverName) {
    this.playerTracker = playerTracker;
    this.border = border;
    this.gameType = gameType;
    this.serverName = serverName;
}

SetBorder.prototype.build = function (protocol) {
    var scrambleX = this.playerTracker.scramble.X;
    var scrambleY = this.playerTracker.scramble.Y;
    var b = this.border;
    if (this.gameType == null) {
        var buffer = new Buffer(33);
        buffer.writeUInt8(0x40, 0, 1);
        buffer.writeDoubleLE(b.minX + scrambleX, 1, 1);
        buffer.writeDoubleLE(b.minY + scrambleY, 9, 1);
        buffer.writeDoubleLE(b.maxX + scrambleX, 17, 1);
        buffer.writeDoubleLE(b.maxY + scrambleY, 25, 1);
        return buffer;
    }
    var BinaryWriter = require("./BinaryWriter");
    var writer = new BinaryWriter();
    writer.writeUInt8(0x40);
    writer.writeDouble(b.minX + scrambleX);
    writer.writeDouble(b.minY + scrambleY);
    writer.writeDouble(b.maxX + scrambleX);
    writer.writeDouble(b.maxY + scrambleY);
    writer.writeUInt32(this.gameType >> 0);
    var name = this.serverName;
    if (name == null) name = "";
    if (protocol < 6) writer.writeStringZeroUnicode(name);
    else writer.writeStringZeroUtf8(name);
    return writer.toBuffer();
};

module.exports = SetBorder;