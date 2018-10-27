'use strict';
const Cell = require('./Cell');
const Food = require('./Food');
const Virus = require('./Virus');

function MotherCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 2;
    this.spiked = 1;
    this.isMotherCell = 1;
    this.color = {r: 206, g: 99, b: 99};
    this.minSize = 149;
    this.spawnAmount = 2;
    if (!this._size) this.setSize(this.minSize);
}

module.exports = MotherCell;
MotherCell.prototype = new Cell();

MotherCell.prototype.onEaten = Virus.prototype.onEaten;
MotherCell.prototype.explode = Virus.prototype.explode;

MotherCell.prototype.canEat = function (cell) {
    return cell.cellType == 0 || cell.cellType == 2 || cell.cellType == 3;
};

MotherCell.prototype.onUpdate = function () {
    var config = this.gameServer.config;
    if (this.gameServer.nodes.food.length >= config.foodMaxAmount) return;
    var size1 = this._size;
    var foodSize = config.foodMinSize;
    if (config.foodMaxSize > foodSize)
        foodSize = Math.random() * (config.foodMaxSize - foodSize) + foodSize;
    for (var i = 0; i < this.spawnAmount; i++) {
        size1 = Math.sqrt(this.radius - 100);
        size1 = Math.max(size1, this.minSize);
        this.setSize(size1);
        var angle = Math.random() * 2 * Math.PI;
        var pos = {
            x: this.position.x + this._size * Math.sin(angle),
            y: this.position.y + this._size * Math.cos(angle)
        };
        var food = new Food(this.gameServer, null, pos, foodSize);
        food.color = this.gameServer.randomColor();
        this.gameServer.addNode(food);
        food.setBoost(32 + 42 * Math.random(), angle);
        if (this.gameServer.nodes.food.length >= config.foodMaxAmount || size1 <= this.minSize) break;
    }
    this.gameServer.updateNodeQuad(this);
};

MotherCell.prototype.onAdd = function () {};
MotherCell.prototype.onRemove = function () {};