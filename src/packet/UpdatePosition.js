'use strict';
const BinaryWriter = require("./BinaryWriter");

function UpdatePos(playerTracker, x, y, scale) {
    this.playerTracker = playerTracker,
    this.x = x;
    this.y = y;
    this.scale = scale;
}

module.exports = UpdatePos;

UpdatePos.prototype.build = function (protocol) {
    var writer = new BinaryWriter();
    writer.writeUInt8(0x11);
    writer.writeFloat(this.x + this.playerTracker.scramble.X);
    writer.writeFloat(this.y + this.playerTracker.scramble.Y);
    writer.writeFloat(this.scale);
    return writer.toBuffer();
};