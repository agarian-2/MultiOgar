'use strict';
const Cell = require("./Cell");

function Food() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 1;
    this.tickOfBirth = 0;
    /*if (this.getAge() >= 200) this.setSize(14.14);
    if (this.getAge() >= 400) this.setSize(17.32);
    if (this.getAge() >= 600) this.setSize(20);
    console.log(this.getAge());*/
}

module.exports = Food;
Food.prototype = new Cell;

Food.prototype.getAge = function() {
    if (this.tickOfBirth === null) return 0;
    return Math.max(0, this.gameServer.tickCount - this.tickOfBirth);
};

Food.prototype.onAdd = function(gameServer) {
    gameServer.nodes.food.push(this);
};

Food.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodes.food.indexOf(this);
    index != -1 && gameServer.nodes.food.splice(index, 1);
};