// To-Do: Alphabetize commands?
var Log = require("./Logger"),
    Entity = require("../entity"),
    GameMode = require("../gamemodes"),
    QuadNode = require("./QuadNode.js");

function Commands() {
    this.list = {};
}

function trimName(name) {
    if (!name) return "An unnamed cell"
    else return name.trim();
}

function saveIpBanList(gameServer) {
    var fs = require("fs");
    try {
        var banlist = fs.createWriteStream("../src/ipbanlist.txt");
        for (var v of gameServer.ipBanList.sort()) banlist.write(v + "\n");
        banlist.end();
        Log.info(gameServer.ipBanList.length + " IP ban records saved.");
    } catch (e) {
        Log.error(e.stack);
        Log.error("Failed to save " + "../src/ipbanlist.txt" + ": " + e.message + "!");
    }
}

function ban(gameServer, split, ip) {
    var ipBin = ip.split(".");
    if (ipBin.length !== 4) return Log.warn("Invalid IP format: " + ip + ".");
    gameServer.ipBanList.push(ip);
    if (ipBin[2] === "*" || ipBin[3] === "*") Log.print("The IP sub-net " + ip + " has been banned.");
    else Log.print("The IP " + ip + " has been banned.");
    gameServer.clients.forEach(function(socket) {
        if (!socket || !socket.isConnected || !gameServer.checkIpBan(ip) || socket.remoteAddress !== ip) return;
        Commands.list.kill(gameServer, split);
        socket.close(null, "You're banned from the server!");
        var name = trimName(socket.playerTracker._name);
        Log.print("Banned: " + name + " with Player ID " + socket.playerTracker.pID + ".");
        gameServer.sendChatMessage(null, null, "Banned " + name + ".");
    }, gameServer);
    saveIpBanList(gameServer);
}

