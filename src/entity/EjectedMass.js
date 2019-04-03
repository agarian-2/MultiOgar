'use strict';
const Cell = require("./Cell");

function EjectedMass() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 3;
}

module.exports = EjectedMass;
EjectedMass.prototype = new Cell;

EjectedMass.prototype.onAdd = function(gameServer) {
    gameServer.nodesEject.push(this);
};

EjectedMass.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesEject.indexOf(this);
    if (index !== -1) gameServer.nodesEject.splice(index, 1);
};
