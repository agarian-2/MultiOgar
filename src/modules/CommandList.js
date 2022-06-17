"use strict";
const Log = require("./Logger");
const Entity = require("../entity");
const GameMode = require("../gamemodes");
const QuadNode = require("./QuadNode.js");
const ini = require("./ini.js");
const fs = require("fs");

class CommandList {
    constructor() {
        this.list = {};
    }
    trimName(name) {
        return name.trim() || "An unnamed cell";
    }
    saveIpBanList(gameServer) {
        try {
            let banlist = fs.createWriteStream("../src/txt/ipbanlist.txt");
            for (let v of gameServer.ipBanList.sort()) banlist.write(v + "\n");
            banlist.end();
            Log.info(gameServer.ipBanList.length + " IP ban records saved.");
        } catch (e) {
            Log.error(e.stack);
            Log.error("Failed to save " + "../src/txt/ipbanlist.txt" + ": " + e.message + "!");
        }
    }
    fillChar(data, char, fieldLength, rTL) {
        let result = data.toString();
        if (rTL === 1)
            for (let i = result.length; i < fieldLength; i++) result = char.concat(result);
        else for (let i = result.length; i < fieldLength; i++) result = result.concat(char);
        return result;
    }
    clientByID(id, gameServer) {
        if (!id) return null;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i].playerTracker;
            if (client.pID === id) return client;
        }
        return null;
    }
    help() {
        Log.print("┌──────────────────────────────┐"),
        Log.print("│  [32mLIST OF AVAILABLE COMMANDS[0m  │"),
        Log.print("├──────────────────────────────┼───────────────────────────────────────────┐"),
        Log.print("│  [32mCOMMAND TO INPUT:[0m    ┌──────┴────────┐  [32mDESTRIPTION OF COMMAND:[0m         │"),
        Log.print("├───────────────────────┤  [33mAI Commands[0m  ├──────────────────────────────────┤"),
        Log.print("│                       └──────┬────────┘                                  │"),
        Log.print("│ addbot [number]              │ Add bots to the server.                   │"),
        Log.print("│ kickbot [number optional]    │ Kick some or all bots from the server.    │"),
        Log.print("│ minion [playerID] [#] [name] │ Give minions to a specified player.       │"),
        Log.print("│                       ┌──────┴──────────┐                                │"),
        Log.print("├───────────────────────┤ [33mPlayer Commands[0m ├────────────────────────────────┤"),
        Log.print("│                       └──────┬──────────┘                                │"),
        Log.print("│ kick [playerID]              │ Kick a player or bot.                     │"),
        Log.print("│ kill [playerID]              │ Kill a player or bot.                     │"),
        Log.print("│ kickall                      │ Kick all players and bots.                │"),
        Log.print("│ killall                      │ Kill all players and bots.                │"),
        Log.print("│ ban [playerID │ IP]          │ IP ban a player.                          │"),
        Log.print("│ unban [IP]                   │ Unban an IP.                              │"),
        Log.print("│ banlist                      │ Show a list of banned IPs.                │"),
        Log.print("│ mute [playerID]              │ Mute a player from using the chat.        │"),
        Log.print("│ color [playerID] [R] [G] [B] │ Set color for a player.                   │"),
        Log.print("│ getcolor [Player ID]         │ Get a player's RGB color.                 │"),
        Log.print("| explode [playerID]           | Explode a player into ejected mass.       |"),
        Log.print("│ freeze [playerID]            │ Freeze a player.                          │"),
        Log.print("│ spawn [ent] [X] [Y] [mass]   │ Spawn an entity of choice.                │"),
        Log.print("│ mass [playerID] [mass]       │ Set a player's mass.                      │"),
        Log.print("│ merge [playerID]             │ Force a player to merge.                  │"),
        Log.print("│ spawnmass [playerID] [mass]  │ Set a players spawn mass.                 │"),
        Log.print("│ speed [playerID] [speed]     │ Set a players move speed.                 │"),
        Log.print("│ name [playerID] [name]       │ Change a player's name.                   │"),
        Log.print("│ rec [playerID]               │ Give a player supersplitter mode.         │"),
        Log.print("│ split [playerID] [amount]    │ Force a player to split.                  │"),
        Log.print("│ teleport [X] [Y]             │ Teleport a player.                        │"),
        Log.print("│ replace [playerID] [entity]  │ Replace a player with an entity.          │"),
        Log.print("│ virus [playerID]             │ Spawn a virus undar a player.             │"),
        Log.print("│                       ┌──────┴──────────┐                                │"),
        Log.print("├───────────────────────┤ [33mServer Commands[0m ├────────────────────────────────┤"),
        Log.print("│                       └──────┬──────────┘                                │"),
        Log.print("│ gamemodes                    │ List all gamemodes and a description.     │"),
        Log.print("│ shortcuts                    │ List all available command shortcuts.     │"),
        Log.print("│ ophelp                       │ List all available OP mode keys.          │"),
        Log.print("│ playerlist                   │ Get a list of players and bots with IDs.  │"),
        Log.print("│ pause                        │ Pause the game (freeze all entities).     │"),
        Log.print("│ board [line1] [line2] ...    │ Change leaderboard text.                  │"),
        Log.print("│ change [config] [value]      │ Change specified configs.                 │"),
        Log.print("│ reload                       │ Reload config file and banlist.           │"),
        Log.print("│ restart                      │ Kick all players and reset server.        │"),
        Log.print("│ lms                          │ Enable/disable Last Man Standing mode.    │"),
        Log.print("│ border [width] [height]      │ Change the size of the map.               │"),
        Log.print("│                       ┌──────┴────────┐                                  │"),
        Log.print("├───────────────────────┤ [33mMiscellaneous[0m ├──────────────────────────────────┤"),
        Log.print("│                       └──────┬────────┘                                  │"),
        Log.print("│ clear                        │ Clear console output.                     │"),
        Log.print("│ reset [entity optional]      │ Remove some or all entities.              │"),
        Log.print("│ status                       │ Get server uptime status.                 │"),
        Log.print("│ debug                        │ List how much of each entity there is.    │"),
        Log.print("│ eval                         │ Run some code.                            │"),
        Log.print("│ exit                         │ Shut down the server.                     │"),
        Log.print("└──────────────────────────────────────────────────────────────────────────┘");
    }
    shortcuts() {
        Log.print("┌─────────────────────────────┐"),
        Log.print("│  [32mLIST OF COMMAND SHORTCUTS[0m  │"),
        Log.print("├─────────────────────────────┼────────────────────────────────────────────┐"),
        Log.print("│ [33mpl[0m                          │ Alias for playerlist.                      │"),
        Log.print("│ [33mm[0m                           │ Alias for mass.                            │"),
        Log.print("│ [33msm[0m                          │ Alias for spawnmass.                       │"),
        Log.print("| [33me[0m                           | Alias for explode.                         |"),
        Log.print("│ [33mka[0m                          │ Alias for killall.                         │"),
        Log.print("│ [33mk[0m                           │ Alias for kill.                            │"),
        Log.print("│ [33ms[0m                           │ Alias for speed.                           │"),
        Log.print("│ [33mf[0m                           │ Alias for freeze.                          │"),
        Log.print("│ [33mab[0m                          │ Alias for addbot.                          │"),
        Log.print("│ [33mkb[0m                          │ Alias for kickbot.                         │"),
        Log.print("│ [33mc[0m                           │ Alias for change.                          │"),
        Log.print("│ [33mrp[0m                          │ Alias for replace.                         │"),
        Log.print("│ [33mtp[0m                          │ Alias for teleport.                        │"),
        Log.print("│ [33mstats[0m                       │ Alias for status.                          │"),
        Log.print("└─────────────────────────────┴────────────────────────────────────────────┘");
    }
    gamemodes() {
        Log.print("┌───────────────────┐"),
        Log.print("│ [32mLIST OF GAMEMODES[0m │"),
        Log.print("├───────────────────┼───────────────────────────────────────────────────────────────────────────┐"),
        Log.print("│ [33mFree For All[0m      │ The original gamemode, with agar.io's basic features. ID: 0.              │"),
        Log.print("│ [33mTeams[0m             │ Three teams fight for the highest overall mass. ID: 1.                    │"),
        Log.print("│ [33mExperimental[0m      │ Features a pink food spawning virus, AKA a mothercell. ID: 2.             │"),
        Log.print("│ [33mRainbow[0m           │ Free For All, but all entities have a rainbow effect. ID: 3.              │"),
        Log.print("│ [33mTournament[0m        │ Players battle to the death, last player alive wins. ID: 4.               │"),
        Log.print("│ [33mHunger Games[0m      │ Similar to Tournament, but with very limited food. ID: 5.                 │"),
        Log.print("│ [33mLast Man Standing[0m │ No players are allowed to respawn. ID: N/A, activate it by running 'lms'. │"),
        Log.print("└───────────────────┴───────────────────────────────────────────────────────────────────────────┘");
    }
    ophelp() {
        Log.print("┌──────────────┐"),
        Log.print("│ [32mOP MODE KEYS[0m │"),
        Log.print("├───┬──────────┴─────────────────┐"),
        Log.print("│ [33mE[0m │ Minions split.             │"),
        Log.print("│ [33mR[0m │ Minions eject.             │"),
        Log.print("│ [33mT[0m │ Minions freeze.            │"),
        Log.print("│ [33mP[0m │ Minions collect food.      │"),
        Log.print("│ [33mQ[0m │ Minions follow center.     │"),
        Log.print("│ [33mO[0m │ Freeze yourself.           │"),
        Log.print("│ [33mM[0m │ Merge yourself.            │"),
        Log.print("│ [33mI[0m │ Supersplitter mode.        │"),
        Log.print("│ [33mK[0m │ Suicide.                   │"),
        Log.print("│ [33mY[0m │ Gain mass.                 │"),
        Log.print("│ [33mU[0m │ Lose mass.                 │"),
        Log.print("│ [33mL[0m │ Clear non-player entities. │"),
        Log.print("│ [33mH[0m │ Explode yourself.          │"),
        Log.print("│ [33mZ[0m │ Change own color.          │"),
        Log.print("│ [33mS[0m │ Spawn virus at mouse.      │"),
        Log.print("│ [33mJ[0m │ Spawn food at mouse.       │"),
        Log.print("│ [33mB[0m │ Edit J key food color.     │"),
        Log.print("│ [33mC[0m │ Edit J key food size.      │"),
        Log.print("│ [33mG[0m │ Teleport to mouse.         │"),
        Log.print("│ [33mV[0m │ Eject cells at mouse.      │"),
        Log.print("│ [33mN[0m │ Spawn mothercell food.     │"),
        Log.print("│ [33mX[0m │ Rainbow mode.              │"),
        Log.print("└───┴────────────────────────────┘");
    }
    op(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (client.isBot) return Log.warn("You cannot OP a bot.");
        if (client.isMinion || client.isMi) return Log.warn("You cannot OP a minion.");
        client.OP.enabled = !client.OP.enabled;
        Log.print(this.trimName(client._name) + " " + (client.OP.enabled ? "now" : "no longer") + " has OP.");
    }
    restart(gameServer) {
        for (let i = 0; i < gameServer.clients.length; i++) gameServer.clients[i].close();
        gameServer.httpServer = gameServer.quadTree = null;
        gameServer.running = true;
        gameServer.lastNodeID = gameServer.lastPlayerID = 1;
        gameServer.tickCount = 0;
        gameServer.startTime = Date.now();
        gameServer.setBorder(gameServer.config.borderWidth, gameServer.config.borderHeight);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.loadConfig();
        gameServer.loadBanList();
        Log.warn("Restarting server...");
    }
    clear() {
        process.stdout.write("\u001b[2J\u001b[0;0H");
        Log.print("Console output has been cleared.");
    }
    chat() {
        gameServer.broadcastMSG(String(split.slice(1, split.length).join(" ")));
        Log.print("Sending your message to all players.");
    }
    border(gameServer, split) {
        let width = parseInt(split[1]),
            height = parseInt(split[2]);
        if (isNaN(width) || isNaN(height)) return Log.warn("Please specify a valid border width and height.");
        for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
        for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
        for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
        gameServer.setBorder(width, height);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        Log.print("Map borders have been changed to (" + width + ", " + height + ").");
    }
    reset(gameServer, split) {
        let ent = split[1];
        if (ent !== "all" && ent !== "ejected" && ent !== "food" && ent !== "virus" && ent !== "mothercell") return Log.warn("Please specify either 'food', 'virus', 'ejected', or 'mothercell'.");
        if (ent === "all") {
            Log.print("Removed " + gameServer.nodesAll.length + " entities.");
            for (;gameServer.nodesAll.length;) gameServer.removeNode(gameServer.nodesAll[0]);
            for (;gameServer.nodesEject.length;) gameServer.removeNode(gameServer.nodesEject[0]);
            for (;gameServer.nodesFood.length;) gameServer.removeNode(gameServer.nodesFood[0]);
            for (;gameServer.nodesVirus.length;) gameServer.removeNode(gameServer.nodesVirus[0]);
            if (gameServer.gameMode.ID === 2)
                for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
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
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be cleared in experimental mode.");
            Log.print("Removed " + gameServer.gameMode.mothercells.length + " mothercells.");
            for (;gameServer.gameMode.mothercells.length;) gameServer.removeNode(gameServer.gameMode.mothercells[0]);
        }
    }
    explode(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            while (cell._size > 31.623) {
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
            cell.setSize(31.623);
        }
        Log.print("Successfully exploded " + this.trimName(client._name) + ".");
    }
    minion(gameServer, split) {
        let id = parseInt(split[1]),
            add = parseInt(split[2]),
            name = split.slice(3, split.length).join(" "),
            client = this.clientByID(id, gameServer);
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
            Log.print("Succesfully removed minions for " + this.trimName(client._name) + ".");
        } else {
            client.minion.control = true;
            if (isNaN(add)) add = 1;
            for (let i = 0; i < add; i++) gameServer.bots.addMinion(client, name);
            Log.print("Added " + add + " minions for " + this.trimName(client._name) + ".");
        }
    }
    addbot(gameServer, split) {
        let add = parseInt(split[1]);
        if (isNaN(add)) return Log.warn("Please specify an amount of bots to add.");
        for (let i = 0; i < add; i++) gameServer.bots.addBot();
        Log.print("Added " + add + " player bots.");
    }
    ban(gameServer, split) { // Ban function is missing for some reason
        let invalid = "Please specify a valid player ID or IP address.";
        if (split[1] != null) {
            if (split[1].indexOf(".") >= 0) {
                let ip = split[1],
                    ipSplit = ip.split(".");
                for (let i in ipSplit)
                    if (!(i > 1 && "*" === ipSplit[i]) && (isNaN(ipSplit[i]) || ipSplit[i] < 0 || ipSplit[i] >= 256)) return Log.warn(invalid);
                return ipSplit.length !== 4 ? Log.warn(invalid) : ban(gameServer, split, ip);
            }
            let id = parseInt(split[1]);
            if (isNaN(id)) return Log.warn(invalid);
            else {
                let ip = null;
                for (let i = 0; i < gameServer.clients.length; i++) {
                    let client = gameServer.clients[i];
                    if (client != null && client.isConnected && client.playerTracker.pID === id) {
                        ip = client._socket.remoteAddress;
                        break;
                    }
                }
                if (ip) ban(gameServer, split, ip);
                else Log.warn("Player ID " + id + " not found.");
            }
        } else Log.warn(invalid);
    }
    banlist(gameServer) {
        if (!gameServer.ipBanList.length) return Log.print("There are no banned IPs to list.");
        Log.print("Showing " + gameServer.ipBanList.length + " banned IPs: "),
        Log.print(" IP              | IP "),
        Log.print("───────────────────────────────────");
        for (let i = 0; i < gameServer.ipBanList.length; i += 2) Log.print(" " + this.fillChar(gameServer.ipBanList[i], " ", 15) + " | " + (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1]));
    }
    kickbot(gameServer, split) {
        let toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        let removed = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (client.isConnected != null) continue;
            if (client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No bots are in the server.");
        else Log.print("Kicked " + removed + " bots.");
    }
    kickmi(gameServer, split) {
        let toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) toRemove = gameServer.clients.length;
        let removed = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (!client.playerTracker.isMi) continue;
            client.close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) Log.warn("No minions are in the server.");
        else Log.print("Kicked " + removed + " minions.");
    }
    board(gameServer, split) {
        let newLB = [],
            input = split[1],
            maxLB = gameServer.config.serverMaxLB;
        if (split.length > maxLB + 1) return Log.warn("The limit for lines of text on the leaderboard is " + maxLB + ".");
        for (let i = 1; i < split.length; i++) {
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
            let gameMode = GameMode.get(gameServer.gameMode.ID);
            gameServer.gameMode.packetLB = gameMode.packetLB;
            gameServer.gameMode.updateLB = gameMode.updateLB;
            Log.print("Successfully reset leaderboard.");
        }
    }
    change(gameServer, split) {
        if (split.length < 3) return Log.warn("Please specify a valid value for this config.");
        let key = split[1],
            value = split[2];
        if (value.indexOf(".") !== -1) value = parseFloat(value);
        else value = parseInt(value);
        if (value == null || isNaN(value)) return Log.warn("Invalid value: " + value + ".");
        if (!gameServer.config.hasOwnProperty(key)) return Log.warn("Unknown config value: " + key + ".");
        gameServer.config[key] = value;
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Log.setVerbosity(gameServer.config.logVerbosity);
        Log.setFileVerbosity(gameServer.config.logFileVerbosity);
        Log.print("Set " + key + " to " + gameServer.config[key]);
    }
    color(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        let color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2]), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3]), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4]), 255), 0);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) return Log.warn("Please specify a valid RGB color.");
        client.color = color;
        for (let i = 0; i < client.cells.length; i++) client.cells[i].color = color;
        Log.print("Changed " + this.trimName(client._name) + "'s color to (" + color.r + ", " + color.g + ", " + color.b + ").");
    }
    exit(gameServer) {
        gameServer.broadcastMSG("The server is closing!");
        Log.warn("Closing server...");
        gameServer.wsServer.close();
        process.exit(1);
    }
    kick(gameServer, split) {
        let id = parseInt(split[1]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        let count = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (client.isConnected === false) return;
            if (id !== 0 && client.playerTracker.pID !== id) return;
            client.close(1000, "You were kicked from server!");
            let name = this.trimName(client.playerTracker._name);
            Log.print("Kicked " + name + " from the server.");
            count++;
        }
        if (count > 0) return;
        if (!id) Log.warn("Please specify a valid ID.");
        else Log.warn("Player ID (" + id + ") was not found.");
    }
    kickall(gameServer) {
        let pCount = 0,
            bCount = 0,
            mCount = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (client.playerTracker.isBot) bCount++;
            else if (client.playerTracker.isMi) mCount++;
            else pCount++;
            client.close(1000, "You were kicked from server!");
        }
        Log.print("Kicked " + pCount + " players, " + bCount + " bots, and " + mCount + " minions from the server.");
    }
    kill(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        let count = 0;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (;client.cells.length;) {
            gameServer.removeNode(client.cells[0]);
            count++;
        }
        Log.print("Killed " + this.trimName(client._name) + " and removed " + count + " cells.");
    }
    killall(gameServer) {
        let pCount = 0,
            bCount = 0,
            mCount = 0;
        for (let i = 0; i < gameServer.clients.length; i++) {
            let client = gameServer.clients[i];
            if (client.playerTracker.isBot) bCount++;
            else if (client.playerTracker.isMi) mCount++;
            else pCount++;
            for (;client.playerTracker.cells.length;) gameServer.removeNode(client.playerTracker.cells[0]);
        }
        Log.print("Killed " + pCount + " players, " + bCount + " bots, and " + mCount + " minions.");
    }
    mass(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer),
            mass = parseInt(split[2]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(mass)) return Log.warn("Please specify a valid mass number.");
        let size = Math.sqrt(100 * mass);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (let i = 0; i < client.cells.length; i++) client.cells[i].setSize(size);
        Log.print("Set mass of " + this.trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    }
    calc(gameServer, split) {
        let num = parseInt(split[1]);
        if (isNaN(num)) return Log.warn("Please specify a valid number.");
        let to = split[2];
        if (to !== "mass" && to !== "size") return Log.warn("Please specify either 'mass' or 'size'.");
        if (to === "mass") Log.print("The specified size is " + num * num / 100 + " in mass.");
        else Log.print("The specified mass is " + (Math.sqrt(num * 100)).toFixed(6) + " in size.");
    }
    spawnmass(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        let mass = Math.max(parseInt(split[2]), 9),
            size = Math.sqrt(100 * mass);
        if (isNaN(mass)) return Log.warn("Please specify a valid mass.");
        client.spawnMass = size;
        Log.print("Set spawn mass of " + this.trimName(client._name) + " to " + (size * size / 100).toFixed(3) + ".");
    }
    speed(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer),
            speed = parseInt(split[2]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(speed)) return Log.warn("Please specify a valid speed.");
        client.customSpeed = speed;
        Log.print("Set move speed of " + this.trimName(client._name) + " to " + (!speed ? gameServer.config.playerSpeed : speed) + ".");
    }
    merge(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (client.cells.length === 1) return Log.warn("This player is already merged.");
        client.mergeOverride = !client.mergeOverride;
        Log.print(this.trimName(client._name) + " is " + (client.mergeOverride ? "now" : "no longer") + " merging.");
    }
    rec(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        client.recMode = !client.recMode;
        Log.print(this.trimName(client._name) + " is " + (client.recMode ? "now" : "no longer") + " in supersplitter mode.");
    }
    split(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer),
            amount = parseInt(split[2]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (isNaN(amount)) return Log.warn("Please specify a valid split count.");
        if (amount > gameServer.config.playerMaxCells) amount = gameServer.config.playerMaxCells;
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (client.cells.length >= gameServer.config.playerMaxCells) return Log.warn("That player has reached the splitting limit of " + gameServer.config.playerMaxCells + ".");
        for (let i = 0; i < amount; i++) gameServer.splitCells(client);
        Log.print("Forced " + this.trimName(client._name) + " to split " + amount + " times.");
    }
    name(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer),
            name = split.slice(2, split.length).join(" ");
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (typeof name === "undefined") return Log.warn("Please type a valid name.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        Log.print("Changing " + this.trimName(client._name) + " to " + this.trimName(name) + ".");
        client.setName(name);
    }
    unban(gameServer, split) {
        if (split.length < 2 || !split[1] || split[1].trim().length < 1) return Log.warn("Please specify a valid IP.");
        let ip = split[1].trim(),
            index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) return Log.warn("The specified IP " + ip + " is not in the ban list.");
        gameServer.ipBanList.splice(index, 1);
        this.saveIpBanList(gameServer);
        Log.print("Unbanned IP: " + ip + ".");
    }
    freeze(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        client.frozen = !client.frozen;
        Log.print((client.frozen ? "Froze " : "Unfroze") + this.trimName(client._name) + ".");
    }
    getcolor(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.print("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        Log.print(this.trimName(client._name) + "'s RGB color is (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
    }
    teleport(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        let pos = {
            x: parseInt(split[2]),
            y: parseInt(split[3])
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Please specify valid coordinates.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        for (let i = 0; i < client.cells.length; i++) {
            let cell = client.cells[i];
            cell.position.x = pos.x;
            cell.position.y = pos.y;
            gameServer.updateNodeQuad(cell);
        }
        Log.print("Teleported " + this.trimName(client._name) + " to (" + pos.x + " , " + pos.y + ").");
    }
    spawn(gameServer, split) {
        let entity = split[1];
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn("Please specify either 'virus', 'food', or 'mothercell'.");
        let pos = {
                x: parseInt(split[2]),
                y: parseInt(split[3])
            },
            mass = parseInt(split[4]);
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Please specify valid coordinates.");
        let size = 1;
        if (entity === "virus") size = gameServer.config.virusMinSize;
        else if (entity === "mothercell") size = gameServer.config.virusMinSize * 2.5;
        else if (entity === "food") size = gameServer.config.foodMinMass;
        if (!isNaN(mass)) size = Math.sqrt(mass * 100);
        if (entity === "virus") {
            let virus = new Entity.Virus(gameServer, null, pos, size);
            gameServer.addNode(virus);
            Log.print("Spawned a virus at (" + pos.x + " , " + pos.y + ") with a mass of " + mass + ".");
        } else if (entity === "food") {
            let food = new Entity.Food(gameServer, null, pos, size);
            food.color = gameServer.randomColor();
            gameServer.addNode(food);
            Log.print("Spawned a food cell at (" + pos.x + " , " + pos.y + ") with a mass of " + mass + ".");
        } else if (entity === "mothercell") {
            if (gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode.");
            let mother = new Entity.MotherCell(gameServer, null, pos, size);
            gameServer.addNode(mother);
            Log.print("Spawned a mothercell at (" + pos.x + " , " + pos.y + ") with a mass of " + mass + ".");
        }
    }
    replace(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer),
            entity = split[2];
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        if (entity !== "virus" && entity !== "food" && entity !== "mothercell") return Log.warn("Please specify either 'virus', 'food', or 'mothercell'.");
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        if (entity === "mothercell" && gameServer.gameMode.ID !== 2) return Log.warn("Mothercells can only be spawned in experimental mode.");
        for (;client.cells.length;) {
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
        if (entity === "food") Log.print("Replaced " + this.trimName(client._name) + " with food cells.");
        else if (entity === "virus") Log.print("Replaced " + this.trimName(client._name) + " with viruses.");
        else if (entity === "mothercell") Log.print("Replaced " + this.trimName(client._name) + " with mothercells.");
    }
    virus(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        let virus = new Entity.Virus(gameServer, null, client.centerPos, gameServer.config.virusMinSize);
        if (!client.cells.length) return Log.warn("The specified player is not spawned in the game.");
        gameServer.addNode(virus);
        Log.print("Spawned a virus under " + this.trimName(client._name) + ".");
    }
    mute(gameServer, split) {
        let id = parseInt(split[1]),
            client = this.clientByID(id, gameServer);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID.");
        if (client == null) return Log.warn("Player ID (" + id + ") was not found.");
        client.isMuted = !client.isMuted;
        Log.print((client.isMuted ? "Muted " : "Unmuted ") + this.trimName(client._name) + " successfully.");
    }
    playerlist(gameServer) { // Add fancy borders?
        if (gameServer.clients.length <= 0) return Log.print("No bots or players are currently connected to the server.");
        Log.info("Total players connected: " + gameServer.clients.length + ".");
        Log.print(" ID     | IP              |  P  | CELLS | SCORE  |   POSITION   | " + this.fillChar("NICK", " ", gameServer.config.playerMaxNick) + " ");
        Log.print(this.fillChar("", "─", " ID     | IP              | CELLS | SCORE  |   POSITION   |   |  ".length + gameServer.config.playerMaxNick));
        let sockets = gameServer.clients.slice(0).sort((a, b) => a.playerTracker.pID - b.playerTracker.pID);
        for (let i = 0; i < sockets.length; i++) {//
            let socket = sockets[i],
                client = socket.playerTracker,
                id = this.fillChar(client.pID, " ", 6, 1),
                ip = client.isMi ? "[MINION]" : client.isBot ? "[BOT]" : socket.isConnected ? socket.remoteAddress : "[UNKNOWN]";
            ip = this.fillChar(ip, " ", 15);
            let protocol = gameServer.clients[i].packetHandler.protocol;
            if (!protocol) protocol = "N/A";
            else protocol = " " + protocol + " ";
            let nick = "",
                cells = "",
                score = "",
                position = "",
                data = "",
                target = null;
            if (socket.closeReason != null) {
                let reason = "[DISCONNECTED] ";
                if (socket.closeReason.code) reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message) reason += socket.closeReason.message;
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected && !client.isMi) Log.print(" " + id + " | " + ip + " | " + protocol + " | " + "[CONNECTING]");
            else if (client.isSpectating) {
                nick = "in free-roam";
                if (!client.freeRoam) {
                    target = client.getSpecTarget();
                    if (target) nick = this.trimName(target._name);
                }
                data = this.fillChar(this.trimName(client._name) + " is spectating " + nick, "-", " | CELLS | SCORE  | POSITION    ".length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            } else if (client.cells.length) {
                target = client.getSpecTarget();
                nick = this.fillChar(this.trimName(client._name), " ", gameServer.config.playerMaxNick);
                cells = this.fillChar(client.cells.length, " ", 5, 1);
                score = this.fillChar(client._score / 100 >> 0, " ", 6, 1);
                position = this.fillChar(client.centerPos.x >> 0, " ", 5, 1) + ", " + this.fillChar(client.centerPos.y >> 0, " ", 5, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + cells + " | " + score + " | " + position + " | " + nick);
            } else {
                data = this.fillChar("DEAD OR NOT PLAYING", "-", " | CELLS | SCORE  | POSITION    ".length + gameServer.config.playerMaxNick, 1);
                Log.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            }
        }
    }
    lms(gameServer) {
        gameServer.disableSpawn = !gameServer.disableSpawn;
        Log.print("Last man standing has been " + (gameServer.disableSpawn ? "enabled" : "disabled") + ".");
    }
    pause(gameServer) {
        gameServer.running = !gameServer.running;
        Log.print((gameServer.running ? "Unpaused" : "Paused") + " the game.");
    }
    reload(gameServer) {
        gameServer.loadConfig();
        gameServer.loadBanList();
        Log.print("Reloaded all configuration files.");
    }
    status(gameServer) { // Add fancy borders?
        let humans = 0,
            bots = 0,
            mem = process.memoryUsage();
        for (let i = 0; i < gameServer.clients.length; i++) {
            if ("_socket" in gameServer.clients[i]) humans++;
            else bots++;
        }
        let scores = [];
        for (let i = 0; i < gameServer.clients.length; i++) {
            let totalMass = 0,
                client = gameServer.clients[i].playerTracker;
            for (let j = 0; j < client.cells.length; j++) totalMass += gameServer.sizeToMass(client.cells[j]._size);
            scores.push(totalMass);
        }
        if (!gameServer.clients.length) scores = [0];
        Log.print("-----------------STATUS------------------"),
        Log.print("Connected Players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnect + "."),
        Log.print("Total Players: " + humans + "."),
        Log.print("Total Bots: " + bots + "."),
        Log.print("Average Score: " + (scores.reduce((x, y) => x + y) / scores.length).toFixed(2) + "."),
        Log.print("Server Uptime: " + Math.floor(process.uptime() / 60) + " minutes."),
        Log.print("Current Memory Usage: " + Math.round(mem.heapUsed / 1048576 * 10) / 10 + "/" + Math.round(mem.heapTotal / 1048576 * 10) / 10 + " MB."),
        Log.print("Current Game Mode: " + gameServer.gameMode.name + "."),
        Log.print("Current Update Time: " + gameServer.updateTimeAvg.toFixed(3) + " ms (" + ini.getLagMessage(gameServer.updateTimeAvg) + ")."),
        Log.print("-----------------------------------------");
    }
    debug(gameServer) { // Add fancy borders?
        Log.print("-----------------NODES------------------"),
        Log.print("Total nodes: " + gameServer.nodesAll.length + "."),
        Log.print("Player nodes: " + gameServer.nodesPlayer.length + "."),
        Log.print("Virus nodes: " + gameServer.nodesVirus.length + "."),
        Log.print("Ejected nodes: " + gameServer.nodesEject.length + "."),
        Log.print("Food nodes: " + gameServer.nodesFood.length + ".");
        Log.print("MotherCell nodes: " + (gameServer.gameMode.ID === 2 ? gameServer.gameMode.mothercells.length : "0") + ".");
        Log.print("----------------------------------------");
    }
    gamemode(gameServer, split) {
        try {
            let id = parseInt(split[1]),
                gameMode = GameMode.get(id);
            gameServer.gameMode.onChange(gameServer);
            gameServer.gameMode = gameMode;
            gameServer.gameMode.onServerInit(gameServer);
            Log.print("Changed the game mode to " + gameServer.gameMode.name + ".");
        } catch (e) {
            Log.warn("Please select a valid game mode.");
        }
    }
    eval(gameServer, split) {
        try {
            var string = split.slice(1, split.length).join(" ");
            Log.info("Running code...");
            Log.print("[OUTPUT] " + eval(string));
        } catch (e) {
            Log.warn("An error occurred while trying to run the code:");
            Log.error(e);
        }
    }
    // Command aliases
    pl(gameServer) {
        this.playerlist(gameServer);
    }
    m(gameServer, split) {
        this.mass(gameServer, split);
    }
    e(gameServer, split) {
        this.explode(gameServer, split);
    }
    sm(gameServer, split) {
        this.spawnmass(gameServer, split);
    }
    ka(gameServer) {
        this.killall(gameServer);
    }
    k(gameServer, split) {
        this.kill(gameServer, split);
    }
    s(gameServer, split) {
        this.speed(gameServer, split);
    }
    f(gameServer, split) {
        this.freeze(gameServer, split);
    }
    ab(gameServer, split) {
        this.addbot(gameServer, split);
    }
    kb(gameServer, split) {
        this.kickbot(gameServer, split);
    }
    c(gameServer, split) {
        this.change(gameServer, split);
    }
    tp(gameServer, split) {
        this.teleport(gameServer, split);
    }
    rp(gameServer, split) {
        this.replace(gameServer, split);
    }
    stats(gameServer) {
        this.status(gameServer);
    }
}

module.exports = new CommandList();
