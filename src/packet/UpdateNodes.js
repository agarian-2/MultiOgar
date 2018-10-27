'use strict';
function UpdateNodes(playerTracker, add, upd, eat, del) {
    this.playerTracker = playerTracker;
    this.nodes = {
        add: add,
        upd: upd,
        eat: eat,
        del: del
    };
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function (protocol) {
    if (!protocol) return null;
    var BinaryWriter = require("./BinaryWriter");
    var writer = new BinaryWriter();
    writer.writeUInt8(0x10);
    this.writeEatItems(writer);
    if (protocol < 5) this.writeUpdateItems4(writer);
    else if (protocol == 5) this.writeUpdateItems5(writer);
    else if (protocol < 11) this.writeUpdateItems6(writer);
    else this.writeUpdateItems11(writer);
    this.writeRemoveItems(writer, protocol);
    return writer.toBuffer();
};

UpdateNodes.prototype.writeUpdateItems4 = function (writer) {
    for (var i = 0; i < this.nodes.upd.length; i++) {
        var node = this.nodes.upd[i];
        if (node.nodeID == 0) continue;
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt16(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt16(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        var color = node.color;
        writer.writeUInt8(color.r >>> 0);
        writer.writeUInt8(color.g >>> 0);
        writer.writeUInt8(color.b >>> 0);
        var flags = 0;
        if (node.spiked) flags |= 0x01;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        writer.writeUInt8(flags >>> 0);
        writer.writeUInt16(0);
    }
    for (var i = 0; i < this.nodes.add.length; i++) {
        node = this.nodes.add[i];
        if (node.nodeID == 0) continue;
        var cellName = null;
        if (node.owner) cellName = node.owner._nameUnicode;
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt16(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt16(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        color = node.color;
        writer.writeUInt8(color.r >>> 0);
        writer.writeUInt8(color.g >>> 0);
        writer.writeUInt8(color.b >>> 0);
        flags = 0;
        if (node.spiked) flags |= 0x01;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        writer.writeUInt8(flags >>> 0);
        if (cellName != null) writer.writeBytes(cellName);
        else writer.writeUInt16(0);
    }
    writer.writeUInt32(0);
};

UpdateNodes.prototype.writeUpdateItems5 = function (writer) {
    for (var i = 0; i < this.nodes.upd.length; i++) {
        var node = this.nodes.upd[i];
        if (node.nodeID == 0) continue;
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        var color = node.color;
        writer.writeUInt8(color.r >>> 0);
        writer.writeUInt8(color.g >>> 0);
        writer.writeUInt8(color.b >>> 0);
        var flags = 0;
        if (node.spiked) flags |= 0x01;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        writer.writeUInt8(flags >>> 0);
        writer.writeUInt16(0);
    }
    for (var i = 0; i < this.nodes.add.length; i++) {
        node = this.nodes.add[i];
        if (node.nodeID == 0) continue;
        var skinName = null;
        var cellName = null;
        if (node.owner) {
            skinName = node.owner._skinUtf8;
            cellName = node.owner._nameUnicode;
        }
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        color = node.color;
        writer.writeUInt8(color.r >>> 0);
        writer.writeUInt8(color.g >>> 0);
        writer.writeUInt8(color.b >>> 0);
        flags = 0;
        if (node.spiked) flags |= 0x01;
        if (skinName != null) flags |= 0x04;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        writer.writeUInt8(flags >>> 0);
        if (flags & 0x04) writer.writeBytes(skinName);
        if (cellName != null) writer.writeBytes(cellName);
        else writer.writeUInt16(0);
    }
    writer.writeUInt32(0 >> 0);
};

UpdateNodes.prototype.writeUpdateItems6 = function (writer) {
    for (var i = 0; i < this.nodes.upd.length; i++) {
        var node = this.nodes.upd[i];
        if (node.nodeID == 0) continue;
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        var flags = 0;
        if (node.spiked) flags |= 0x01;
        if (node.cellType == 0) flags |= 0x02;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        if (node.cellType == 1) flags |= 0x80;
        writer.writeUInt8(flags >>> 0);
        if (flags & 0x02) {
            var color = node.color;
            writer.writeUInt8(color.r >>> 0);
            writer.writeUInt8(color.g >>> 0);
            writer.writeUInt8(color.b >>> 0);
        }
    }
    for (var i = 0; i < this.nodes.add.length; i++) {
        node = this.nodes.add[i];
        if (node.nodeID == 0) continue;
        var skinName = null;
        var cellName = null;
        if (node.owner) {
            skinName = node.owner._skinUtf8;
            cellName = node.owner._nameUtf8;
        }
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        flags = 0;
        if (node.spiked) flags |= 0x01;
        if (1) flags |= 0x02;
        if (skinName != null) flags |= 0x04;
        if (cellName != null) flags |= 0x08;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        if (node.cellType == 1) flags |= 0x80;
        writer.writeUInt8(flags >>> 0);
        if (flags & 0x02) {
            color = node.color;
            writer.writeUInt8(color.r >>> 0);
            writer.writeUInt8(color.g >>> 0);
            writer.writeUInt8(color.b >>> 0);
        }
        if (flags & 0x04) writer.writeBytes(skinName);
        if (flags & 0x08) writer.writeBytes(cellName);
    }
    writer.writeUInt32(0);
};

UpdateNodes.prototype.writeUpdateItems11 = function (writer) {
    for (var i = 0; i < this.nodes.upd.length; i++) {
        var node = this.nodes.upd[i];
        if (node.nodeID == 0) continue;
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        var flags = 0;
        if (node.spiked) flags |= 0x01;
        if (node.cellType == 0) flags |= 0x02;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        if (node.cellType == 1) flags |= 0x80;
        writer.writeUInt8(flags >>> 0);
        if (flags & 0x80) writer.writeUInt8(0x01);
        if (flags & 0x02) {
            var color = node.color;
            writer.writeUInt8(color.r >>> 0);
            writer.writeUInt8(color.g >>> 0);
            writer.writeUInt8(color.b >>> 0);
        }
    }
    for (var i = 0; i < this.nodes.add.length; i++) {
        node = this.nodes.add[i];
        if (node.nodeID == 0) continue;
        var skinName = null;
        var cellName = null;
        if (node.owner) {
            skinName = node.owner._skinUtf8protocol11;
            cellName = node.owner._nameUtf8;
        }
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32(node.position.x + this.playerTracker.scramble.X >> 0);
        writer.writeUInt32(node.position.y + this.playerTracker.scramble.Y >> 0);
        writer.writeUInt16(node._size >>> 0);
        flags = 0;
        if (node.spiked) flags |= 0x01;
        if (1) flags |= 0x02;
        if (skinName != null) flags |= 0x04;
        if (cellName != null) flags |= 0x08;
        if (node.isAgitated) flags |= 0x10;
        if (node.cellType == 3) flags |= 0x20;
        if (node.cellType == 1) flags |= 0x80;
        writer.writeUInt8(flags >>> 0);
        if (flags & 0x80) writer.writeUInt8(0x01);
        if (flags & 0x02) {
            color = node.color;
            writer.writeUInt8(color.r >>> 0);
            writer.writeUInt8(color.g >>> 0);
            writer.writeUInt8(color.b >>> 0);
        }
        if (flags & 0x04) writer.writeBytes(skinName);
        if (flags & 0x08) writer.writeBytes(cellName);
    }
    writer.writeUInt32(0);
};

UpdateNodes.prototype.writeEatItems = function (writer) {
    writer.writeUInt16(this.nodes.eat.length >>> 0);
    for (var i = 0; i < this.nodes.eat.length; i++) {
        var node = this.nodes.eat[i];
        var hunterID = 0;
        if (node.killedBy) hunterID = node.killedBy.nodeID;
        writer.writeUInt32((hunterID ^ this.playerTracker.scramble.ID) >>> 0);
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0); 
    }
};

UpdateNodes.prototype.writeRemoveItems = function (writer, protocol) {
    var length = this.nodes.eat.length + this.nodes.del.length;
    if (protocol < 6) writer.writeUInt32(length >>> 0);
    else writer.writeUInt16(length >>> 0);
    for (var i = 0; i < this.nodes.eat.length; i++) {
        var node = this.nodes.eat[i];
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
    }
    for (var i = 0; i < this.nodes.del.length; i++) {
        node = this.nodes.del[i];
        writer.writeUInt32((node.nodeID ^ this.playerTracker.scramble.ID) >>> 0);
    }
};