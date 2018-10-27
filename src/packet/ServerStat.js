'use strict';
function ServerStat(playerTracker) {
    this.playerTracker = playerTracker;
}

module.exports = ServerStat;

ServerStat.prototype.build = function (protocol) {
    var gameServer = this.playerTracker.gameServer;
    var total = 0;
    var alive = 0;
    var spectate = 0;
    for (var i = 0; i < gameServer.clients.length; i++) {
        var socket = gameServer.clients[i];
        if (socket == null || !socket.isConnected) continue;
        total++;
        if (socket.playerTracker.cells.length > 0) alive++;
        else spectate++;
    }
    var obj = {
        'name': gameServer.config.serverName,
        'mode': gameServer.gameMode.name,
        'uptime': process.uptime() >>> 0,
        'update': gameServer.updateTimeAvg.toFixed(3),
        'playersTotal': total,
        'playersAlive': alive,
        'playersSpect': spectate,
        'playersLimit': gameServer.config.serverMaxConnect
    };
    var json = JSON.stringify(obj);
    var BinaryWriter = require("./BinaryWriter");
    var writer = new BinaryWriter();
    writer.writeUInt8(254);
    writer.writeStringZeroUtf8(json);
    return writer.toBuffer();
};