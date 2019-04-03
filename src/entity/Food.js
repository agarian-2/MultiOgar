'use strict';
const Cell = require("./Cell");

function Food() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 1;
    this.tickOfBirth = 0;
}

module.exports = Food;
Food.prototype = new Cell;

Food.prototype.getAge = function() {
    if (this.tickOfBirth === null) return 0;
    return Math.max(0, this.gameServer.tickCount - this.tickOfBirth);
};

Food.prototype.onAdd = function(gameServer) {
    gameServer.nodesFood.push(this);
};

Food.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesFood.indexOf(this);
    if (index !== -1) gameServer.nodesFood.splice(index, 1);
};
