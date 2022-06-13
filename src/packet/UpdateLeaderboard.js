"use strict";
const BinaryWriter = require("./BinaryWriter");
const LeaderboardPosition = require("./LeaderboardPosition");

class UpdateLeaderboard {
    constructor(playerTracker, leaderboard, leaderboardType) {
        this.playerTracker = playerTracker;
        this.leaderboard = leaderboard;
        this.leaderboardType = leaderboardType;
        this.leaderboardCount = Math.min(this.leaderboard.length, this.playerTracker.gameServer.config.serverMaxLB);
    }
    writeCount(writer, flag1, flag2) {
        writer.writeUInt8(flag1);
        writer.writeUInt32(flag2 >>> 0);
    }
    build(protocol) {
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
    }
    userText(protocol) {
        let writer = new BinaryWriter();
        this.writeCount(writer, 0x31, this.leaderboard.length);
        for (let i = 0; i < this.leaderboard.length; i++) {
            let item = this.leaderboard[i] || "";
            if (protocol < 11) writer.writeUInt32(0);
            if (protocol < 6) writer.writeStringZeroUnicode(item);
            else writer.writeStringZeroUtf8(item);
        }
        return writer.toBuffer();
    }
    userText14() {
        let writer = new BinaryWriter();
        writer.writeUInt8(0x35);
        for (let i = 0; i < this.leaderboard.length; i++) {
            let item = this.leaderboard[i] || "";
            writer.writeUInt8(0x02);
            writer.writeStringZeroUtf8(item);
        }
        return writer.toBuffer();
    }
    FFA5() {
        let writer = new BinaryWriter();
        this.writeCount(writer, 0x31, this.leaderboardCount);
        for (let i = 0; i < this.leaderboardCount; i++) {
            let item = this.leaderboard[i];
            if (item == null) return null;
            let name = item._nameUnicode,
                id = 0;
            if (item === this.playerTracker && item.cells.length) id = item.cells[0].nodeID ^ this.playerTracker.scrambleID;
            writer.writeUInt32(id >>> 0);
            if (name) writer.writeBytes(name);
            else writer.writeUInt16(0);
        }
        return writer.toBuffer();
    }
    FFA6() {
        let writer = new BinaryWriter();
        this.writeCount(writer, 0x31, this.leaderboardCount);
        for (let i = 0; i < this.leaderboardCount; i++) {
            let item = this.leaderboard[i];
            if (item == null) return null;
            let name = item._nameUtf8,
                id = item === this.playerTracker ? 1 : 0;
            writer.writeUInt32(id >>> 0);
            if (name) writer.writeBytes(name);
            else writer.writeUInt8(0);
        }
        return writer.toBuffer();
    }
    FFA() {
        let lbCount = Math.min(this.leaderboard.length, this.playerTracker.gameServer.clients.length);
        this.playerTracker.socket.sendPacket(new LeaderboardPosition(this.leaderboard.indexOf(this.playerTracker) + 1));
        let writer = new BinaryWriter();
        writer.writeUInt8(0x35);
        for (let i = 0; i < lbCount; i++) {
            let item = this.leaderboard[i];
            if (item == null) return null;
            if (item === this.playerTracker) {
                writer.writeUInt8(0x09);
                writer.writeUInt16(1);
            } else {
                let name = item._name;
                writer.writeUInt8(0x02);
                if (name != null && name.length) writer.writeStringZeroUtf8(name);
                else writer.writeUInt8(0);
            }
        }
        return writer.toBuffer();
    }
    buildParty() {
        let protocol13s = 0;
        for (let i in this.playerTracker.gameServer.clients) {
            let client = this.playerTracker.gameServer.clients[i].packetHandler;
            if (client.protocol >= 13) protocol13s++;
        }
        let writer = new BinaryWriter();
        writer.writeUInt8(0x34);
        writer.writeUInt16(protocol13s);
        for (let i = 0; i < this.leaderboardCount; i++) {
            let item = this.leaderboard[i];
            if (item == null) return null;
            if (item === this.playerTracker) {
                writer.writeUInt8(0x09);
                writer.writeUInt16(1);
            } else {
                let name = item._name;
                writer.writeUInt8(0x02);
                if (name != null && name.length) writer.writeStringZeroUtf8(name);
                else writer.writeUInt8(0);
            }
        }
        this.playerTracker.socket.sendPacket(new LeaderboardPosition(this.leaderboard.indexOf(this.playerTracker) + 1));
        return writer.toBuffer();
    }
    buildTeam() {
        let writer = new BinaryWriter();
        this.writeCount(writer, 0x32, this.leaderboard.length);
        for (let i = 0; i < this.leaderboard.length; i++) {
            let value = this.leaderboard[i];
            if (value == null) return null;
            if (isNaN(value)) value = 0;
            value = value < 0 ? 0 : value;
            value = value > 1 ? 1 : value;
            writer.writeFloat(value);
        }
        return writer.toBuffer();
    }
}

module.exports = UpdateLeaderboard;
