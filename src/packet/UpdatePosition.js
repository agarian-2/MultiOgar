"use strict";
const BinaryWriter = require("./BinaryWriter");

class UpdatePosition {
    constructor(playerTracker, x, y, scale) {
        this.playerTracker = playerTracker,
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
    build() {
        let writer = new BinaryWriter();
        writer.writeUInt8(0x11);
        writer.writeFloat(this.x + this.playerTracker.scrambleX);
        writer.writeFloat(this.y + this.playerTracker.scrambleY);
        writer.writeFloat(this.scale);
        return writer.toBuffer();
    }
}

module.exports = UpdatePosition;
