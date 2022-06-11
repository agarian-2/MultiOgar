"use strict";
const Cell = require("./Cell");

class Food extends Cell {
    constructor(gameServer, owner, position, size) {
        super(gameServer, owner, position, size);
        this.cellType = 1;
        this.tickOfBirth = 0;
    }
    getAge() {
        if (this.tickOfBirth === null) return 0;
        return Math.max(0, this.gameServer.tickCount - this.tickOfBirth);
    }
    onAdd(gameServer) {
        gameServer.nodesFood.push(this);
    }
    onRemove(gameServer) {
        let index = gameServer.nodesFood.indexOf(this);
        if (index !== -1) gameServer.nodesFood.splice(index, 1);
    }
}

module.exports = Food;
