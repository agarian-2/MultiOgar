'use strict';
const Log = require("./Logger"),
    Entity = require("../entity"),
    GameMode = require("../gamemodes");

function Commands() {
    this.list = {};
}

module.exports = Commands;

function saveIpBanList(gameServer) {
    const fs = require("fs");
    try {
        const banlist = fs.createWriteStream('../src/ipbanlist.txt');
        gameServer.ipBanList.sort().forEach(function(v) {
            banlist.write(v + '\n');
        });
        banlist.end();
        Log.info(gameServer.ipBanList.length + " IP ban records saved.");
    } catch (err) {
        Log.error(err.stack);
        Log.error("Failed to save " + '../src/ipbanlist.txt' + ": " + err.message + "!");
    }
}

function trimName(name) {
    return !name ? "An unnamed cell" : name.trim();
}

function ban(gameServer, split, ip) {
    var ipBin = ip.split('.');
    if (ipBin.length != 4) return Log.warn("Invalid IP format: " + ip + "!");
    gameServer.ipBanList.push(ip);
    if (ipBin[2] === "*" || ipBin[3] === "*") Log.print("The IP sub-net " + ip + " has been banned.");
    else Log.print("The IP " + ip + " has been banned.");
    gameServer.clients.forEach(function(socket) {
        if (!socket || !socket.isConnected || !gameServer.checkIpBan(ip) || socket.remoteAddress != ip) return;
        Commands.list.kill(gameServer, split);
        socket.close(null, "You're banned from the server!");
        var name = trimName(socket.playerTracker._name);
        Log.print("Banned: \"" + name + "\" with Player ID " + socket.playerTracker.pID + ".");
        gameServer.sendChatMSG(null, null, "Banned \"" + name + "\".");
    }, gameServer);
    saveIpBanList(gameServer);
}

var fillChar = function(data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === 1) for (var i = result.length; i < fieldLength; i++) result = char.concat(result);
    else for (var i = result.length; i < fieldLength; i++) result = result.concat(char);
    return result;
};

function clientByID(id, gameServer) {
    if (!id) return null;
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i].playerTracker;
        if (client.pID === id) return client;
    }
    return null;
}

