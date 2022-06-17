"use strict";
const Food = require("./Food");
const Virus = require("./Virus");

class MotherCell extends Virus {
    constructor(gameServer, owner, position, size) {
        super(gameServer, owner, position, size);
        this.cellType = 2;
        this.spiked = true;
        this.isMotherCell = true;
        this.color = {
            r: 206,
            g: 99,
            b: 99
        };
        this.minSize = 149;
        if (!this._size) this.setSize(this.minSize);
    }
    canEat(cell) {
        return cell.cellType === 0 || cell.cellType === 2 || cell.cellType === 3;
    }
    onEat(cell) {
        this.setSize(Math.sqrt(this.radius + cell.radius));
    }
    onUpdate() {
        let config = this.gameServer.config;
        if (this.gameServer.nodesFood.length >= config.foodMaxAmount) return;
        let size1 = this._size,
            foodSize = config.foodMinSize;
        if (config.foodMaxSize > foodSize) foodSize = Math.random() * (config.foodMaxSize - foodSize) + foodSize;
        for (let i = 0; i < config.motherFoodSpawnRate; i++) {
            size1 = Math.sqrt(this.radius - 100);
            size1 = Math.max(size1, this.minSize);
            this.setSize(size1);
            let angle = Math.random() * 2 * Math.PI,
                pos = {
                    x: this.position.x + this._size * Math.sin(angle),
                    y: this.position.y + this._size * Math.cos(angle)
                },
                food = new Food(this.gameServer, null, pos, foodSize);
            food.color = this.gameServer.randomColor();
            this.gameServer.addNode(food);
            food.setBoost(32 + 42 * Math.random(), angle);
            if (this.gameServer.nodesFood.length >= config.foodMaxAmount || size1 <= this.minSize) break;
        }
        this.gameServer.updateNodeQuad(this);
    }
    onAdd() {}
    onRemove() {}
}

module.exports = MotherCell;
