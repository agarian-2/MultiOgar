const Log = require("./Logger"),
    Entity = require("../entity"),
    GameMode = require("../gamemodes"),
    QuadNode = require('./QuadNode.js');

const trimName = name => !name ? "An unnamed cell" : name.trim();
const saveIpBanList = gameServer => {
    let fs = require("fs");
    try {
        let banlist = fs.createWriteStream('../src/ipbanlist.txt');
        gameServer.ipBanList.sort().forEach(v => {
            banlist.write(v + '\n');
        });
        banlist.end();
        Log.info(gameServer.ipBanList.length + " IP ban records saved.");
    } catch (e) {
        Log.error(e.stack);
        Log.error("Failed to save " + '../src/ipbanlist.txt' + ": " + e.message + "!");
    }
};
const ban = (gameServer, split, ip) => {
    let ipBin = ip.split('.');
    if (ipBin.length !== 4) return Log.warn("Invalid IP format: " + ip + "!");
    gameServer.ipBanList.push(ip);
    if (ipBin[2] === "*" || ipBin[3] === "*") Log.print("The IP sub-net " + ip + " has been banned.");
    else Log.print("The IP " + ip + " has been banned.");
    gameServer.clients.forEach(socket => {
        if (!socket || !socket.isConnected || !gameServer.checkIpBan(ip) || socket.remoteAddress !== ip) return;
        Commands.list.kill(gameServer, split);
        socket.close(null, "You're banned from the server!");
        let name = trimName(socket.playerTracker._name);
        Log.print("Banned: \"" + name + "\" with Player ID " + socket.playerTracker.pID + ".");
        gameServer.sendChatMSG(null, null, "Banned \"" + name + "\".");
    }, gameServer);
    saveIpBanList(gameServer);
};
const fillChar = (data, char, fieldLength, rTL) => {
    let result = data.toString();
    if (rTL === 1)
        for (let i = result.length; i < fieldLength; i++) result = char.concat(result);
    else for (let i = result.length; i < fieldLength; i++) result = result.concat(char);
    return result;
};
const clientByID = (id, gameServer) => {
    if (!id) return null;
    for (let i = 0; i < gameServer.clients.length; i++) {
        let client = gameServer.clients[i].playerTracker;
        if (client.pID === id) return client;
    }
    return null;
};

class Commands {
    constructor() {
        this.list = {};
    }
}

