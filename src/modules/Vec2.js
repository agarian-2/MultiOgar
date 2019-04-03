"use strict";

function Vec2(x, y) {
    this.x = x,
    this.y = y;
}

Vec2.prototype.add = function(x, y) {
    return x instanceof Vec2 ? (this.x += x.x, this.y += x.y) : (this.x += x, this.y += y), this;
};

Vec2.prototype.add2 = function(d, m) {
    return this.x += d.x * m, this.y += d.y * m, this;
};

Vec2.prototype.sub = function(x, y) {
    return x instanceof Vec2 ? (this.x -= x.x, this.y -= x.y) : (this.x -= x, this.y -= y), this;
};

Vec2.prototype.sub2 = function(d, m) {
    return this.x -= d.x * m, this.y -= d.y * m, this;
};

Vec2.prototype.angle = function() {
    return Math.atan2(this.x, this.y);
};

Vec2.prototype.clone = function() {
    return new Vec2(this.x, this.y);
};

Vec2.prototype.dist = function() {
    return ~~this.x * ~~this.x + ~~this.y * ~~this.y;
};

Vec2.prototype.sqDist = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.length = function() {
    return this.sqDist(this);
};

Vec2.prototype.normalize = function() {
    return this.scale(1 / this.length());
};

Vec2.prototype.scale = function(x, y) {
    return this.x *= x, this.y *= y || x, this;
};

module.exports = Vec2;
