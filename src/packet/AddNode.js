"use strict";

class AddNode {
    constructor(playerTracker, item) {
        this.playerTracker = playerTracker;
        this.item = item;
    }
    build() {
        let buffer = new Buffer(5);
        buffer.writeUInt8(0x20, 0, 1);
        buffer.writeUInt32LE((this.item.nodeID ^ this.playerTracker.scrambleID) >>> 0, 1, 1);
        return buffer;
    }
}

module.exports = AddNode;
