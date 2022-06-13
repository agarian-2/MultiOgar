"use strict";
const BinaryWriter = require("./BinaryWriter");

class ServerStat {
    constructor(playerTracker, gameServer) {
        this.playerTracker = playerTracker;
        this.gameServer = gameServer;
    }
    build() {
        let gameServer = this.gameServer,
            total = 0,
            alive = 0,
            spectate = 0,
            dead = 0,
            bots = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (client.isConnected == null) bots++;
            if (client == null || !client.isConnected) continue;
            total++;
            if (client.playerTracker.cells.length > 0) alive++;
            else {
                dead++;
                if (client.playerTracker.isSpectating) spectate++;
            }
        }
        let obj = {
                "name": gameServer.config.serverName,
                "mode": gameServer.gameMode.name,
                "uptime": process.uptime() >>> 0,
                "update": gameServer.updateTimeAvg.toFixed(3),
                "playersTotal": total,
                "playersAlive": alive,
                "playersDead": dead,
                "playersSpect": spectate,
                "botsTotal": bots,
                "playersLimit": gameServer.config.serverMaxConnect
            },
            json = JSON.stringify(obj),
            writer = new BinaryWriter();
        writer.writeUInt8(254);
        writer.writeStringZeroUtf8(json);
        return writer.toBuffer();
    }
}

module.exports = ServerStat;
