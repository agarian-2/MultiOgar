function ServerStat(playerTracker, gameServer) {
    this.playerTracker = playerTracker;
    this.gameServer = gameServer;
}

module.exports = ServerStat;

ServerStat.prototype.build = function() {
    var gameServer = this.gameServer,
        total = 0,
        alive = 0,
        spectate = 0,
        dead = 0,
        bots = 0;
    for (var i = 0; i < gameServer.clients.length; i++) {
        var socket = gameServer.clients[i];
        if (socket.isConnected == null) bots++;
        if (socket == null || !socket.isConnected) continue;
        total++;
        if (socket.playerTracker.cells.length > 0) alive++;
        else {
            dead++;
            if (socket.playerTracker.isSpectating) spectate++;
        }
    }
    var obj = {
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
        BinaryWriter = require("./BinaryWriter"),
        writer = new BinaryWriter();
    writer.writeUInt8(254);
    writer.writeStringZeroUtf8(json);
    return writer.toBuffer();
};
