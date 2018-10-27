'use strict';
const BinaryWriter = require('./BinaryWriter');

function UpdateLeaderboard(playerTracker, leaderboard, leaderboardType) {
    this.playerTracker = playerTracker;
    this.leaderboard = leaderboard;
    this.leaderboardType = leaderboardType;
    this.leaderboardCount = Math.min(this.leaderboard.length, this.playerTracker.gameServer.config.serverMaxLB);
}

function writeCount(writer, flag1, flag2) {
    writer.writeUInt8(flag1);
    writer.writeUInt32(flag2 >>> 0);
}

module.exports = UpdateLeaderboard;

UpdateLeaderboard.prototype.build = function(protocol) {
    switch (this.leaderboardType) {
        case 48:
            if (protocol < 11) return this.userText(protocol);
            else return this.userText14();
        case 49:
            if (protocol < 6 ) return this.FFA5();
            else if (protocol < 11) return this.FFA6();
            else return this.FFA(protocol);
        case 50:
            return this.buildTeam();
        default:
            return null;
    }
};

UpdateLeaderboard.prototype.userText = function(protocol) {
    var writer = new BinaryWriter();
    writeCount(writer, 0x31, this.leaderboard.length);
    for (var i = 0; i < this.leaderboard.length; i++) {
        var item = this.leaderboard[i] || "";
        if (protocol < 11) writer.writeUInt32(0);
        if (protocol < 6) writer.writeStringZeroUnicode(item);
        else writer.writeStringZeroUtf8(item);
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.userText14 = function () {
    var writer = new BinaryWriter();
    writer.writeUInt8(0x35);
    for (var i = 0; i < this.leaderboard.length; i++) {
        var item = this.leaderboard[i] || "";
        writer.writeUInt8(0x02);
        writer.writeStringZeroUtf8(item);
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.FFA5 = function() {
    var writer = new BinaryWriter();
    writeCount(writer, 0x31, this.leaderboardCount);
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;
        var name = item._nameUnicode;
        var id = 0;
        if (item == this.playerTracker && item.cells.length) id = item.cells[0].nodeID ^ this.playerTracker.scramble.ID;
        writer.writeUInt32(id >>> 0);
        if (name) writer.writeBytes(name);
        else writer.writeUInt16(0);
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.FFA6 = function() {
    var writer = new BinaryWriter();
    writeCount(writer, 0x31, this.leaderboardCount);
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;
        var name = item._nameUtf8;
        var id = item == this.playerTracker ? 1 : 0;
        writer.writeUInt32(id >>> 0);
        if (name) writer.writeBytes(name);
        else writer.writeUInt8(0);
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.FFA = function(protocol) {
    var lbCount = Math.min(this.leaderboard.length, this.playerTracker.gameServer.clients.length);
    var LeaderboardPosition = require('./LeaderboardPosition');
    this.playerTracker.socket.sendPacket(new LeaderboardPosition(this.leaderboard.indexOf(this.playerTracker) + 1));
    var writer = new BinaryWriter();
    writer.writeUInt8(0x35);
    for (var i = 0; i < lbCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;
        if (item == this.playerTracker) {
            writer.writeUInt8(0x09);
            writer.writeUInt16(1);
        } else {
            var name = item._name;
            writer.writeUInt8(0x02);
            if (name != null && name.length) writer.writeStringZeroUtf8(name);
            else writer.writeUInt8(0);
        }
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.buildParty = function() {
    var protocol13s = 0;
    for (var i in this.playerTracker.gameServer.clients) {
        var client = this.playerTracker.gameServer.clients[i].packetHandler;
        if (client.protocol >= 13) protocol13s++;
    }
    var writer = new BinaryWriter();
    writer.writeUInt8(0x34);
    writer.writeUInt16(protocol13s);
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;
        if (item === this.playerTracker) {
            writer.writeUInt8(0x09);
            writer.writeUInt16(1);
        } else {
            var name = item._name;
            writer.writeUInt8(0x02);
            if (name != null && name.length) writer.writeStringZeroUtf8(name);
            else writer.writeUInt8(0);
        }
    }
    var LeaderboardPosition = require('./LeaderboardPosition');
    this.playerTracker.socket.sendPacket(new LeaderboardPosition(this.leaderboard.indexOf(this.playerTracker) + 1));
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.buildTeam = function() {
    var writer = new BinaryWriter();
    writeCount(writer, 0x32, this.leaderboard.length);
    for (var i = 0; i < this.leaderboard.length; i++) {
        var value = this.leaderboard[i];
        if (value == null) return null;
        if (isNaN(value)) value = 0;
        value = value < 0 ? 0 : value;
        value = value > 1 ? 1 : value;
        writer.writeFloat(value);
    }
    return writer.toBuffer();
};