Commands.list = {
    help: () => {
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
    shortcuts: () => {
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
    gamemodes: () => {
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
    ophelp: () => {
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
    op: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
        if (client.isBot) return Log.warn("You cannot OP a bot!");
        if (client.isMinion || client.isMi) return Log.warn("You cannot OP a minion!");
        client.OP.enabled = !client.OP.enabled;
        let OP = client.OP.enabled ? "now" : "no longer";
        Log.print(trimName(client._name) + " " + OP + " has OP mode.");
    },
    restart: gameServer => {
        for (let i = 0; i < gameServer.clients.length; i++) gameServer.clients[i].close();
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
    clear: () => {
        process.stdout.write("\u001b[2J\u001b[0;0H");
        Log.print("Console output has been cleared.");
    },
    chat: (gameServer, split) => {
        gameServer.broadcastMSG(String(split.slice(1, split.length).join(" ")));
        Log.print("Sending your message to all players.");
    },
    border: (gameServer, split) => {
        let width = split[1],
            height = split[2];
        if (isNaN(width) || isNaN(height)) return Log.warn("Please specify a valid border width/height!");
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.setBorder(width, height);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        Log.print("Map borders have been changed to (" + width + ", " + height + ").");
    },
    reset: (gameServer, split) => {
        let ent = split[1];
        if (ent !== "all" && ent !== "ejected" && ent !== "food" && ent !== "virus" && ent !== "mothercell") return Log.warn("Specify either 'food', 'virus', 'ejected', or 'mothercell'!");
        if (ent === "all") {
            Log.print("Removed " + gameServer.nodesAll.length + " entities.");
            for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
            for (let i = 0; i < gameServer.clients.length; i++) {
                let playerTracker = gameServer.clients[i].playerTracker;
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
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be cleared in experimental mode!");
            Log.print("Removed " + gameServer.gameMode.mothercells.length + " mothercells.");
            for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
        }
    },
    explode: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        for (let cell of client.cells) {
            while (cell._size > gameServer.massToSize(10)) {
                let angle = 2 * Math.PI * Math.random(),
                    loss = gameServer.config.ejectMinSize;
                if (gameServer.config.ejectMaxSize > loss) loss = Math.random() * (gameServer.config.ejectMaxSize - loss) + loss;
                let size = cell.radius - (loss + 5) * (loss + 5);
                cell.setSize(Math.sqrt(size));
                let pos = {
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
    minion: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            add = parseInt(split[2], 10),
            name = split.slice(3, split.length).join(' '),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (client.isBot || client.isMi) return Log.warn("You cannot add minions to a bot or minion!");
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
            for (let i = 0; i < add; i++) gameServer.bots.addMinion(client, name);
            Log.print("Added " + add + " minions for " + trimName(client._name) + ".");
        }
        if (client == null) return void Log.warn("Player ID (" + id + ") was not found!");
    },
    addbot: (gameServer, split) => {
        let add = parseInt(split[1], 10);
        if (isNaN(add)) return Log.warn("Please specify an amount of bots to add!");
        for (let i = 0; i < add; i++) gameServer.bots.addBot();
        Log.print("Added " + add + " player bots.");
    },
    ban: (gameServer, split) => {
        let invalid = "Please specify a valid player ID or IP address!";
        if (split[1] != null) {
            if (split[1].indexOf(".") >= 0) {
                let ip = split[1],
                    ipSplit = ip.split(".");
                for (let i in ipSplit)
                    if (!(i > 1 && "*" === ipSplit[i]) && (isNaN(ipSplit[i]) || ipSplit[i] < 0 || ipSplit[i] >= 256)) return void Log.warn(invalid);
                return 4 !== ipSplit.length ? void Log.warn(invalid) : void ban(gameServer, split, ip);
            }
            let id = parseInt(split[1], 10);
            if (isNaN(id)) return Log.warn(invalid);
            else {
                let ip = null;
                for (let client of gameServer.clients)
                    if (client != null && client.isConnected && client.playerTracker.pID === id) {
                        ip = client._socket.remoteAddress;
                        break;
                    }
                if (ip) ban(gameServer, split, ip);
                else Log.warn("Player ID " + id + " not found!");
            }
        } else Log.warn(invalid);
    },
    banlist: gameServer => {
        Log.print("Showing " + gameServer.ipBanList.length + " banned IPs: "),
        Log.print(" IP              | IP "),
        Log.print("───────────────────────────────────");
        for (let i = 0; i < gameServer.ipBanList.length; i += 2)
            Log.print(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " + (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1]));
    },
    kickbot: (gameServer, split) => {
        let toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        let removed = 0;
        for (let client of gameServer.clients) {
            if (client.isConnected != null) continue;
            if (client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No bots are in the server!");
        else Log.print("Kicked " + removed + " bots.");
    },
    kickmi: (gameServer, split) => {
        let toRemove = parseInt(split[1], 10);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        let removed = 0;
        for (let client of gameServer.clients) {
            if (!client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No minions are in the server!");
        else Log.print("Kicked " + removed + " minions.");
    },
    board: (gameServer, split) => {
        let newLB = [],
            input = split[1],
            maxLB = gameServer.config.serverMaxLB;
        if (split.length > maxLB + 1) return Log.warn("The limit for lines of text on the leaderboard is " + maxLB + "!");
        for (let i = 1; i < split.length; i++) {
            if (split[i]) newLB[i - 1] = split[i];
            else newLB[i - 1] = " ";
        }
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.updateLB = gameServer => {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        if (input !== "reset") {
            Log.print("Successfully changed leaderboard values.");
            Log.print("Enter 'board reset' to reset leaderboard.");
        } else {
            let gameMode = GameMode.get(gameServer.gameMode.ID);
            gameServer.gameMode.packetLB = gameMode.packetLB;
            gameServer.gameMode.updateLB = gameMode.updateLB;
            Log.print("Successfully reset leaderboard.");
        }
    },
    change: (gameServer, split) => {
        if (split.length < 3) return Log.warn("Please specify a valid value for this config!");
        let key = split[1],
            value = split[2];
        if (value.indexOf('.') !== -1) value = parseFloat(value);
        else value = parseInt(value, 10);
        if (value == null || isNaN(value)) return Log.warn("Invalid value: " + value + "!");
        if (!gameServer.config.hasOwnProperty(key)) return Log.warn("Unknown config value: " + key + "!");
        gameServer.config[key] = value;
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Log.setVerbosity(gameServer.config.logVerbosity);
        Log.setFileVerbosity(gameServer.config.logFileVerbosity);
        Log.print("Set " + key + " to " + gameServer.config[key]);
    },
    color: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        let color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2], 10), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3], 10), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4], 10), 255), 0);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) return Log.warn("Please specify a valid RGB color!");
        client.color = color;
        for (let cell of client.cells) cell.color = color;
        Log.print("Changed " + trimName(client._name) + "'s color to (" + color.r + ", " + color.g + ", " + color.b + ").");
    },
    exit: gameServer => {
        gameServer.broadcastMSG("The server is closing!");
        Log.warn("Closing server...");
        gameServer.wsServer.close();
        process.exit(1);
    },
    kick: (gameServer, split) => {
        let id = parseInt(split[1], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        let count = 0;
        gameServer.clients.forEach(socket => {
            if (socket.isConnected === false) return;
            if (id !== 0 && socket.playerTracker.pID !== id) return;
            Commands.list.kill(gameServer, split);
            socket.close(1000, "You were kicked from server!");
            let name = trimName(socket.playerTracker._name);
            Log.print("Kicked \"" + name + "\" from the server.");
            gameServer.sendChatMSG(null, null, "Kicked \"" + name + "\" from the server.");
            count++;
        }, this);
        if (count > 0) return;
        if (!id) Log.warn("Please specify a valid IP!");
        else Log.warn("Player ID (" + id + ") was not found!");
    },
    kill: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        let count = 0;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        while (client.cells.length > 0) {
            gameServer.removeNode(client.cells[0]);
            count++;
        }
        Log.print("Killed " + trimName(client._name) + " and removed " + count + " cells.");
    },
    killall: gameServer => {
        let pCount = 0,
            bCount = 0,
            mCount = 0;
        for (let client of gameServer.clients) {
            if (client.playerTracker.isBot) bCount++;
            else if (client.playerTracker.isMi) mCount++;
            else pCount++;
            while (client.playerTracker.cells.length > 0) gameServer.removeNode(client.playerTracker.cells[0]);
        }
        Log.print("Killed " + pCount + " players, " + bCount + " bots, and " + mCount + " minions.");
    },
    mass: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            mass = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (isNaN(mass)) return Log.warn("Please specify a valid mass number!");
        let size = Math.sqrt(100 * mass);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        for (let cell of client.cells) cell.setSize(size);
        Log.print("Set mass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    },
    calc: (gameServer, split) => {
        let num = parseInt(split[1], 10);
        if (isNaN(num)) return Log.warn("Please specify a valid number!");
        let to = split[2];
        if (to !== "mass" && to !== "size") return Log.warn('Please specify either "mass" or "size"!');
        if (to === "mass") Log.print("The specified size is " + num * num / 100 + " in mass.");
        else Log.print("The specified mass is " + (Math.sqrt(num * 100)).toFixed(6) + " in size.");
    },
    spawnmass: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        let mass = Math.max(parseInt(split[2], 10), 9),
            size = Math.sqrt(100 * mass);
        if (isNaN(mass)) return Log.warn("Please specify a valid mass!");
        client.spawnMass = size;
        Log.print("Set spawnMass of " + trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    },
    speed: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            speed = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (isNaN(speed)) return Log.warn("Please specify a valid speed!");
        client.customSpeed = speed;
        Log.print("Set base speed mult of " + trimName(client._name) + " to " + !speed ? gameServer.config.playerSpeed : speed + ".");
    },
    merge: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        if (client.cells.length === 1) return Log.warn("This player is already merged!");
        client.mergeOverride = !client.mergeOverride;
        Log.print(trimName(client._name) + " is " + (client.mergeOverride ? "now" : "no longer") + " merging.");
    },
    rec: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        client.recMode = !client.recMode;
        Log.print(trimName(client._name) + " is " + (client.recMode ? "now" : "no longer") + " in rec mode.");
    },
    split: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            amount = parseInt(split[2], 10);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (isNaN(amount)) return Log.warn("Please specify a valid split count!");
        if (amount > gameServer.config.playerMaxCells) amount = gameServer.config.playerMaxCells;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        if (client.cells.length >= gameServer.config.playerMaxCells) return Log.warn("That player has reached the splitting limit of " + gameServer.config.playerMaxCells + "!");
        for (let i = 0; i < amount; i++) gameServer.splitCells(client);
        Log.print("Forced " + trimName(client._name) + " to split " + amount + " times.");
    },
    name: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            name = split.slice(2, split.length).join(' ');
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (typeof name === 'undefined') return Log.warn("Please type a valid name!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        Log.print("Changing " + trimName(client._name) + " to " + trimName(name) + ".");
        client.setName(name);
    },
    unban: (gameServer, split) => {
        if (split.length < 2 || !split[1] || split[1].trim().length < 1) return Log.warn("Please specify a valid IP!");
        let ip = split[1].trim(),
            index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) return Log.warn("The specified IP " + ip + " is not in the ban list!");
        gameServer.ipBanList.splice(index, 1);
        saveIpBanList(gameServer);
        Log.print("Unbanned IP: " + ip + ".");
    },
    playerlist: gameServer => {
        if (gameServer.clients.length <= 0) return Log.warn("No bots or players are currently connected to the server!");
        Log.info("Total players connected: " + gameServer.clients.length + '.');
        Log.print(" ID     | IP              |  P  | CELLS | SCORE  |   POSITION   | " + fillChar('NICK', ' ', gameServer.config.playerMaxNick) + " ");
        Log.print(fillChar('', '─', ' ID     | IP              | CELLS | SCORE  |   POSITION   |   |  '.length + gameServer.config.playerMaxNick));
        let sockets = gameServer.clients.slice(0);
        sockets.sort((a, b) => a.playerTracker.pID - b.playerTracker.pID);
        for (let i = 0; i < sockets.length; i++) {
            let socket = sockets[i],
                client = socket.playerTracker,
                id = fillChar(client.pID, ' ', 6, 1),
                ip = client.isMi ? "[MINION]" : client.isBot ? "[BOT]" : socket.isConnected ? socket.remoteAddress : "[UNKNOWN]";
            ip = fillChar(ip, ' ', 15);
            let protocol = gameServer.clients[i].packetHandler.protocol;
            if (!protocol) protocol = "N/A";
            else protocol += " ";
            let nick = '',
                cells = '',
                score = '',
                position = '',
                data = '',
                target = null;
            if (socket.closeReason != null) {
                let reason = "[DISCONNECTED] ";
                if (socket.closeReason.code) reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message) reason += socket.closeReason.message;
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected && !client.isMi) Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + "[CONNECTING]");
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
                data = fillChar('DEAD OR NOT PLAYING', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " |  " + protocol + " | " + data);
            }
        }
    },
    getcolor: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.print("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        Log.print(trimName(client._name) + "'s RGB color is (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
    },
    lms: gameServer => {
        gameServer.disableSpawn = !gameServer.disableSpawn;
        Log.print("Last man standing has been " + (gameServer.disableSpawn ? "enabled" : "disabled") + ".");
    },
    pause: gameServer => {
        gameServer.running = !gameServer.running;
        Log.print((gameServer.running ? "Unpaused" : "Paused") + " the game.");
    },
    freeze: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        client.frozen = !client.frozen;
        Log.print((client.frozen ? "Froze " : "Unfroze ") + trimName(client._name) + ".");
    },
    reload: gameServer => {
        gameServer.loadConfig();
        gameServer.loadBanList();
        Log.print("Reloaded the configuration files succesully.");
    },
    status: gameServer => {
        let ini = require('./ini.js'),
            humans = 0,
            bots = 0,
            mem = process.memoryUsage();
        for (let client of gameServer.clients) {
            if ('_socket' in client) humans++;
            else bots++;
        }
        let scores = [];
        for (let client of gameServer.clients) {
            let totalMass = 0;
            for (let cell of client.playerTracker.cells) totalMass += gameServer.sizeToMass(cell._size);
            scores.push(totalMass);
        }
        if (!gameServer.clients.length) scores = [0];
        Log.print("Connected Players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnect + "."),
        Log.print("Total Players: " + humans + "."),
        Log.print("Total Bots: " + bots + "."),
        Log.print("Average Score: " + (scores.reduce((x, y) => x + y) / scores.length).toFixed(2) + "."),
        Log.print("Server Uptime: " + Math.floor(process.uptime() / 60) + " minutes."),
        Log.print("Current Memory Usage: " + Math.round(mem.heapUsed / 1048576 * 10) / 10 + "/" + Math.round(mem.heapTotal / 1048576 * 10) / 10 + " MB."),
        Log.print("Current Game Mode: " + gameServer.gameMode.name + "."),
        Log.print("Current Update Time: " + gameServer.updateTimeAvg.toFixed(3) + " ms (" + ini.getLagMessage(gameServer.updateTimeAvg) + ").");
    },
    teleport: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        let pos = {
            x: parseInt(split[2], 10),
            y: parseInt(split[3], 10)
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Invalid coordinates!");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        for (let cell of client.cells) {
            cell.position.x = pos.x;
            cell.position.y = pos.y;
            gameServer.updateNodeQuad(cell);
        }
        Log.print("Teleported " + trimName(client._name) + " to (" + pos.x + " , " + pos.y + ").");
    },
    spawn: (gameServer, split) => {
        let entity = split[1];
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn('Please specify either "virus", "food", or "mothercell"!');
        let pos = {
                x: parseInt(split[2], 10),
                y: parseInt(split[3], 10)
            },
            mass = parseInt(split[4], 10);
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Invalid coordinates!");
        let size = 1;
        if (entity === "virus") size = gameServer.config.virusMinSize;
        else if (entity === "mothercell") size = gameServer.config.virusMinSize * 2.5;
        else if (entity === "food") size = gameServer.config.foodMinMass;
        if (!isNaN(mass)) size = Math.sqrt(mass * 100);
        if (entity === "virus") {
            let virus = new Entity.Virus(gameServer, null, pos, size);
            gameServer.addNode(virus);
            Log.print("Spawned a virus at (" + pos.x + " , " + pos.y + ").");
        } else if (entity === "food") {
            let food = new Entity.Food(gameServer, null, pos, size);
            food.color = gameServer.randomColor();
            gameServer.addNode(food);
            Log.print("Spawned a food cell at (" + pos.x + " , " + pos.y + ").");
        } else if (entity === "mothercell") {
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode!");
            let mother = new Entity.MotherCell(gameServer, null, pos, size);
            gameServer.addNode(mother);
            Log.print("Spawned a mothercell at (" + pos.x + " , " + pos.y + ").");
        }
    },
    replace: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer),
            entity = split[2];
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn('Please specify either "virus", "food", or "mothercell"!');
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        if (entity === "mothercell" && gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode!");
        while (client.cells.length > 0) {
            let cell = client.cells[0];
            if (entity === "virus") {
                let virus = new Entity.Virus(gameServer, null, cell.position, cell._size);
                gameServer.addNode(virus);
            } else if (entity === "food") {
                let food = new Entity.Food(gameServer, null, cell.position, cell._size);
                food.color = gameServer.randomColor();
                gameServer.addNode(food);
            } else if (entity === "mothercell") {
                let mother = new Entity.MotherCell(gameServer, null, cell.position, cell._size);
                gameServer.addNode(mother);
            }
            gameServer.removeNode(cell);
        }
        if (entity === "food") Log.print("Replaced " + trimName(client._name) + " with food cells.");
        else if (entity === "virus") Log.print("Replaced " + trimName(client._name) + " with viruses.");
        else if (entity === "mothercell") Log.print("Replaced " + trimName(client._name) + " with mothercells.");
    },
    virus: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found!");
        let virus = new Entity.Virus(gameServer, null, client.centerPos, gameServer.config.virusMinSize);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game!");
        gameServer.addNode(virus);
        Log.print("Spawned a virus under " + trimName(client._name) + ".");
    },
    debug: gameServer => {
        Log.print("-----------------NODES------------------"),
        Log.print("Total nodes: " + gameServer.nodesAll.length + "."),
        Log.print("Player nodes: " + gameServer.nodesPlayer.length + "."),
        Log.print("Virus nodes: " + gameServer.nodesVirus.length + "."),
        Log.print("Ejected nodes: " + gameServer.nodesEject.length + "."),
        Log.print("Food nodes: " + gameServer.nodesFood.length + ".");
        Log.print("MotherCell nodes: " + (gameServer.gameMode.ID === 2 ? gameServer.gameMode.mothercells.length : "0") + ".");
        Log.print("----------------------------------------");
    },
    mute: (gameServer, split) => {
        let id = parseInt(split[1], 10),
            client = clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (client == null) return Log.warn("That player ID (" + id + ") is non-existant!");
        client.isMuted = !client.isMuted;
        Log.print(client.isMuted ? "Muted " : "Unmuted " + trimName(client._name) + " successfully.");
    },
    gamemode: (gameServer,split) => {
        try {
            let id = parseInt(split[1], 10),
                gameMode = GameMode.get(id);
            gameServer.gameMode.onChange(gameServer);
            gameServer.gameMode = gameMode;
            gameServer.gameMode.onServerInit(gameServer);
            Log.print("Changed the game mode to " + gameServer.gameMode.name + ".");
        } catch (e) {
            Log.warn("Invalid game mode selected!");
        }
    },
    eval: (gameServer, split) => { // gonna make the output later
        try {
            const string = split.slice(1, split.length).join(' ');
            Log.info('Running code...');
            Log.print('[OUTPUT] ' + eval(string));
        } catch (e) {
            Log.warn("An error occurred while trying to run the code:");
            Log.error(e);
        }
    },
    pl: gameServer => {
        Commands.list.playerlist(gameServer);
    },
    m: (gameServer, split) => {
        Commands.list.mass(gameServer, split);
    },
    e: (gameServer, split) => {
        Commands.list.explode(gameServer, split);
    },
    sm: (gameServer, split) => {
        Commands.list.spawnmass(gameServer, split);
    },
    ka: (gameServer, split) => {
        Commands.list.killall(gameServer);
    },
    k: (gameServer, split) => {
        Commands.list.kill(gameServer, split);
    },
    s: (gameServer, split) => {
        Commands.list.speed(gameServer, split);
    },
    f: (gameServer, split) => {
        Commands.list.freeze(gameServer, split);
    },
    ab: (gameServer, split) => {
        Commands.list.addbot(gameServer, split);
    },
    kb: (gameServer, split) => {
        Commands.list.kickbot(gameServer, split);
    },
    c: (gameServer, split) => {
        Commands.list.change(gameServer, split);
    },
    tp: (gameServer, split) => {
        Commands.list.teleport(gameServer, split);
    },
    rp: (gameServer, split) => {
        Commands.list.replace(gameServer, split);
    },
    stats: gameServer => {
        Commands.list.status(gameServer);
    }
};

module.exports = Commands;
