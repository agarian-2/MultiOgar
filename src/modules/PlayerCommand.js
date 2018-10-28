'use strict';
const Log = require("./Logger");
const Entity = require("../entity");
const GameMode = require("../gamemodes");

function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function(text) {
    this.gameServer.sendChatMSG(null, this.playerTracker, text);
};

PlayerCommand.prototype.executeCommandLine = function(commandLine) {
    if (!commandLine) return;
    var args = commandLine.split(" ");
    var first = args[0].toLowerCase();
    var execute = PlayerCommand.list[first];
    if (typeof execute != 'undefined') execute.bind(this)(args);
    else this.writeLine("Unknown command! Type /help for a list of commands.");
};

PlayerCommand.prototype.userLogin = function(ip, password) {
    if (!password) return null;
    password = password.trim();
    if (!password) return null;
    for (var i = 0; i < this.gameServer.userList.length; i++) {
        var user = this.gameServer.userList[i];
        if (user.password != password) continue;
        if (user.ip && user.ip != ip && user.ip != "*") continue;
        return user;
    }
    return null;
};

PlayerCommand.list = {
    help: function(args) {
        var page = parseInt(args[1]);
        if (isNaN(page) || (page != 1 && page != 2 && page != 3/* && page != 4*/)) return this.writeLine("INFO: Type /help 1 to display the first page of commands (there are 3 total).");
        if (page == 1) {
            this.writeLine("~~~~~~~~~~~~~~~~~~COMMANDS~~~~~~~~~~~~~~~~~");
            this.writeLine("/addbot: Adds bots to the server.");
            this.writeLine("/board: Edits text on the leaderboard.");
            this.writeLine("/border: Changes the map size.");
            this.writeLine("/change: Changes a config value.");
            this.writeLine("/chat: Sends a message to all players.");
            this.writeLine("/color: Change your RGB color.");
            this.writeLine("/debug: Shows all total nodes in the game.");
            this.writeLine("/explode: Explodes you into ejected mass.");
            this.writeLine("/freeze: Freezes your cell.");
            this.writeLine("/getcolor: Gets your cell color.");
            this.writeLine("/kick: Kicks you from the server.");
            this.writeLine("/help 2: Shows page 2 of commands.");
            this.writeLine("~~~~~~~~~~~~~~~~~~PAGE 1~~~~~~~~~~~~~~~~~~~");
        }
        if (page == 2) {
            this.writeLine("~~~~~~~~~~~~~~~~~~COMMANDS~~~~~~~~~~~~~~~~~");
            this.writeLine("/kickbots: Kicks all, or some bots.");
            this.writeLine("/kickmi: Kicks all, or some minions.");
            this.writeLine("/kill: Kills yourself.");
            this.writeLine("/killall: Kills all players.");
            this.writeLine("/lms: Enables Last Man Standing mode.");
            this.writeLine("/mass: Sets your mass to a specified value.");
            this.writeLine("/merge: Merges all your cells.");
            this.writeLine("/minion: Removes, or gives you minions.");
            this.writeLine("/name: Changes your name.");
            this.writeLine("/pause: Pauses/unpauses the game.");
            this.writeLine("/rec: Enables/disables 'rec' mode.");
            this.writeLine("/help 3: Shows page 3 of commands.");
            this.writeLine("~~~~~~~~~~~~~~~~~~PAGE 2~~~~~~~~~~~~~~~~~~~");
        }
        if (page == 3) {
            this.writeLine("~~~~~~~~~~~~~~~~~~COMMANDS~~~~~~~~~~~~~~~~~~");
            this.writeLine("/reload: Sets all config values to default.");
            this.writeLine("/restart: Restarts the server.");
            this.writeLine("/replace: Replaces your cell with an entity.");
            this.writeLine("/reset: Clears all, or specified nodes.");
            this.writeLine("/spawnmass: Sets the mass that you spawn at.");
            this.writeLine("/speed: Sets your cell movement speed.");
            this.writeLine("/split: Splits your cell a specified amount.");
            this.writeLine("/status: Shows the server's current status.");
            this.writeLine("/teleport: Teleport to a specified location");
            this.writeLine("/virus: Spawns a virus under you.");
            this.writeLine("This is the last page of commands.");
            this.writeLine("~~~~~~~~~~~~~~~~~~~PAGE 3~~~~~~~~~~~~~~~~~~~");
        }
    },
    ophelp: function(args) {
        var page = parseInt(args[1]);
        if (isNaN(page) || (page != 1 && page != 2)) return this.writeLine("INFO: Type /ophelp 1 to display the first page of OP keys (there are 2 total).");
        if (page == 1) {
            this.writeLine("~~~~~~~~~~OP MODE KEYS~~~~~~~~~~");
            this.writeLine(" E : Minions split.");
            this.writeLine(" R : Minions eject.");
            this.writeLine(" T : Minions freeze.");
            this.writeLine(" P : Minions collect food.");
            this.writeLine(" Q : Minions follow cell.");
            this.writeLine(" O : Self freeze.");
            this.writeLine(" M : Self merge.");
            this.writeLine(" I : Instant merge (rec-mode).");
            this.writeLine(" K : Suicide.");
            this.writeLine(" Y : Gain mass.");
            this.writeLine(" U : Lose mass.");
            this.writeLine(" L : Clear all entities.");
            this.writeLine(" H : Explode into ejected mass.");
            this.writeLine("~~~~~~~~~~~~~PAGE 1~~~~~~~~~~~~~");
        }
        if (page == 2) {
            this.writeLine("~~~~~~~~~~OP MODE KEYS~~~~~~~~~~");
            this.writeLine(" Z : Change own color."),
            this.writeLine(" S : Spawn virus at mouse."),
            this.writeLine(" J : Spawn food at mouse."),
            this.writeLine(" B : Edit J key food color."),
            this.writeLine(" C : Edit J key food size."),
            this.writeLine(" G : Teleport to mouse."),
            this.writeLine(" V : Ejects mass at the mouse.");
            this.writeLine("This is the last page of keys.");
            this.writeLine("~~~~~~~~~~~~~PAGE 2~~~~~~~~~~~~~");
        }
    },
    addbot: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var add = parseInt(args[1]);
        if (isNaN(add)) return this.writeLine("ERROR: Invalid amount of bots to add!");
        for (var i = 0; i < add; i++) this.gameServer.bots.addBot();
        this.writeLine("Added " + add + " Bots.");
    },
    board: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var newLB = [];
        var input = args[1];
        if (args.length > this.gameServer.config.serverMaxLB + 1) return this.writeLine("ERROR: The limit for lines of text on the leaderboard is " + this.gameServer.config.serverMaxLB + "!");
        for (var i = 1; i < args.length; i++) {
            if (args[i]) newLB[i - 1] = args[i];
            else newLB[i - 1] = " ";
        }
        this.gameServer.gameMode.packetLB = 48;
        this.gameServer.gameMode.updateLB = function (gameServer) {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        if (input != "reset") {
            this.writeLine("Successfully changed leaderboard values.");
            this.writeLine("Enter 'board reset' to reset leaderboard.");
        } else {
            var gameMode = GameMode.get(this.gameServer.gameMode.ID);
            this.gameServer.gameMode.packetLB = gameMode.packetLB;
            this.gameServer.gameMode.updateLB = gameMode.updateLB;
            this.writeLine("Successfully reset leaderboard.");
        }
    },
    border: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var width = args[1];
        var height = args[2];
        if (isNaN(width) || isNaN(height)) return this.writeLine("ERROR: Please specify a valid border width/height!");
        for (;this.gameServer.nodes.eject.length;) this.gameServer.removeNode(this.gameServer.nodes.eject[0]);
        for (;this.gameServer.nodes.food.length;) this.gameServer.removeNode(this.gameServer.nodes.food[0]);
        for (;this.gameServer.nodes.virus.length;) this.gameServer.removeNode(this.gameServer.nodes.virus[0]);
        this.gameServer.setBorder(width, height);
        var QuadNode = require("./QuadNode.js");
        this.gameServer.quadTree = new QuadNode(this.gameServer.border, 64, 32);
        this.writeLine("The map size is now (" + width + ", " + height + ").");
    },
    c/*hange*/: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        if (args.length < 3) return this.writeLine("ERROR: Please specify a valid value for this config!");
        var key = args[1];
        var value = args[2];
        if (value.indexOf('.') != -1) value = parseFloat(value);
        else value = parseInt(value);
        if (value == null || isNaN(value)) return this.writeLine("ERROR: Invalid value: " + value + "!");
        if (!this.gameServer.config.hasOwnProperty(key)) return this.writeLine("ERROR: Unknown config value: " + key + "!");
        this.gameServer.config[key] = value;
        this.gameServer.config.playerMinSize = Math.max(32, this.gameServer.config.playerMinSize);
        this.writeLine("Set '" + key + "' to " + this.gameServer.config[key] + ".");
        var name = !this.playerTracker._name.length ? "An unnamed cell" : this.playerTracker._name;
        Log.info(name + " changed the config value '" + key + "' to " + this.gameServer.config[key] + ".");
    },
    chat: function (args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        for (var i = 0; i < this.gameServer.clients.length; i++) this.gameServer.sendChatMSG(null, i, String(args.slice(1, args.length).join(" ")));
        this.writeLine("Succesfully sent your message to all players.");
    },
    color: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(args[1]), 255), 0);
        color.g = Math.max(Math.min(parseInt(args[2]), 255), 0);
        color.b = Math.max(Math.min(parseInt(args[3]), 255), 0);
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) return this.writeLine("ERROR: Please specify a valid RGB color!");
        client.color = color;
        for (var j in client.cells) client.cells[j].color = color;
        this.writeLine("Changed your color to (" + color.r + ", " + color.g + ", " + color.b + ").");
    },
    debug: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var gameServer = this.gameServer;
        this.writeLine("~~~~~~~~~~~~~~~~~NODES~~~~~~~~~~~~~~~~~~"),
        this.writeLine("Total nodes: " + gameServer.nodes.all.length),
        this.writeLine("Player nodes: " + gameServer.nodes.player.length),
        this.writeLine("Virus nodes: " + gameServer.nodes.virus.length),
        this.writeLine("Ejected nodes: " + gameServer.nodes.eject.length),
        this.writeLine("Food nodes: " + gameServer.nodes.food.length);
        if (gameServer.gameMode.ID != 2) this.writeLine("MotherCell nodes: 0");
        else this.writeLine("Mothercell nodes: " + gameServer.gameMode.mothercells.length);
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    explode: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var client = this.playerTracker;
        for (var i in client.cells) {
            for (var cell = client.cells[i]; cell._size > 31.63;) {
                var config = this.gameServer.config;
                var angle = 6.28 * Math.random();
                var loss = config.ejectMinSize;
                if (config.ejectMaxSize > loss) loss = Math.random() * (config.ejectMaxSize - loss) + loss;
                var size = cell.radius - (loss + 5) * (loss + 5);
                cell.setSize(Math.sqrt(size));
                var pos = {
                    x: cell.position.x + angle,
                    y: cell.position.y + angle
                };
                var eject = new Entity.EjectedMass(this.gameServer, null, pos, loss);
                if (config.ejectRandomColor) eject.color = this.gameServer.randomColor();
                else eject.color = client.color;
                eject.setBoost(config.ejectSpeed * Math.random(), angle);
                this.gameServer.addNode(eject);
            }
            cell.setSize(31.63);
        }
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        this.writeLine("Successfully exploded yourself.");
    },
    freeze: function () {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.playerTracker.frozen = !this.playerTracker.frozen;
        this.writeLine("You are " + (this.playerTracker.frozen ? "now" : "no longer") + " frozen.");
    },
    getcolor: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        this.writeLine("Your RGB color is (" + client.color.r + ", " + client.color.g + ", " + client.color.b + ").");
    },
    kick: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.playerTracker.socket.close(1000, "You kicked yourself from the server, idiot!");
        this.writeLine("You kicked yourself...");
    },
    kickbots: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var toRemove = parseInt(args[1]);
        if (isNaN(toRemove)) toRemove = this.gameServer.clients.length;
        var removed = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if (this.gameServer.clients[i].isConnected != null) continue;
            if (this.gameServer.clients[i].playerTracker.isMi == 1) continue;
            this.gameServer.clients[i].close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) this.writeLine("ERROR: No bots are connected to the server!");
        else this.writeLine("You kicked " + removed + " bots.");
    },
    kickmi: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var toRemove = parseInt(args[1]);
        if (isNaN(toRemove)) toRemove = this.gameServer.clients.length;
        var removed = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if (this.gameServer.clients[i].playerTracker.isMi != 1) continue;
            this.gameServer.clients[i].close();
            removed++;
            if (removed >= toRemove) break;
        }
        if (!removed) this.writeLine("ERROR: No minions are connected to the server!");
        else this.writeLine("You kicked " + removed + " minions.");
    },
    kill: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        if (!this.playerTracker.cells.length) return this.writeLine("ERROR: You're not spawned in the game!");
        while (this.playerTracker.cells.length) {
            var cell = this.playerTracker.cells[0];
            this.gameServer.removeNode(cell);
            var food = require('../entity/Food');
            food = new food(this.gameServer, null, cell.position, cell._size);
            food.color = cell.color;
            this.gameServer.addNode(food);
        }
        this.writeLine("You killed yourself.");
    },
    killall: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var count = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            var playerTracker = this.gameServer.clients[i].playerTracker;
            while (playerTracker.cells.length > 0) {
                this.gameServer.removeNode(playerTracker.cells[0]);
                count++;
            }
        }
        this.writeLine("You killed everyone (" + count + (" cells)."));
    },
    lms: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.gameServer.disableSpawn = !this.gameServer.disableSpawn;
        this.writeLine("Last Man Standing has been " + (this.gameServer.disableSpawn ? "enabled" : "disabled") + ".");
    },
    mass: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var mass = parseInt(args[1]);
        var size = Math.sqrt(mass * 100);
        if (!this.playerTracker.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        if (isNaN(mass)) return this.writeLine("ERROR: Invalid mass argument!");
        for (var i in this.playerTracker.cells) this.playerTracker.cells[i].setSize(size);
        this.writeLine("Set your mass to " + (size * size / 100).toFixed(0) + ".");
    },
    merge: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        if (client.cells.length == 1) return this.writeLine("ERROR: You are already in one cell!");
        client.mergeOverride = !client.mergeOverride;
        this.writeLine("You are " + (client.mergeOverride ? "now" : "no longer") + " merging.");
    },
    minion: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var add = args[1];
        var name = args.slice(2, args.length).join(' ');
        var player = this.playerTracker;
        if (isNaN(add) && add != "remove") return this.writeLine("ERROR: Invalid number of minions to add!");
        if (player.minion.control == 1 && (add == "remove" || !add)) {
            player.minion.control = 0;
            this.writeLine("Succesfully removed your minions.");
        } else {
            player.minion.control = 1;
            for (var i = 0; i < add; i++) this.gameServer.bots.addMinion(player, name);
            this.writeLine("You gave yourself " + add + " minions.");
        }
    },
    name: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var name = args.slice(1, args.length).join(' ');
        if (typeof name == 'undefined') return this.writeLine("ERROR: Please type a valid name!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        this.writeLine("Changing your name to " + name + ".");
        client.setName(name);
        return;
    },
    pause: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.gameServer.running = !this.gameServer.running;
        this.writeLine("You " + (!this.gameServer.running ? "paused" : "unpaused") + " the game.");
    },
    rec: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.playerTracker.recMode = !this.playerTracker.recMode;
        this.writeLine("You " + (this.playerTracker.recMode ? "now" : "no longer") + " have rec mode.");
    },
    reload: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.gameServer.loadConfig();
        this.gameServer.loadBanList();
        this.writeLine("Reloaded the configuration files succesully.");
    },
    restart: function () {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var gameServer = this.gameServer;
        var QuadNode = require('./QuadNode.js');
        for (var i = 0; i < gameServer.clients.length; i++) {
            var sockets = gameServer.clients[i];
            sockets.close();
        }
        gameServer.httpServer = null;
        gameServer.running = 1;
        gameServer.lastNodeID = 1;
        gameServer.lastPlayerID = 1;
        gameServer.nodes = {
            all: [],
            player: [],
            virus: [],
            eject: [],
            food: [],
            moving: []
        };
        gameServer.quadTree = null;
        gameServer.commands;
        gameServer.tickCount = 0;
        gameServer.startTime = Date.now();
        gameServer.setBorder(gameServer.config.borderWidth, gameServer.config.borderHeight);
        gameServer.quadTree = new QuadNode(gameServer.border, 64, 32);
        for (;gameServer.nodes.all.length;) gameServer.removeNode(gameServer.nodes.all[0]);
        for (;gameServer.nodes.eject.length;) gameServer.removeNode(gameServer.nodes.eject[0]);
        for (;gameServer.nodes.food.length;) gameServer.removeNode(gameServer.nodes.food[0]);
        for (;gameServer.nodes.virus.length;) gameServer.removeNode(gameServer.nodes.virus[0]);
        this.writeLine("Restarting server...");
    },
    replace: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var ent = args[1];
        if ((ent != "virus" && ent != "food" && ent != "mothercell") || !ent) return this.writeLine("ERROR: Please specify either virus, food, or mothercell!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        while (client.cells.length > 0) {
            var cell = client.cells[0];
            this.gameServer.removeNode(cell);
            if (ent == "virus") {
                var virus = new Entity.Virus(this.gameServer, null, cell.position, cell._size);
                this.gameServer.addNode(virus);
            } else if (ent == "food") {
                var food = new Entity.Food(this.gameServer, null, cell.position, cell._size);
                food.color = this.gameServer.randomColor();
                this.gameServer.addNode(food);
            } else if (ent == "mothercell") {
                var mother = new Entity.MotherCell(this.gameServer, null, cell.position, cell._size);
                this.gameServer.addNode(mother);
            }
        }
        var type = ent == "food" ? "food cells" : ent == "virus" ? "viruses" : ent == "mothercell" ? "mothercells" : "invalid entity";
        this.writeLine("Replaced your cells with " + type + ".");
    },
    reset: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var gameServer = this.gameServer;
        var ent = args[1];
        if ("ejected" != ent && "food" != ent && "virus" != ent && "mothercell" != ent && "all" != ent) return this.writeLine("WARN: Specify either 'food', 'virus', 'ejected', 'all', or 'mothercell'!");
        if ("all" == ent) {
            this.writeLine("Removed " + gameServer.nodes.all.length + " nodes.");
            for (;gameServer.nodes.all.length;) gameServer.removeNode(gameServer.nodes.all[0]);
            for (;gameServer.nodes.eject.length;) gameServer.removeNode(gameServer.nodes.eject[0]);
            for (;gameServer.nodes.food.length;) gameServer.removeNode(gameServer.nodes.food[0]);
            for (;gameServer.nodes.virus.length;) gameServer.removeNode(gameServer.nodes.virus[0]);
            for (var i = 0; i < gameServer.clients.length; i++) {
                var playerTracker = gameServer.clients[i].playerTracker;
                while (playerTracker.cells.length > 0) gameServer.removeNode(playerTracker.cells[0]);
            }
        }
        if ("ejected" == ent) {
            for (;gameServer.nodes.eject.length;) gameServer.removeNode(gameServer.nodes.eject[0]);
            this.writeLine("Removed all ejected nodes.");
        }
        if ("food" == ent) {
            for (;gameServer.nodes.food.length;) gameServer.removeNode(gameServer.nodes.food[0]);
            this.writeLine("Removed all food nodes.");
        }
        if ("virus" == ent) {
            for (;gameServer.nodes.virus.length;) gameServer.removeNode(gameServer.nodes.virus[0]);
            this.writeLine("Removed all virus nodes.");
        }
        if ("mothercell" == ent) {
            if (gameServer.gameMode.ID != 2) return this.writeLine("ERROR: Mothercells can only be cleared in experimental mode!");
            for (;gameServer.nodes.virus.length;) gameServer.removeNode(gameServer.nodes.virus[0]);
            this.writeLine("Removed all mothercell nodes.");
        }
    },
    spawnmass: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var mass = parseInt(args[1]);
        var size = Math.sqrt(mass * 100);
        if (!this.playerTracker.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        if (isNaN(mass)) return this.writeLine("ERROR: Invalid mass argument!");
        this.playerTracker.spawnMass = size;
        this.writeLine("Set your spawn mass to " + (size * size / 100).toFixed(0) + ".");
    },
    speed: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var speed = parseInt(args[1]);
        if (isNaN(speed)) return this.writeLine("ERROR: Please specify a valid speed!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        client.customSpeed = speed;
        Entity.PlayerCell.prototype.getSpeed = function(dist) {
            var scale = 2.2 * Math.pow(this._size, -.439);
            var _speed = Math.min(dist , 32) / 32;
            if (this.owner.customSpeed) var speed = (scale = 40 * scale * this.owner.customSpeed / 30) * _speed;
            else speed = (scale = 40 * scale * this.gameServer.config.playerSpeed / 30) * _speed;
            return speed;
        };
        if (speed == 0) this.writeLine("Set your base speed to " + this.gameServer.config.playerSpeed + ".");
        else this.writeLine("Set your base speed to " + speed + ".");
    },
    split: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var amount = parseInt(args[1]);
        if (isNaN(amount)) return this.writeLine("ERROR: Please specify a valid split count!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        if (client.cells.length >= this.gameServer.config.playerMaxCells) return this.writeLine("ERROR: You have reached the splitting limit of " + this.gameServer.config.playerMaxCells + "!");
        for (var i = 0; i < amount; i++) this.gameServer.splitCells(client);
        this.writeLine("You forced yourself to split " + amount + " times.");
    },
    status: function() {
        var ini = require('./ini.js');
        var humans = 0;
        var bots = 0;
        var mem = process.memoryUsage();
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if ('_socket' in this.gameServer.clients[i]) humans++;
            else bots++;
        }
        var scores = [];
        for (var i in this.gameServer.clients) scores.push(this.gameServer.clients[i].playerTracker._score);
        if (!this.gameServer.clients.length) scores = [0];
        this.writeLine("~~~~~~~~~~~~~~STATUS~~~~~~~~~~~~~~");
        this.writeLine("Connected Players: " + this.gameServer.clients.length + "/" + this.gameServer.config.serverMaxConnect + "."),
        this.writeLine("Total Players: " + humans + " - Bots: " + bots + "."),
        this.writeLine("Average Score: " + (scores.reduce((x, y) => x + y) / scores.length).toFixed(2)),
        this.writeLine("Server Uptime: " + Math.floor(process.uptime() / 60) + " minutes."),
        this.writeLine("Current Memory Usage: " + Math.round(mem.heapUsed / 1048576 * 10) / 10 + "/" + Math.round(mem.heapTotal / 1048576 * 10) / 10 + " MB."),
        this.writeLine("Current Game Mode: " + this.gameServer.gameMode.name) + ".",
        this.writeLine("Current Update Time: " + this.gameServer.updateTimeAvg.toFixed(3) + " ms  (" + ini.getLagMessage(this.gameServer.updateTimeAvg) + ").");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    tp/*teleport*/: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var pos = {
            x: parseInt(args[1]),
            y: parseInt(args[2])
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return this.writeLine("ERROR: Invalid coordinates!");
        var client = this.playerTracker;
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        for (var i in client.cells) {
            client.cells[i].position.x = pos.x;
            client.cells[i].position.y = pos.y;
            this.gameServer.updateNodeQuad(client.cells[i]);
        }
        this.writeLine("You have been teleported to (" + pos.x + " , " + pos.y + ").");
    },
    virus: function() {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        var client = this.playerTracker;
        var virus = new Entity.Virus(this.gameServer, null, client.centerPos, this.gameServer.config.virusMinSize);
        if (!client.cells.length) return this.writeLine("ERROR: You are either dead or not playing!");
        this.gameServer.addNode(virus);
        this.writeLine("Spawned a virus under yourself.");
    },
    op: function(args) {
        var password = parseInt(args[1]);
        if (password != "12345") {
            Log.warn(this.playerTracker.name + " tried to use OP mode, but typed the incorrect password!");
            return this.writeLine("That password is incorrect!");
        }
        this.playerTracker.OP.enabled = !this.playerTracker.OP.enabled;
        this.writeLine("You " + (this.playerTracker.OP.enabled ? "now" : "no longer") + " have OP mode.");
    },
    gamemode: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        try {
            var id = parseInt(args[1]);
            var gameMode = GameMode.get(id);
            this.gameServer.gameMode.onChange(this.gameServer);
            this.gameServer.gameMode = gameMode;
            this.gameServer.gameMode.onServerInit(this.gameServer);
            //this.gameServer.config.serverGamemode = id;
            this.writeLine("Changed the game mode to " + this.gameServer.gameMode.name);
        } catch (e) {
            this.writeLine("Invalid game mode selected!");
        }
    },
    shutdown: function(args) {
        if (!this.playerTracker.OP.enabled) return this.writeLine("WARN: You must have OP mode to use this command!");
        this.writeLine("Shutdown request has been sent.");
        var name = !this.playerTracker._name.length ? "An unnamed cell" : this.playerTracker._name;
        Log.warn("Shutdown request has been sent by " + name + "!");
        process.exit(0);
    }
};
