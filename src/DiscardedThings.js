// Where I put discarded code...
var PacketHandler, Entity, Vector, Log, discarded;
// Eject mass firework?
PacketHandler.prototype.onKeySpace = function(message) { // Split (with cooldown)
    if (message.length === 1) {
        var tick = this.gameServer.tickCount;
        if (tick - this.lastSpaceTick > this.gameServer.config.spaceCooldown)
            this.lastSpaceTick = tick, this.pressSpace = 1;
    }
};
PacketHandler.prototype.onKeyV = function() {
    var e = this.socket.playerTracker;
    if (!e.OP) return;
    var q = {
            x: e.mouse.x,
            y: e.mouse.y
        },
        t = Math.floor(255 * Math.random()) + 1,
        A = Math.floor(255 * Math.random()) + 1,
        D = Math.floor(255 * Math.random()) + 1,
        F = new Entity.EjectedMass(this.gameServer, null, q, 10),
        G = new Entity.EjectedMass(this.gameServer, null, q, 10),
        I = new Entity.EjectedMass(this.gameServer, null, q, 10),
        J = new Entity.EjectedMass(this.gameServer, null, q, 10),
        L = new Entity.EjectedMass(this.gameServer, null, q, 10),
        Q = new Entity.EjectedMass(this.gameServer, null, q, 10),
        U = new Entity.EjectedMass(this.gameServer, null, q, 10),
        V = new Entity.EjectedMass(this.gameServer, null, q, 10),
        X = new Entity.EjectedMass(this.gameServer, null, q, 10),
        Y = new Entity.EjectedMass(this.gameServer, null, q, 10),
        Z = new Entity.EjectedMass(this.gameServer, null, q, 10),
        $ = new Entity.EjectedMass(this.gameServer, null, q, 10),
        _ = new Entity.EjectedMass(this.gameServer, null, q, 10),
        aa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ba = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ca = new Entity.EjectedMass(this.gameServer, null, q, 10),
        da = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ea = new Entity.EjectedMass(this.gameServer, null, q, 10),
        fa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ga = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ha = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ia = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ja = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ka = new Entity.EjectedMass(this.gameServer, null, q, 10),
        la = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ma = new Entity.EjectedMass(this.gameServer, null, q, 10),
        na = new Entity.EjectedMass(this.gameServer, null, q, 10),
        oa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        pa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        qa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ra = new Entity.EjectedMass(this.gameServer, null, q, 10),
        sa = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ta = new Entity.EjectedMass(this.gameServer, null, q, 10),
        ua = new Entity.EjectedMass(this.gameServer, null, q, 10),
        va = new Entity.EjectedMass(this.gameServer, null, q, 10),
        wa = new Entity.EjectedMass(this.gameServer, null, q, 10);
    F.color = {r: t, g: A, b: D}, F.setBoost(101, 10), this.gameServer.addNode(F),
    G.color = {r: t, g: A, b: D}, G.setBoost(101, 20), this.gameServer.addNode(G),
    I.color = {r: t, g: A, b: D}, I.setBoost(101, 30), this.gameServer.addNode(I),
    J.color = {r: t, g: A, b: D}, J.setBoost(101, 40), this.gameServer.addNode(J),
    L.color = {r: t, g: A, b: D}, L.setBoost(101, 50), this.gameServer.addNode(L),
    Q.color = {r: t, g: A, b: D}, Q.setBoost(101, 60), this.gameServer.addNode(Q),
    U.color = {r: t, g: A, b: D}, U.setBoost(101, 70), this.gameServer.addNode(U),
    V.color = {r: t, g: A, b: D}, V.setBoost(101, 80), this.gameServer.addNode(V),
    X.color = {r: t, g: A, b: D}, X.setBoost(101, 90), this.gameServer.addNode(X),
    Y.color = {r: t, g: A, b: D}, Y.setBoost(101, 100), this.gameServer.addNode(Y),
    Z.color = {r: t, g: A, b: D}, Z.setBoost(101, 110), this.gameServer.addNode(Z),
    $.color = {r: t, g: A, b: D}, $.setBoost(101, 120), this.gameServer.addNode($),
    _.color = {r: t, g: A, b: D}, _.setBoost(101, 130), this.gameServer.addNode(_),
    aa.color = {r: t, g: A, b: D}, aa.setBoost(101, 140), this.gameServer.addNode(aa), 
    ba.color = {r: t, g: A, b: D}, ba.setBoost(101, 150), this.gameServer.addNode(ba), 
    ca.color = {r: t, g: A, b: D}, ca.setBoost(101, 160), this.gameServer.addNode(ca), 
    da.color = {r: t, g: A, b: D}, da.setBoost(101, 170), this.gameServer.addNode(da), 
    ea.color = {r: t, g: A, b: D}, ea.setBoost(101, 180), this.gameServer.addNode(ea), 
    fa.color = {r: t, g: A, b: D}, fa.setBoost(101, 190), this.gameServer.addNode(fa), 
    ga.color = {r: t, g: A, b: D}, ga.setBoost(101, 101), this.gameServer.addNode(ga), 
    ha.color = {r: t, g: A, b: D}, ha.setBoost(101, 210), this.gameServer.addNode(ha), 
    ia.color = {r: t, g: A, b: D}, ia.setBoost(101, 220), this.gameServer.addNode(ia), 
    ja.color = {r: t, g: A, b: D}, ja.setBoost(101, 230), this.gameServer.addNode(ja), 
    ka.color = {r: t, g: A, b: D}, ka.setBoost(101, 240), this.gameServer.addNode(ka), 
    la.color = {r: t, g: A, b: D}, la.setBoost(101, 250), this.gameServer.addNode(la), 
    ma.color = {r: t, g: A, b: D}, ma.setBoost(101, 260), this.gameServer.addNode(ma), 
    na.color = {r: t, g: A, b: D}, na.setBoost(101, 270), this.gameServer.addNode(na), 
    oa.color = {r: t, g: A, b: D}, oa.setBoost(101, 280), this.gameServer.addNode(oa), 
    pa.color = {r: t, g: A, b: D}, pa.setBoost(101, 290), this.gameServer.addNode(pa), 
    qa.color = {r: t, g: A, b: D}, qa.setBoost(101, 300), this.gameServer.addNode(qa), 
    ra.color = {r: t, g: A, b: D}, ra.setBoost(101, 310), this.gameServer.addNode(ra), 
    sa.color = {r: t, g: A, b: D}, sa.setBoost(101, 320), this.gameServer.addNode(sa), 
    ta.color = {r: t, g: A, b: D}, ta.setBoost(101, 330), this.gameServer.addNode(ta), 
    ua.color = {r: t, g: A, b: D}, ua.setBoost(101, 340), this.gameServer.addNode(ua), 
    va.color = {r: t, g: A, b: D}, va.setBoost(101, 350), this.gameServer.addNode(va), 
    wa.color = {r: t, g: A, b: D}, wa.setBoost(101, 360), this.gameServer.addNode(wa);
};
// Explode (viruses)
PacketHandler.prototype.onKeyX = function() {
    var client = this.socket.playerTracker;
    if (!client.OP || !client.cells.length) return;
    var config = this.gameServer.config;
    for (var i in this.gameServer.clients) {
        for (i = 0; i < client.cells.length; i++) {
            for (var cell = client.cells[i]; 31.623 < cell._size;) {
                var angle = 6.28 * Math.random();
                var size = cell.radius - 12000;
                cell.setSize(Math.sqrt(size));
                var pos = new Vector(
                    cell.position.x + angle,
                    cell.position.y + angle
                );
                var loss = config.virusMinSize;
                var virus = new Entity.Virus(this.gameServer, null, pos, loss);
                if (config.virusRandomColor) virus.color = this.gameServer.randomColor();
                else virus.color = client.color;
                virus.setBoost(config.virusEjectSpeed * Math.random(), angle);
                this.gameServer.addNode(virus);
            }
            cell.setSize(31.623); // 10 Mass
        }
    }
};
// Pause/unpause the game
PacketHandler.prototype.onKeyV = function() {
    var client = this.socket.playerTracker;
    if (!client.OP) return;
    var gameServer = this.gameServer;
    gameServer.running = !gameServer.running;
    !gameServer.running ? Log.info(client._name + " paused the game") :
    Log.info(client._name + " unpaused the game");
};
discarded.commands = {
    // OP reset command
    opreset: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID != id) return;
            var client = gameServer.clients[i].playerTracker;
            client.minion.follow = 0;
            client.minion.frozen = 0;
            client.minion.collect = 0;
            client.minion.frozen = 0;
            client.mergeOverride = 0;
            client.recMode = 0;
            client.OP.foodSize = 10;
            break;
        }
        if (client == null) return void Log.warn("That player ID (" + id + ") is non-existant!");
        Log.print("Successfully reset " + client._name + "'s OP settings");
    },
    // Team changing command (buggy)
    randcolor: function() {
        var r = Math.floor(255 * Math.random() + 1);
        var g = Math.floor(255 * Math.random() + 1);
        var b = Math.floor(255 * Math.random() + 1);
        Log.print("Returned color was (" + r + ", " + g + ", " + b + ").");
    },
    team: function(gameServer, split) {
        if (gameServer.config.serverGamemode != 1) return Log.warn("You can't use this command outside of teams mode!");
        var id = parseInt(split[1]);
        var team = split[2];
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (team != "red" && team != "blue" && team != "green") return Log.warn("Please specify either red, green, or blue!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                if (team == "red") {
                    client.team = 0;
                    client.color = {r: 225, g: 0, b: 0};
                    client.cells.forEach(function(node) {
                        node.color = client.color;
                    }, this);
                    Log.print(client._name + "'s team has been changed to red");
                }
                if (team == "green") {
                    client.team = 1;
                    client.color = {r: 0, g: 225, b: 0};
                    client.cells.forEach(function(node) {
                        node.color = client.color;
                    }, this);
                    Log.print(client._name + "'s team has been changed to green");
                }
                if (team == "blue") {
                    client.team = 2;
                    client.color = {r: 0, g: 0, b: 225};
                    client.cells.forEach(function(node) {
                        node.color = client.color;
                    }, this);
                    Log.print(client._name + "'s team has been changed to blue");
                }
            }
        }
        if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
        if (client == null) return void Log.warn("That player ID (" + id + ") is non-existant!");
    },
    // Change a player's split speed
    splitspeed: function(gameServer, split) {
        var id = parseInt(split[1]);
        var speed = parseInt(split[2]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        if (isNaN(speed)) return Log.warn("Please specify a valid splitting speed!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                client.customSplitSpeed = speed;
            }
        }
        if (null == client) return void Log.warn("That player ID (" + id + ") is non-existant!");
        Log.print("Set base split speed of " + client._name + " to " + speed);
    },
    // Make a player's minions follow their cell
    minionfollow: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                client.minionFollow = !client.minionFollow;
                var follow = client.minionFollow ? "now" : "no longer";
                Log.print(client._name + "'s minions are " + follow + " following it's cell");
            }
        }
        if (client == null) return void Log.warn("That player ID (" + id + ") is non-existant!");
    },
    // WIP: Change a player's mouse position
/*  mouse: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) return Log.warn("Please specify a valid player ID!");
        var pos = {
            x: parseInt(split[2]),
            y: parseInt(split[3])
        };
        if (isNaN(pos.x) || isNaN(pos.y)) return Log.warn("Invalid coordinates!");
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                if (!client.cells.length) return Log.warn("You can't use this command when a player is dead!");
                client.mouse.x = pos.x, client.mouse.y = pos.y;
                Log.print("Set " + client._name + "'s mouse to (" + pos.x + " , " + pos.y + ")");
                break;
            }
        }
        if (client == null) return void Log.warn("That player ID (" + id + ") is non-existant!");
    },*/
};