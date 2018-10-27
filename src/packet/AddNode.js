'use strict';
function AddNode(playerTracker, item) {
    this.playerTracker = playerTracker;
    this.item = item;
}

module.exports = AddNode;

AddNode.prototype.build = function() {
    var buffer = new Buffer(5);
    buffer.writeUInt8(0x20, 0, 1);
    buffer.writeUInt32LE((this.item.nodeID ^ this.playerTracker.scramble.ID) >>> 0, 1, 1);
    return buffer;
};