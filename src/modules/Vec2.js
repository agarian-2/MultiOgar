"use strict";

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(x, y) {
        if (x instanceof Vec2) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    }
    add2(d, m) {
        this.x += d.x * m;
        this.y += d.y * m;
        return this;
    }
    sub(x, y) {
        if (x instanceof Vec2) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    }
    sub2(d, m) {
        this.x -= d.x * m;
        this.y -= d.y * m;
        return this;
    }
    angle() {
        return Math.atan2(this.x, this.y);
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    dist(d) {
        return ~~d.x * ~~d.x + ~~d.y * ~~d.y;
    }
    sqDist(d) {
        return Math.sqrt(d.x * d.x + d.y * d.y);
    }
    length() {
        return this.sqDist(this);
    }
    normalize() {
        return this.scale(1 / this.length());
    }
    scale(x, y) {
        this.x *= x;
        this.y *= y || x;
        return this;
    }
}

module.exports = Vec2;
