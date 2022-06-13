"use strict";
const BinaryWriter = require("./BinaryWriter");

class LeaderboardPosition {
    constructor(place) {
        this.place = place;
    }
    build() {
        let writer = new BinaryWriter();
        writer.writeUInt8(0x30);
        writer.writeUInt16(this.place);
        return writer.toBuffer();
    }
}

module.exports = LeaderboardPosition;
