'use strict';
const Cell = require("./Cell");

function EjectedMass() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 3;
}

module.exports = EjectedMass;
EjectedMass.prototype = new Cell;

EjectedMass.prototype.onAdd = function(gameServer) {
    gameServer.nodes.eject.push(this);
};

EjectedMass.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodes.eject.indexOf(this);
    index != -1 && gameServer.nodes.eject.splice(index, 1);
};