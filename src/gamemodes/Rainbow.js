"use strict";
const FFA = require("./FFA");

class Rainbow extends FFA {
    constructor() {
        super();
        this.ID = 3;
        this.name = "Rainbow FFA";
        this.colors = [
            {"r":255, "g":  0, "b":  0}, // Red
            {"r":255, "g": 32, "b":  0},
            {"r":255, "g": 64, "b":  0},
            {"r":255, "g": 96, "b":  0},
            {"r":255, "g":128, "b":  0}, // Orange
            {"r":255, "g":160, "b":  0},
            {"r":255, "g":192, "b":  0},
            {"r":255, "g":224, "b":  0},
            {"r":255, "g":255, "b":  0}, // Yellow
            {"r":192, "g":255, "b":  0},
            {"r":128, "g":255, "b":  0},
            {"r": 64, "g":255, "b":  0},
            {"r":  0, "g":255, "b":  0}, // Green
            {"r":  0, "g":192, "b": 64},
            {"r":  0, "g":128, "b":128},
            {"r":  0, "g": 64, "b":192},
            {"r":  0, "g":  0, "b":255}, // Blue
            {"r": 18, "g":  0, "b":192},
            {"r": 37, "g":  0, "b":128},
            {"r": 56, "g":  0, "b": 64},
            {"r": 75, "g":  0, "b":130}, // Indigo
            {"r": 92, "g":  0, "b":161},
            {"r":109, "g":  0, "b":192},
            {"r":126, "g":  0, "b":223},
            {"r":143, "g":  0, "b":255}, // Purple
            {"r":171, "g":  0, "b":192},
            {"r":199, "g":  0, "b":128},
            {"r":227, "g":  0, "b": 64}
        ];
        this.colorLength = this.colors.length - 1;
        this.speed = 1;
    }
    onTick(gameServer) {
        for (let i in gameServer.nodesAll) {
            let node = gameServer.nodesAll[i];
            if (!node) continue;
            this.changeColor(node);
        }
    }
    changeColor(client) {
        if (typeof client.rainbow == "undefined") client.rainbow = Math.floor(Math.random() * this.colors.length);
        if (client.rainbow >= this.colorLength) client.rainbow = 0;
        client.rainbow += this.speed;
        client.color = this.colors[client.rainbow];
    }
}

module.exports = Rainbow;