Commands.list = {
    help: function() {
        Log.print("┌──────────────────────────────┐"),
        Log.print("│  [33mLIST OF AVAILABLE COMMANDS[0m  │"),
        Log.print("├──────────────────────────────┼───────────────────────────────────────────┐"),
        Log.print("│ COMMAND TO INPUT:     ┌──────┴────────┐ DESTRIPTION OF COMMAND:          │"),
        Log.print("├───────────────────────┤ [33mServer and AI[0m ├──────────────────────────────────┤"),
        Log.print("│                       └──────┬────────┘                                  │"),
        Log.print("│ addbot [number]              │ Adds bots to the server                   │"),
        Log.print("│ kickbot [number]             │ Kick a specified number of bots           │"),
        Log.print("│ kick [PlayerID]              │ Kick player or bot by client ID           │"),
        Log.print("│ kickall                      │ Kick all players and bots                 │"),
        Log.print("│ kill [PlayerID]              │ Kill cell(s) by client ID                 │"),
        Log.print("│ killall                      │ Kill everyone                             │"),
        Log.print("│ minion [PlayerID] [#] [name] │ Give minions to a specified player        │"),
        Log.print("│ playerlist                   │ Get list of players, bots, ID's, etc      │"),
        Log.print("│                       ┌──────┴──────────┐                                │"),
        Log.print("├───────────────────────┤ [33mPlayer Commands[0m ├────────────────────────────────┤"),
        Log.print("│                       └──────┬──────────┘                                │"),
        Log.print("│ color [PlayerID] [R] [G] [B] │ Set cell(s) color by client ID            │"),
        Log.print("| explode [PlayerID]           | Explodes a player into ejected mass       |"),
        Log.print("│ freeze [PlayerID]            │ Freezes a player                          │"),
        Log.print("│ spawn [entity] [pos] [mass]  │ Spawns an entity                          │"),
        Log.print("│ mass [PlayerID] [mass]       │ Set cell(s) mass by client ID             │"),
        Log.print("│ merge [PlayerID]             │ Merge all client's cells                  │"),
        Log.print("│ spawnmass [PlayerID] [mass]  │ Sets a players spawn mass                 │"),
        Log.print("│ speed [PlayerID] [speed]     │ Sets a players base speed                 │"),
        Log.print("│ name [PlayerID] [name]       │ Change cell(s) name by client ID          │"),
        Log.print("│ rec [PlayerID]               │ Gives a player instant-recombine          │"),
        Log.print("│ split [PlayerID] [Amount]    │ Forces a player to split                  │"),
        Log.print("│ teleport [X] [Y]             │ Teleports player to (X, Y) coordinates    │"),
        Log.print("│ replace [PlayerID] [entity]  │ Replaces a player with an entity          │"),
        Log.print("│ virus [PlayerID]             │ Spawns a virus undar a player             │"),
        Log.print("│                       ┌──────┴──────────┐                                │"),
        Log.print("├───────────────────────┤ [33mServer Commands[0m ├────────────────────────────────┤"),
        Log.print("│                       └──────┬──────────┘                                │"),
        Log.print("│ pause                        │ Pauses the game, freeze all nodes         │"),
        Log.print("│ board [text] [text] ...      │ Set scoreboard text                       │"),
        Log.print("│ change [config] [value]      │ Change specified settings                 │"),
        Log.print("│ reload                       │ Reload config file and banlist            │"),
        Log.print("│ restart                      │ Disconnect all players and reset server   │"),
        Log.print("│ ban [PlayerID │ IP]          │ Bans a player(s) IP                       │"),
        Log.print("│ unban [IP]                   │ Unbans an IP                              │"),
        Log.print("│ banlist                      │ Show a list of banned IPs                 │"),
        Log.print("│ mute [PlayerID]              │ Mutes player from the chat                │"),
        Log.print("│ lms                          │ Enables/disables Last Man Standing mode   │"),
        Log.print("│ border [width] [height]      │ Changes the size of the map               │"),
        Log.print("│ gamemodes                    │ List all gamemodes and a description      │"),
        Log.print("│ eval                         │ Runs some code                            │"),
        Log.print("│                       ┌──────┴────────┐                                  │"),
        Log.print("├───────────────────────┤ [33mMiscellaneous[0m ├──────────────────────────────────┤"),
        Log.print("│                       └──────┬────────┘                                  │"),
        Log.print("│ clear                        │ Clear console output                      │"),
        Log.print("│ reset                        │ Removes all nodes                         │"),
        Log.print("│ status                       │ Get server status                         │"),
        Log.print("│ debug                        │ Get/check node lengths                    │"),
        Log.print("│ exit                         │ Stop the server                           │"),
        Log.print("│ ophelp                       │ Lists all available OP mode keys          │"),
        Log.print("│ getcolor [Player ID]         │ Get a player's RGB color                  │"),
        Log.print("├──────────────────────────────┴───────────────────────────────────────────┤"),
        Log.print("│      Quick note: Input \"shortcuts\" for a list of command shortcuts!      │"),
        Log.print("└──────────────────────────────────────────────────────────────────────────┘");
    },
    shortcuts: function() {
        Log.print("┌─────────────────────────────┐"),
        Log.print("│  [33mLIST OF COMMAND SHORTCUTS[0m  │"),
        Log.print("├─────────────────────────────┼────────────────────────────────────────────┐"),
        Log.print("│ pl                          │ Alias for playerlist                       │"),
        Log.print("│ m                           │ Alias for mass                             │"),
        Log.print("│ sm                          │ Alias for spawnmass                        │"),
        Log.print("| e                           | Alias for explode                          |"),
        Log.print("│ ka                          │ Alias for killall                          │"),
        Log.print("│ k                           │ Alias for kill                             │"),
        Log.print("│ s                           │ Alias for speed                            │"),
        Log.print("│ f                           │ Alias for freeze                           │"),
        Log.print("│ ab                          │ Alias for addbot                           │"),
        Log.print("│ kb                          │ Alias for kickbot                          │"),
        Log.print("│ c                           │ Alias for change                           │"),
        Log.print("│ rp                          │ Alias for replace                          │"),
        Log.print("│ tp                          │ Alias for teleport                         │"),
        Log.print("└─────────────────────────────┴────────────────────────────────────────────┘");
    },
    gamemodes: function() {
        Log.print("┌───────────────────┐"),
        Log.print("│ [33mLIST OF GAMEMODES[0m │"),
        Log.print("├───────────────────┼───────────────────────────────────────────────────────────────────────────┐"),
        Log.print("│ Free For All      │ The original gamemode, with agar.io's basic features. ID: 0.              │"),
        Log.print("│ Teams             │ Where three teams fight for the most overall mass. ID: 1.                 │"),
        Log.print("│ Experimental      │ Features a pink food spawning cell, AKA a mothercell. ID: 2.              │"),
        Log.print("│ Rainbow           │ All entities cycle colors, creating a rainbow effect. ID: 3.              │"),
        Log.print("│ Tournament        │ Players 1v1 to the death, last alive person wins. ID: 4.                  │"),
        Log.print("│ Hunger Games      │ Similar to Tournament, but with very limited food. ID: 5.                 │"),
        Log.print('│ Last Man Standing │ No players are allowed to respawn. ID: N/A, activate it by running "lms". │'),
        Log.print("└───────────────────┴───────────────────────────────────────────────────────────────────────────┘");
    },
    ophelp: function() {
        Log.print("┌──────────────┐"),
        Log.print("│ [33mOP MODE KEYS[0m │"),
        Log.print("├───┬──────────┴─────────────┐"),
        Log.print("│ [33mE[0m │ Minions split          │"),
        Log.print("│ [33mR[0m │ Minions eject          │"),
        Log.print("│ [33mT[0m │ Minions freeze         │"),
        Log.print("│ [33mP[0m │ Minions collect food   │"),
        Log.print("│ [33mQ[0m │ Minions follow cell    │"),
        Log.print("│ [33mO[0m │ Freeze yourself        │"),
        Log.print("│ [33mM[0m │ Merge yourself         │"),
        Log.print("│ [33mI[0m │ Instant merge mode     │"),
        Log.print("│ [33mK[0m │ Suicide                │"),
        Log.print("│ [33mY[0m │ Gain mass              │"),
        Log.print("│ [33mU[0m │ Lose mass              │"),
        Log.print("│ [33mL[0m │ Clear entities         │"),
        Log.print("│ [33mH[0m │ Explode yourself       │"),
        Log.print("│ [33mZ[0m │ Change own color       │"),
        Log.print("│ [33mS[0m │ Spawn virus at mouse   │"),
        Log.print("│ [33mJ[0m │ Spawn food at mouse    │"),
        Log.print("│ [33mB[0m │ Edits J key food color │"),
        Log.print("│ [33mC[0m │ Edits J key food size  │"),
        Log.print("│ [33mG[0m │ Teleport to mouse      │"),
        Log.print("│ [33mV[0m │ Eject cells at mouse   │"),
        Log.print("│ [33mN[0m │ Shoot food             │"),
        Log.print("│ [33mX[0m │ Rainbow mode           │"),
        Log.print("└───┴────────────────────────┘");
    },
    op: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var client = clientByID(id, gameServer);
        client.OP.enabled = !client.OP.enabled;
        var OP = client.OP.enabled ? "now" : "no longer";
        Log.print(trimName(client._name) + " " + OP + " has OP mode.");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    restart: function(gameServer) {
        var QuadNode = require('./QuadNode.js');
        for (var i = 0; i < gameServer.clients.length; i++) gameServer.clients[i].close();
        gameServer.httpServer = gameServer.quadTree = null;
        gameServer.running = true;
        gameServer.lastNodeID = gameServer.lastPlayerID = 1;
        gameServer.nodesAll = gameServer.nodesPlayer = gameServer.nodesVirus = gameServer.nodesFood = gameServer.nodesEject = gameServer.nodesMoving = [];
        gameServer.commands;
        gameServer.tickCount = 0;
        gameServer.startTime = Date.now();
        gameServer.setBorder(gameServer.config.borderWidth, gameServer.config.borderHeight);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        Log.info("Restarting server...");
    },
    clear: function(gameServer) {
        process.stdout.write("\u001b[2J\u001b[0;0H");
        Log.info("Console output has been cleared.");
    },
    chat: function(gameServer, split) {
        gameServer.broadcastMSG(String(split.slice(1, split.length).join(" ")));
        Log.print("Succesfully sent your message to all players.");
    },
    border: function(gameServer, split) {
        var width = split[1],
            height = split[2];
        if (isNaN(width) || isNaN(height)) return Log.warn("Please specify a valid border width/height!");
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.setBorder(width, height);
        var QuadNode = require("./QuadNode.js");
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        Log.print("The map size is now (" + width + ", " + height + ").");
    },
    reset: function(gameServer, split) {
        var ent = split[1];
        if ("ejected" != ent && "food" != ent && "virus" != ent && "mothercell" != ent && ent) return Log.warn("Specify either 'food', 'virus', 'ejected', or 'mothercell'!");
        if ("all" == ent || !ent) {
            Log.print("Removed " + gameServer.nodesAll.length + " nodes.");
            for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
            for (var i = 0; i < gameServer.clients.length; i++) {
                var playerTracker = gameServer.clients[i].playerTracker;
                while (playerTracker.cells.length > 0) gameServer.removeNode(playerTracker.cells[0]);
            }
        }
        if ("ejected" == ent) {
            Log.print("Removed " + gameServer.nodesEject.length + " ejected nodes.");
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        }
        if ("food" == ent) {
            Log.print("Removed " + gameServer.nodesFood.length + " food nodes.");
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        }
        if ("virus" == ent) {
            Log.print("Removed " + gameServer.nodesVirus.length + " virus nodes.");
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        }
        if ("mothercell" == ent) {
            if (gameServer.gameMode.ID != 2) return Log.warn("Mothercells can only be cleared in experimental mode!");
            Log.print("Removed " + gameServer.gameMode.mothercells.length + " mothercell nodes.");
            for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
        }
    },
    explode: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                for (var i = 0; i < client.cells.length; i++) {
                    for (var cell = client.cells[i]; cell._size > 31.63;) {
                        var angle = 6.28 * Math.random(),
                            loss = gameServer.config.ejectMinSize;
                        if (gameServer.config.ejectMaxSize > loss)
                            loss = Math.random() * (gameServer.config.ejectMaxSize - loss) + loss;
                        var size = cell.radius - (loss + 5) * (loss + 5);
                        cell.setSize(Math.sqrt(size));
                        var pos = {
                            x: cell.position.x + angle,
                            y: cell.position.y + angle
                        };
                        var eject = new Entity.EjectedMass(gameServer, null, pos, loss);
                        if (gameServer.config.ejectRandomColor === 1) eject.color = gameServer.randomColor();
                        else eject.color = client.color;
                        eject.setBoost(gameServer.config.ejectSpeed * Math.random(), angle);
                        gameServer.addNode(eject);
                    }
                    cell.setSize(31.63);
                }
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                Log.print("Successfully exploded " + trimName(client._name) + ".");
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    minion: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            add = parseInt(split[2], 10),
            name = split.slice(3, split.length).join(' '),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
        if (client.isBot || client.isMi) return Log.warn("You cannot give minions to a bot or minion!");
        if (client.minion.control && isNaN(add)) {
            client.minion.control = false;
            Log.print("Succesfully removed minions for " + trimName(client._name) + ".");
        } else {
            client.minion.control = true;
            if (isNaN(add)) add = 1;
            for (var i = 0; i < add; i++)
            gameServer.bots.addMinion(client, name);
            Log.print("Added " + add + " minions for " + trimName(client._name) + ".");
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    addbot: function(gameServer, split) {
        var add = parseInt(split[1], 10);
        if (isNaN(add)) return Log.warn("Please specify an amount of bots to add!");
        for (var i = 0; i < add; i++)
            gameServer.bots.addBot();
        Log.print("Added " + add + " player bots.");
    },
    ban: function(gameServer, split) {
        var invalid = "Please specify a valid player ID or IP address!";
        if (null != split[1]) {
            if (split[1].indexOf(".") >= 0) {
                var ip = split[1],
                    ipSplit = ip.split(".");
                for (var i in ipSplit)
                    if (!(i > 1 && "*" == ipSplit[i]) && (isNaN(ipSplit[i]) || ipSplit[i] < 0 || ipSplit[i] >= 256))
                    return void Log.warn(invalid);
                return 4 !== ipSplit.length ? void Log.warn(invalid) : void ban(gameServer, split, ip);
            }
            var id = parseInt(split[1], 10);
            if (isNaN(id)) return Log.warn(invalid);
            else {
                ip = null;
                for (var i in gameServer.clients) {
                    var client = gameServer.clients[i];
                    if (null != client && client.isConnected && client.playerTracker.pID === id) {
                        ip = client._socket.remoteAddress;
                        break;
                    }
                }
                ip ? ban(gameServer, split, ip) : Log.warn("Player ID " + id + " not found!");
            }
        } else Log.warn(invalid);
    },
    banlist: function(gameServer) {
        Log.print("Showing " + gameServer.ipBanList.length + " banned IPs: "),
        Log.print(" IP              | IP "),
        Log.print("───────────────────────────────────");
        for (var i = 0; i < gameServer.ipBanList.length; i += 2) {
            Log.print(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " +
                (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1])
            );
        }
    },
    kickbot: function(gameServer, split) {
        var toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        var removed = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (gameServer.clients[i].isConnected != null) continue;
            if (gameServer.clients[i].playerTracker.isMi) continue;
            gameServer.clients[i].close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No bots are connected to the server!");
        else Log.print("Kicked " + removed + " bots.");
    },
    kickmi: function(gameServer, split) {
        var toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        var removed = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (!gameServer.clients[i].playerTracker.isMi) continue;
            gameServer.clients[i].close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No minions are connected to the server!");
        else Log.print("Kicked " + removed + " minions.");
    },
    board: function(gameServer, split) {
        var newLB = [];
        var input = split[1];
        var maxLB = gameServer.config.serverMaxLB;
        if (split.length > maxLB + 1) return Log.warn("The limit for lines of text on the leaderboard is " + maxLB + "!");
        for (var i = 1; i < split.length; i++) {
            if (split[i]) newLB[i - 1] = split[i];
            else newLB[i - 1] = " ";
        }
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.updateLB = function(gameServer) {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        if (input !== "reset") {
            Log.print("Successfully changed leaderboard values.");
            Log.print("Enter 'board reset' to reset leaderboard.");
        } else {
            var gameMode = GameMode.get(gameServer.gameMode.ID);
            gameServer.gameMode.packetLB = gameMode.packetLB;
            gameServer.gameMode.updateLB = gameMode.updateLB;
            Log.print("Successfully reset leaderboard.");
        }
    },
    change: function(gameServer, split) {
        if (split.length < 3) return Log.warn("Please specify a valid value for this config!");
        var key = split[1],
            value = split[2];
        if (value.indexOf('.') !== -1) value = parseFloat(value);
        else value = parseInt(value, 10);
        if (value == null || isNaN(value))
            return Log.warn("Invalid value: " + value + "!");
        if (!gameServer.config.hasOwnProperty(key))
            return Log.warn("Unknown config value: " + key + "!");
        gameServer.config[key] = value;
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Log.setVerbosity(gameServer.config.logVerbosity);
        Log.setFileVerbosity(gameServer.config.logFileVerbosity);
        Log.print("Set " + key + " = " + gameServer.config[key]);
    },
    color: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2], 10), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3], 10), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4], 10), 255), 0);
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) return Log.warn("Please specify a valid RGB color!");
                client.color = color;
                for (var j in client.cells) client.cells[j].color = color;
                Log.print("Changed " + trimName(client._name) + "'s color to (" + color.r + ", " + color.g + ", " + color.b + ").");
            }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    exit: function(gameServer) {
        gameServer.broadcastMSG("The server is closing!");
        Log.warn("Closing server...");
        gameServer.wsServer.close();
        process.exit(1);
    },
    kick: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var count = 0;
        gameServer.clients.forEach(function(socket) {
            if (socket.isConnected === false) return;
            if (id !== 0 && socket.playerTracker.pID !== id) return;
            Commands.list.kill(gameServer, split);
            socket.close(1000, "You were kicked from server!");
            var name = trimName(socket.playerTracker._name);
            Log.print("Kicked \"" + name + "\"");
            gameServer.sendChatMSG(null, null, "Kicked \"" + name + "\".");
            count++;
        }, this);
        if (count) return;
        if (!id) Log.warn("Please specify a valid IP!");
        else Log.warn("Player ID (" + id + ") was not found!");
    },
    kill: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var count = 0;
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                for (var j = 0; j < client.cells.length; j++) {
                    gameServer.removeNode(client.cells[0]);
                    count++;
                }
            }
        Log.print("Killed " + trimName(client._name) + " and removed " + count + " cells.");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    killall: function(gameServer) {
        var count = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;
            while (client.cells.length > 0) {
                gameServer.removeNode(client.cells[0]);
                count++;
            }
        }
        Log.print("Killed " + count + " cells.");
    },
    mass: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var mass = parseInt(split[2], 10);
        if (isNaN(mass)) return Log.warn("Please specify a valid mass number!");
        var size = Math.sqrt(100 * mass);
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                for (var l in client.cells) client.cells[l].setSize(size);
                Log.print("Set mass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    calc: function(gameServer, split) {
        var num = parseInt(split[1], 10);
        if (isNaN(num)) return Log.warn("Please specify a valid number!");
        var to = split[2];
        if (to !== "toSize" && to !== "toMass") return Log.warn('Please specify either "toMass" or "toSize"!');
        if (to === "toMass") Log.print("The specified size is " + num * num / 100 + " in mass.");
        else Log.print("The specified mass is " + (Math.sqrt(num * 100)).toFixed(6) + " in size.");
    },
    spawnmass: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var mass = Math.max(parseInt(split[2], 10), 9),
            size = Math.sqrt(100 * mass);
        if (isNaN(mass)) return Log.warn("Please specify a valid mass!");
        var client = clientByID(id, gameServer);
        client.spawnMass = size;
        Log.print("Set spawnMass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    speed: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            speed = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (isNaN(speed)) return Log.warn("Please specify a valid speed!");
        var client = clientByID(id, gameServer);
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
        client.customSpeed = speed;
        Log.print("Set base speed mult of " + trimName(client._name) + " to " + !speed ? gameServer.config.playerSpeed : speed + ".");
    },
    merge: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                if (client.cells.length == 1) return Log.warn("Client already has one cell!");
                client.mergeOverride = !client.mergeOverride;
                Log.print(trimName(client._name) + " is " + (client.mergeOverride ? "now" : "no longer") + " merging.");
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    rec: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var client = clientByID(id, gameServer);
        client.recMode = !client.recMode;
        Log.print(trimName(client._name) + " is " + (client.recMode ? "now" : "no longer") + " in rec mode.");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    split: function(gameServer, n) {
        var id = parseInt(n[1], 10),
            amount = parseInt(n[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (isNaN(amount)) return Log.warn("Please specify a valid split count!");
        if (amount > gameServer.config.playerMaxCells) amount = gameServer.config.playerMaxCells;
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                if (client.cells.length >= gameServer.config.playerMaxCells) return Log.warn("That player has reached the splitting limit of " + gameServer.config.playerMaxCells + "!");
                for (var i = 0; i < amount; i++) gameServer.splitCells(client);
                Log.print("Forced " + trimName(client._name) + " to split " + amount + " times.");
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    name: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var name = split.slice(2, split.length).join(' ');
        if (typeof name == 'undefined') return Log.warn("Please type a valid name!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                if (client.pID === id) {
                    Log.print("Changing " + trimName(client._name) + " to " + name + ".");
                    client.setName(name);
                    return;
                }
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    unban: function(gameServer, split) {
        if (split.length < 2 || !split[1] || split[1].trim().length < 1) return Log.warn("Please specify a valid IP!");
        var ip = split[1].trim(),
            index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) return Log.warn("The specified IP " + ip + " is not in the ban list!");
        gameServer.ipBanList.splice(index, 1);
        saveIpBanList(gameServer);
        Log.print("Unbanned IP: " + ip + ".");
    },
    playerlist: function(gameServer) {
        if (gameServer.clients.length <= 0) return Log.warn("No bots or players are currently connected to the server!");
        Log.info("Total players connected: " + gameServer.clients.length + '.');
        Log.print(" ID     | IP              |  P  | CELLS | SCORE  |   POSITION   | " + fillChar('NICK', ' ', gameServer.config.playerMaxNick) + " ");
        Log.print(fillChar('', '─', ' ID     | IP              | CELLS | SCORE  |   POSITION   |   |  '.length + gameServer.config.playerMaxNick));
        var sockets = gameServer.clients.slice(0);
        sockets.sort(function(a, b) {
            return a.playerTracker.pID - b.playerTracker.pID;
        });
        for (var i = 0; i < sockets.length; i++) {
            var socket = sockets[i],
                client = socket.playerTracker,
                id = fillChar(client.pID, ' ', 6, 1),
                ip = client.isMi ? "[MINION]" : client.isBot ? "[BOT]" : socket.isConnected === true ? socket.remoteAddress : "[UNKNOWN]";
            ip = fillChar(ip, ' ', 15);
            var protocol = gameServer.clients[i].packetHandler.protocol;
            if (!protocol) protocol = "N/A";
            else protocol += protocol < 10 ? "  " : " ";
            var nick = '',
                cells = '',
                score = '',
                position = '',
                data = '',
                target = null;
            if (socket.closeReason != null) {
                var reason = "[DISCONNECTED] ";
                if (socket.closeReason.code) reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message) reason += socket.closeReason.message;
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected === true && !client.isMi) Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + "[CONNECTING]");
            else if (client.isSpectating) {
                nick = "in free-roam";
                if (!client.freeRoam) {
                    target = client.getSpecTarget();
                    if (target) nick = trimName(target._name);
                }
                data = fillChar(trimName(client._name) + " is spectating " + nick, '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + data);
            } else if (client.cells.length) {
                target = client.getSpecTarget();
                nick = fillChar(trimName(client._name), ' ', gameServer.config.playerMaxNick);
                cells = fillChar(client.cells.length, ' ', 5, 1);
                score = fillChar(client._score / 100 >> 0, ' ', 6, 1);
                position = fillChar(client.centerPos.x >> 0, ' ', 5, 1) + ', ' + fillChar(client.centerPos.y >> 0, ' ', 5, 1);
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + cells + " | " + score + " | " + position + " | " + nick);
            } else {
                data = fillChar('Player is currently dead', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + data);
            }
        }
    },
    getcolor: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.print("Please specify a valid player ID!");
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                Log.print("That player's RGB color is (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
            }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    lms: function(gameServer) {
        gameServer.disableSpawn = !gameServer.disableSpawn;
        Log.print("Last man standing has " + (gameServer.disableSpawn ? "begun." : "ended."));
    },
    pause: function(gameServer) {
        gameServer.running = !gameServer.running;
        var state = gameServer.running ? "Unpaused" : "Paused";
        Log.print(state + " the game.");
    },
    freeze: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                client.frozen = !client.frozen;
                Log.print((client.frozen ? "Froze " : "Unfroze") + trimName(client._name) + ".");
            }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    reload: function(gameServer) {
        gameServer.loadConfig();
        gameServer.loadBanList();
        Log.print("Reloaded the configuration files succesully.");
    },
    status: function(gameServer) {
        var ini = require('./ini.js'),
            humans = 0,
            bots = 0,
            mem = process.memoryUsage();
        for (var i = 0; i < gameServer.clients.length; i++) {
            if ('_socket' in gameServer.clients[i]) humans++;
            else bots++;
        }
        var scores = [];
        for (var i in gameServer.clients) {
            var totalMass = 0,
                client = gameServer.clients[i].playerTracker;
            for (var cell of client.cells) totalMass += gameServer.sizeToMass(cell._size);
            scores.push(totalMass);
        }
        if (!gameServer.clients.length) scores = [0];
        Log.print("Connected Players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnect + "."),
        Log.print("Total Players: " + humans + "."),
        Log.print("Total Bots: " + bots + "."),
        Log.print("Average Score: " + (scores.reduce(function(x, y) {
            return x + y;
        }) / scores.length).toFixed(2) + "."),
        Log.print("Server Uptime: " + Math.floor(process.uptime() / 60) + " minutes."),
        Log.print("Current Memory Usage: " + Math.round(mem.heapUsed / 1048576 * 10) / 10 + "/" + Math.round(mem.heapTotal / 1048576 * 10) / 10 + " MB."),
        Log.print("Current Game Mode: " + gameServer.gameMode.name + "."),
        Log.print("Current Update Time: " + gameServer.updateTimeAvg.toFixed(3) + " ms (" + ini.getLagMessage(gameServer.updateTimeAvg) + ").");
    },
    teleport: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var pos = {
            x: parseInt(split[2], 10),
            y: parseInt(split[3], 10)
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Invalid coordinates!");
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                for (var j in client.cells) {
                    client.cells[j].position.x = pos.x,
                    client.cells[j].position.y = pos.y,
                    gameServer.updateNodeQuad(client.cells[j]);
                }
                Log.print("Teleported " + trimName(client._name) + " to (" + pos.x + " , " + pos.y + ").");
            }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    spawn: function(gameServer, split) {
        var entity = split[1];
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn("Please specify either virus, food, or mothercell!");
        var pos = {
            x: parseInt(split[2], 10),
            y: parseInt(split[3], 10)
        };
        var mass = parseInt(split[4], 10);
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Invalid coordinates");
        if (entity === "virus") var size = gameServer.config.virusMinSize;
        else if (entity === "mothercell") size = gameServer.config.virusMinSize * 2.5;
        else if (entity === "food") size = gameServer.config.foodMinMass;
        if (!isNaN(mass)) size = Math.sqrt(mass * 100);
        if (entity === "virus") {
            var virus = new Entity.Virus(gameServer, null, pos, size);
            gameServer.addNode(virus);
            Log.print("Spawned a virus at (" + pos.x + " , " + pos.y + ").");
        } else if (entity === "food") {
            var food = new Entity.Food(gameServer, null, pos, size);
            food.color = gameServer.randomColor();
            gameServer.addNode(food);
            Log.print("Spawned a food cell at (" + pos.x + " , " + pos.y + ").");
        } else if (entity === "mothercell") {
            var mother = new Entity.MotherCell(gameServer, null, pos, size);
            gameServer.addNode(mother);
            Log.print("Spawned a mothercell at (" + pos.x + " , " + pos.y + ").");
        }
    },
    replace: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var ent = split[2];
        if ((ent !== "virus" && ent !== "food" && ent !== "mothercell") || !ent) return Log.warn("Please specify either virus, food, or mothercell!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                while (client.cells.length > 0) {
                    var cell = client.cells[0];
                    gameServer.removeNode(cell);
                    if (ent === "virus") {
                        var virus = new Entity.Virus(gameServer, null, cell.position, cell._size);
                        gameServer.addNode(virus);
                    } else if (ent === "food") {
                        var food = new Entity.Food(gameServer, null, cell.position, cell._size);
                        food.color = gameServer.randomColor();
                        gameServer.addNode(food);
                    } else if (ent === "mothercell") {
                        var mother = new Entity.MotherCell(gameServer, null, cell.position, cell._size);
                        gameServer.addNode(mother);
                    }
                }
                if (ent === "food") Log.print("Replaced " + trimName(client._name) + " with food cells.");
                else if (ent === "virus") Log.print("Replaced " + trimName(client._name) + " with viruses.");
                else if (ent === "mothercell") Log.print("Replaced " + trimName(client._name) + " with mother cells.");
            }
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    virus: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!")
        for (var i in gameServer.clients)
            if (gameServer.clients[i].playerTracker.pID === id) {
                var client = gameServer.clients[i].playerTracker;
                var virus = new Entity.Virus(gameServer, null, client.centerPos, gameServer.config.virusMinSize);
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                gameServer.addNode(virus);
                Log.print("Spawned a virus under " + trimName(client._name) + ".");
            }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    debug: function(gameServer) {
        Log.print("-----------------NODES------------------"),
        Log.print("Total nodes: " + gameServer.nodesAll.length),
        Log.print("Player nodes: " + gameServer.nodesPlayer.length),
        Log.print("Virus nodes: " + gameServer.nodesVirus.length),
        Log.print("Ejected nodes: " + gameServer.nodesEject.length),
        Log.print("Food nodes: " + gameServer.nodesFood.length);
        Log.print("MotherCell nodes: " + gameServer.gameMode.ID === 2 ? gameServer.gameMode.mothercells.length : "0");
        Log.print("----------------------------------------");
    },
    mute: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var client = clientByID(id, gameServer);
        if (client == null) return void Log.warn("That player ID (" + id + ") is non-existant!");
        Log.print(client.isMuted ? "Muted " : "Unmuted " + trimName(client._name) + " successfully.");
        client.isMuted = !client.isMuted;
    },
    gamemode: function(gameServer,split) {
        try {
            var id = parseInt(split[1], 10);
            var gameMode = GameMode.get(id);
            gameServer.gameMode.onChange(gameServer);
            gameServer.gameMode = gameMode;
            gameServer.gameMode.onServerInit(gameServer);
            //gameServer.config.serverGamemode = id;
            Log.print("Changed the game mode to " + gameServer.gameMode.name);
        } catch (e) {
            Log.warn("Invalid game mode selected!");
        }
    },
    eval: function(_gameServer, split) { // gonna make the output later
        try {
            const string = split.slice(1, split.length).join(' '),
                gameServer = _gameServer;
            Log.info('Running code...');
            Log.print('[OUTPUT] ' + eval(string));
        } catch (err) {
            Log.warn("An error occurred while trying to run the code:");
            Log.error(err);
        }
    },
    /*k: function() { // lol
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k"),
        console.log("k");
    },*/
    pl: function(gameServer) {
        Commands.list.playerlist(gameServer);
    },
    m: function(gameServer, split) {
        Commands.list.mass(gameServer, split);
    },
    e: function(gameServer, split) {
        Commands.list.explode(gameServer, split);
    },
    sm: function(gameServer, split) {
        Commands.list.spawnmass(gameServer, split);
    },
    ka: function(gameServer, split) {
        Commands.list.killall(gameServer);
    },
    k: function(gameServer, split) {
        Commands.list.kill(gameServer, split);
    },
    s: function(gameServer, split) {
        Commands.list.speed(gameServer, split);
    },
    f: function(gameServer, split) {
        Commands.list.freeze(gameServer, split);
    },
    ab: function(gameServer, split) {
        Commands.list.addbot(gameServer, split);
    },
    kb: function(gameServer, split) {
        Commands.list.kickbot(gameServer, split);
    },
    c: function(gameServer, split) {
        Commands.list.change(gameServer, split);
    },
    tp: function(gameServer, split) {
        Commands.list.teleport(gameServer, split);
    },
    rp: function(gameServer, split) {
        Commands.list.replace(gameServer, split);
    },
    stats: function(gameServer) {
        Commands.list.status(gameServer);
    }
};