function fillChar(data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === 1)
        for (var i = result.length; i < fieldLength; i++) result = char.concat(result);
    else for (var i = result.length; i < fieldLength; i++) result = result.concat(char);
    return result;
}

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
        Log.print("│       Quick note: Run 'shortcuts' for a list of command shortcuts!       │"),
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
        Log.print("│ stats                       │ Alias for status                           │"),
        Log.print("└─────────────────────────────┴────────────────────────���───────────────────┘");
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
        Log.print("│ Last Man Standing │ No players are allowed to respawn. ID: N/A, activate it by running 'lms'. │"),
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
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found.");
        if (client.isBot) return Log.warn("You cannot OP a bot.");
        if (client.isMinion || client.isMi) return Log.warn("You cannot OP a minion.");
        client.OP.enabled = !client.OP.enabled;
        Log.print(trimName(client._name) + " " + (client.OP.enabled ? "now" : "no longer") + " has OP.");
    },
    restart: function(gameServer) { // This is not a full restart
        for (var i = 0; i < gameServer.clients.length; i++) gameServer.clients[i].close();
        gameServer.httpServer = gameServer.quadTree = null;
        gameServer.running = true;
        gameServer.lastNodeID = gameServer.lastPlayerID = 1;
        gameServer.commands;
        gameServer.tickCount = 0;
        gameServer.startTime = Date.now();
        gameServer.setBorder(gameServer.config.borderWidth, gameServer.config.borderHeight);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.nodesAll = gameServer.nodesPlayer = gameServer.nodesVirus = gameServer.nodesFood = gameServer.nodesEject = gameServer.nodesMoving = [];
        Log.warn("Restarting server...");
    },
    clear: function() {
        process.stdout.write("\u001b[2J\u001b[0;0H");
        Log.print("Console output has been cleared.");
    },
    chat: function(gameServer, split) {
        gameServer.broadcastMSG(String(split.slice(1, split.length).join(" ")));
        Log.print("Sending your message to all players.");
    },
    border: function(gameServer, split) {
        var width = split[1],
            height = split[2];
        if (isNaN(width) || isNaN(height)) return Log.warn("Please specify a valid border width and height.");
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.setBorder(width, height);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        Log.print("Map borders have been changed to (" + width + ", " + height + ").");
    },
    reset: function(gameServer, split) {
        var ent = split[1];
        if (ent !== "all" && ent !== "ejected" && ent !== "food" && ent !== "virus" && ent !== "mothercell") return Log.warn("Please specify either 'food', 'virus', 'ejected', or 'mothercell'.");
        if (ent === "all") {
            Log.print("Removed " + gameServer.nodesAll.length + " entities.");
            for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
            for (var i = 0; i < gameServer.clients.length; i++) {
                var playerTracker = gameServer.clients[i].playerTracker;
                for (;playerTracker.cells.length;) gameServer.removeNode(playerTracker.cells[0]);
            }
        }
        if (ent === "ejected") {
            Log.print("Removed " + gameServer.nodesEject.length + " ejected cells.");
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        }
        if (ent === "food") {
            Log.print("Removed " + gameServer.nodesFood.length + " food cells.");
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        }
        if (ent === "virus") {
            Log.print("Removed " + gameServer.nodesVirus.length + " viruses.");
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        }
        if (ent === "mothercell") {
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be cleared in experimental mode.");
            Log.print("Removed " + gameServer.gameMode.mothercells.length + " mothercells.");
            for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
        }
    },
    explode: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (var cell of client.cells) {
            while (cell._size > gameServer.massToSize(10)) {
                var angle = 2 * Math.PI * Math.random(),
                    loss = gameServer.config.ejectMinSize;
                if (gameServer.config.ejectMaxSize > loss) loss = Math.random() * (gameServer.config.ejectMaxSize - loss) + loss;
                var size = cell.radius - (loss + 5) * (loss + 5);
                cell.setSize(Math.sqrt(size));
                var pos = {
                        x: cell.position.x + angle,
                        y: cell.position.y + angle
                    },
                    eject = new Entity.EjectedMass(gameServer, null, pos, loss);
                eject.color = gameServer.config.ejectRandomColor === 1 ? gameServer.randomColor() : client.color;
                eject.setBoost(gameServer.config.ejectSpeed * Math.random(), angle);
                gameServer.addNode(eject);
            }
            cell.setSize(gameServer.massToSize(10));
        }
        Log.print("Successfully exploded " + trimName(client._name) + ".");
    },
    minion: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            add = parseInt(split[2], 10),
            name = split.slice(3, split.length).join(" "),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (client.isBot || client.isMi) return Log.warn("You cannot give minions to a bot or minion.");
        if (client.minion.control && isNaN(add)) {
            client.minion = {
                control: false,
                split: false,
                eject: false,
                frozen: false,
                collect: false,
                follow: false
            };
            client.minions = [];
            Log.print("Succesfully removed minions for " + trimName(client._name) + ".");
        } else {
            client.minion.control = true;
            if (isNaN(add)) add = 1;
            for (var i = 0; i < add; i++) gameServer.bots.addMinion(client, name);
            Log.print("Added " + add + " minions for " + trimName(client._name) + ".");
        }
    },
    addbot: function(gameServer, split) {
        var add = parseInt(split[1], 10);
        if (isNaN(add)) return Log.warn("Please specify an amount of bots to add.");
        for (var i = 0; i < add; i++) gameServer.bots.addBot();
        Log.print("Added " + add + " player bots.");
    },
    ban: function(gameServer, split) {
        var invalid = "Please specify a valid player ID or IP address.";
        if (split[1] != null) {
            if (split[1].indexOf(".") >= 0) {
                var ip = split[1],
                    ipSplit = ip.split(".");
                for (var i in ipSplit)
                    if (!(i > 1 && "*" === ipSplit[i]) && (isNaN(ipSplit[i]) || ipSplit[i] < 0 || ipSplit[i] >= 256)) return Log.warn(invalid);
                return ipSplit.length !== 4 ? Log.warn(invalid) : ban(gameServer, split, ip);
            }
            var id = parseInt(split[1], 10);
            if (isNaN(id)) return Log.warn(invalid);
            else {
                var ip = null;
                for (var client of gameServer.clients)
                    if (client != null && client.isConnected && client.playerTracker.pID === id) {
                        ip = client._socket.remoteAddress;
                        break;
                    }
                if (ip) ban(gameServer, split, ip);
                else Log.warn("Player ID " + id + " not found.");
            }
        } else Log.warn(invalid);
    },
    banlist: function(gameServer) {
        Log.print("Showing " + gameServer.ipBanList.length + " banned IPs: "),
        Log.print(" IP              | IP "),
        Log.print("───────────────────────────────────");
        for (var i = 0; i < gameServer.ipBanList.length; i += 2) Log.print(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " + (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1]));
    },
    kickbot: function(gameServer, split) {
        var toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        var removed = 0;
        for (var client of gameServer.clients) {
            if (client.isConnected != null) continue;
            if (client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No bots are in the server.");
        else Log.print("Kicked " + removed + " bots.");
    },
    kickmi: function(gameServer, split) {
        var toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        var removed = 0;
        for (var client of gameServer.clients) {
            if (!client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No minions are in the server.");
        else Log.print("Kicked " + removed + " minions.");
    },
    board: function(gameServer, split) {
        var newLB = [],
            input = split[1],
            maxLB = gameServer.config.serverMaxLB;
        if (split.length > maxLB + 1) return Log.warn("The limit for lines of text on the leaderboard is " + maxLB + ".");
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
            Log.print("Run the command 'board reset' to reset leaderboard.");
        } else {
            var gameMode = GameMode.get(gameServer.gameMode.ID);
            gameServer.gameMode.packetLB = gameMode.packetLB;
            gameServer.gameMode.updateLB = gameMode.updateLB;
            Log.print("Successfully reset leaderboard.");
        }
    },
    change: function(gameServer, split) {
        if (split.length < 3) return Log.warn("Please specify a valid value for this config.");
        var key = split[1],
            value = split[2];
        if (value.indexOf(".") !== -1) value = parseFloat(value);
        else value = parseInt(value, 10);
        if (value == null || isNaN(value)) return Log.warn("Invalid value: " + value + ".");
        if (!gameServer.config.hasOwnProperty(key)) return Log.warn("Unknown config value: " + key + ".");
        gameServer.config[key] = value;
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Log.setVerbosity(gameServer.config.logVerbosity);
        Log.setFileVerbosity(gameServer.config.logFileVerbosity);
        Log.print("Set " + key + " to " + gameServer.config[key]);
    },
    color: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2], 10), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3], 10), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4], 10), 255), 0);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) return Log.warn("Please specify a valid RGB color.");
        client.color = color;
        for (var cell of client.cells) cell.color = color;
        Log.print("Changed " + trimName(client._name) + "'s color to (" + color.r + ", " + color.g + ", " + color.b + ").");
    },
    exit: function(gameServer) {
        gameServer.broadcastMSG("The server is closing!");
        Log.warn("Closing server...");
        gameServer.wsServer.close();
        process.exit(1);
    },
    kick: function(gameServer, split) {
        var id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        var count = 0;
        gameServer.clients.forEach(function(socket) {
            if (socket.isConnected === false) return;
            if (id !== 0 && socket.playerTracker.pID !== id) return;
            Commands.list.kill(gameServer, split);
            socket.close(1000, "You were kicked from server!");
            var name = trimName(socket.playerTracker._name);
            Log.print("Kicked " + name + " from the server.");
            gameServer.sendChatMessage(null, null, "Kicked " + name + " from the server.");
            count++;
        }, this);
        if (count > 0) return;
        if (!id) Log.warn("Please specify a valid IP.");
        else Log.warn("Player ID (" + id + ") was not found.");
    },
    kill: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        var count = 0;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        while (client.cells.length > 0) {
            gameServer.removeNode(client.cells[0]);
            count++;
        }
        Log.print("Killed " + trimName(client._name) + " and removed " + count + " cells.");
    },
    killall: function(gameServer) {
        var pCount = 0,
            bCount = 0,
            mCount = 0;
        for (var client of gameServer.clients) {
            if (client.playerTracker.isBot) bCount++;
            else if (client.playerTracker.isMi) mCount++;
            else pCount++;
            while (client.playerTracker.cells.length > 0) gameServer.removeNode(client.playerTracker.cells[0]);
        }
        Log.print("Killed " + pCount + " players, " + bCount + " bots, and " + mCount + " minions.");
    },
    mass: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            mass = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(mass)) return Log.warn("Please specify a valid mass number.");
        var size = Math.sqrt(100 * mass);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (var cell of client.cells) cell.setSize(size);
        Log.print("Set mass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    },
    calc: function(gameServer, split) {
        var num = parseInt(split[1], 10);
        if (isNaN(num)) return Log.warn("Please specify a valid number.");
        var to = split[2];
        if (to !== "mass" && to !== "size") return Log.warn("Please specify either 'mass' or 'size'.");
        if (to === "mass") Log.print("The specified size is " + num * num / 100 + " in mass.");
        else Log.print("The specified mass is " + (Math.sqrt(num * 100)).toFixed(6) + " in size.");
    },
    spawnmass: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        var mass = Math.max(parseInt(split[2], 10), 9),
            size = Math.sqrt(100 * mass);
        if (isNaN(mass)) return Log.warn("Please specify a valid mass.");
        client.spawnMass = size;
        Log.print("Set spawn mass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    },
    speed: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            speed = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(speed)) return Log.warn("Please specify a valid speed.");
        client.customSpeed = speed;
        Log.print("Set move speed of " + trimName(client._name) + " to " + !speed ? gameServer.config.playerSpeed : speed + ".");
    },
    merge: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (client.cells.length === 1) return Log.warn("This player is already merged.");
        client.mergeOverride = !client.mergeOverride;
        Log.print(trimName(client._name) + " is " + (client.mergeOverride ? "now" : "no longer") + " merging.");
    },
    rec: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        client.recMode = !client.recMode;
        Log.print(trimName(client._name) + " is " + (client.recMode ? "now" : "no longer") + " in supersplitter mode.");
    },
    split: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            amount = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(amount)) return Log.warn("Please specify a valid split count.");
        if (amount > gameServer.config.playerMaxCells) amount = gameServer.config.playerMaxCells;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (client.cells.length >= gameServer.config.playerMaxCells) return Log.warn("That player has reached the splitting limit of " + gameServer.config.playerMaxCells + ".");
        for (var i = 0; i < amount; i++) gameServer.splitCells(client);
        Log.print("Forced " + trimName(client._name) + " to split " + amount + " times.");
    },
    name: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            name = split.slice(2, split.length).join(" ");
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (typeof name === "undefined") return Log.warn("Please type a valid name.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        Log.print("Changing " + trimName(client._name) + " to " + name + ".");
        client.setName(name);
    },
    unban: function(gameServer, split) {
        if (split.length < 2 || !split[1] || split[1].trim().length < 1) return Log.warn("Please specify a valid IP.");
        var ip = split[1].trim(),
            index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) return Log.warn("The specified IP " + ip + " is not in the ban list.");
        gameServer.ipBanList.splice(index, 1);
        saveIpBanList(gameServer);
        Log.print("Unbanned IP: " + ip + ".");
    },
    freeze: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        client.frozen = !client.frozen;
        Log.print((client.frozen ? "Froze " : "Unfroze") + trimName(client._name) + ".");
    },
    getcolor: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.print("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        Log.print("That player's RGB color is (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
    },
    teleport: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        var pos = {
            x: parseInt(split[2], 10),
            y: parseInt(split[3], 10)
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Please specify valid coordinates.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (var cell of client.cells) {
            cell.position.x = pos.x;
            cell.position.y = pos.y;
            gameServer.updateNodeQuad(cell);
        }
        Log.print("Teleported " + trimName(client._name) + " to (" + pos.x + " , " + pos.y + ").");
    },
    spawn: function(gameServer, split) {
        var entity = split[1];
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn("Please specify either 'virus', 'food', or 'mothercell'.");
        var pos = {
                x: parseInt(split[2], 10),
                y: parseInt(split[3], 10)
            },
            mass = parseInt(split[4], 10);
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Please specify valid coordinates.");
        var size = 1;
        if (entity === "virus") size = gameServer.config.virusMinSize;
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
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode.");
            var mother = new Entity.MotherCell(gameServer, null, pos, size);
            gameServer.addNode(mother);
            Log.print("Spawned a mothercell at (" + pos.x + " , " + pos.y + ").");
        }
    },
    replace: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            entity = split[2];
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn("Please specify either 'virus', 'food', or 'mothercell'.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (entity === "mothercell" && gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode.");
        while (client.cells.length > 0) {
            var cell = client.cells[0];
            if (entity === "virus") {
                var virus = new Entity.Virus(gameServer, null, cell.position, cell._size);
                gameServer.addNode(virus);
            } else if (entity === "food") {
                var food = new Entity.Food(gameServer, null, cell.position, cell._size);
                food.color = gameServer.randomColor();
                gameServer.addNode(food);
            } else if (entity === "mothercell") {
                var mother = new Entity.MotherCell(gameServer, null, cell.position, cell._size);
                gameServer.addNode(mother);
            }
            gameServer.removeNode(cell);
        }
        if (entity === "food") Log.print("Replaced " + trimName(client._name) + " with food cells.");
        else if (entity === "virus") Log.print("Replaced " + trimName(client._name) + " with viruses.");
        else if (entity === "mothercell") Log.print("Replaced " + trimName(client._name) + " with mothercells.");
    },
    virus: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        var virus = new Entity.Virus(gameServer, null, client.centerPos, gameServer.config.virusMinSize);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        gameServer.addNode(virus);
        Log.print("Spawned a virus under " + trimName(client._name) + ".");
    },
    mute: function(gameServer, split) {
        var id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        client.isMuted = !client.isMuted;
        Log.print(client.isMuted ? "Muted " : "Unmuted " + trimName(client._name) + " successfully.");
    },
    playerlist: function(gameServer) { // Add fancy borders?
        if (gameServer.clients.length <= 0) return Log.print("No bots or players are currently connected to the server.");
        Log.info("Total players connected: " + gameServer.clients.length + ".");
        Log.print(" ID     | IP              |  P  | CELLS | SCORE  |   POSITION   | " + fillChar("NICK", " ", gameServer.config.playerMaxNick) + " ");
        Log.print(fillChar("", "─", " ID     | IP              | CELLS | SCORE  |   POSITION   |   |  ".length + gameServer.config.playerMaxNick));
        var sockets = gameServer.clients.slice(0);
        sockets.sort(function(a, b) {
            return a.playerTracker.pID - b.playerTracker.pID;
        });
        for (var i = 0; i < sockets.length; i++) {
            var socket = sockets[i],
                client = socket.playerTracker,
                id = fillChar(client.pID, " ", 6, 1),
                ip = client.isMi ? "[MINION]" : client.isBot ? "[BOT]" : socket.isConnected ? socket.remoteAddress : "[UNKNOWN]";
            ip = fillChar(ip, " ", 15);
            var protocol = gameServer.clients[i].packetHandler.protocol;
            if (!protocol) protocol = "N/A";
            else protocol = " " + protocol + " ";
            var nick = "",
                cells = "",
                score = "",
                position = "",
                data = "",
                target = null;
            if (socket.closeReason != null) {
                var reason = "[DISCONNECTED] ";
                if (socket.closeReason.code) reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message) reason += socket.closeReason.message;
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected && !client.isMi) Log.print(" " + id + " | " + ip + " | " + protocol + " | " + "[CONNECTING]");
            else if (client.isSpectating) {
                nick = "in free-roam";
                if (!client.freeRoam) {
                    target = client.getSpecTarget();
                    if (target) nick = trimName(target._name);
                }
                data = fillChar(trimName(client._name) + " is spectating " + nick, "-", " | CELLS | SCORE  | POSITION    ".length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            } else if (client.cells.length) {
                target = client.getSpecTarget();
                nick = fillChar(trimName(client._name), " ", gameServer.config.playerMaxNick);
                cells = fillChar(client.cells.length, " ", 5, 1);
                score = fillChar(client._score / 100 >> 0, " ", 6, 1);
                position = fillChar(client.centerPos.x >> 0, " ", 5, 1) + ", " + fillChar(client.centerPos.y >> 0, " ", 5, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + cells + " | " + score + " | " + position + " | " + nick);
            } else {
                data = fillChar("DEAD OR NOT PLAYING", "-", " | CELLS | SCORE  | POSITION    ".length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            }
        }
    },
    // Non-player commands
    lms: function(gameServer) {
        gameServer.disableSpawn = !gameServer.disableSpawn;
        Log.print("Last man standing has been " + (gameServer.disableSpawn ? "enabled" : "disabled") + ".");
    },
    pause: function(gameServer) {
        gameServer.running = !gameServer.running;
        Log.print((gameServer.running ? "Unpaused" : "Paused") + " the game.");
    },
    reload: function(gameServer) {
        gameServer.loadConfig();
        gameServer.loadBanList();
        Log.print("Reloaded all configuration files.");
    },
    status: function(gameServer) { // Add fancy borders?
        var ini = require("./ini.js"),
            humans = 0,
            bots = 0,
            mem = process.memoryUsage();
        for (var client of gameServer.clients) {
            if ("_socket" in client) humans++;
            else bots++;
        }
        var scores = [];
        for (var client of gameServer.clients) {
            var totalMass = 0;
            for (var cell of client.playerTracker.cells) totalMass += gameServer.sizeToMass(cell._size);
            scores.push(totalMass);
        }
        if (!gameServer.clients.length) scores = [0];
        Log.print("-----------------STATUS------------------"),
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
        Log.print("-----------------------------------------");
    },
    debug: function(gameServer) { // Add fancy borders?
        Log.print("-----------------NODES------------------"),
        Log.print("Total nodes: " + gameServer.nodesAll.length + "."),
        Log.print("Player nodes: " + gameServer.nodesPlayer.length + "."),
        Log.print("Virus nodes: " + gameServer.nodesVirus.length + "."),
        Log.print("Ejected nodes: " + gameServer.nodesEject.length + "."),
        Log.print("Food nodes: " + gameServer.nodesFood.length + ".");
        Log.print("MotherCell nodes: " + (gameServer.gameMode.ID === 2 ? gameServer.gameMode.mothercells.length : "0") + ".");
        Log.print("----------------------------------------");
    },
    gamemode: function(gameServer,split) { // Add text support instead of game mode ID?
        try {
            var id = parseInt(split[1], 10),
                gameMode = GameMode.get(id);
            gameServer.gameMode.onChange(gameServer);
            gameServer.gameMode = gameMode;
            gameServer.gameMode.onServerInit(gameServer);
            Log.print("Changed the game mode to " + gameServer.gameMode.name + ".");
        } catch (e) {
            Log.warn("Please select a valid game mode.");
        }
    },
    eval: function(gameServer, split) {
        try {
            var string = split.slice(1, split.length).join(" ");
            Log.info("Running code...");
            Log.print("[OUTPUT] " + eval(string));
        } catch (e) {
            Log.warn("An error occurred while trying to run the code:");
            Log.error(e);
        }
    },
    // Command aliases
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
    ka: function(gameServer) {
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

module.exports = Commands;
