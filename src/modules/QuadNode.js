'use strict';
function QuadNode(bound, maxChild, maxLevel, level, parent) {
    if (!level) level = 0;
    if (!parent) parent = null;
    var width = (bound.maxX - bound.minX) / 2;
    var height = (bound.maxY - bound.minY) / 2;
    this.level = level;
    this.parent = parent;
    this.bound = {
        minX: bound.minX,
        minY: bound.minY,
        maxX: bound.maxX,
        maxY: bound.maxY,
        halfWidth: width,
        halfHeight: height,
        cx: bound.minX + width,
        cy: bound.minY + height
    },
    this.maxChildren = maxChild;
    this.maxLevel = maxLevel;
    this.childNodes = [];
    this.items = [];
}
module.exports = QuadNode;

QuadNode.prototype.insert = function(item) {
    if (item._quadNode != null) throw new TypeError(
        "QuadNode.insert: Cannot insert item which already belongs to another QuadNode!"
    );
    if (this.childNodes.length != 0) {
        var quad = this.getQuad(item.bound);
        if (quad !== -1) return this.childNodes[quad].insert(item);
    }
    this.items.push(item);
    item._quadNode = this;
    if (this.childNodes.length != 0 || this.level >= this.maxLevel || this.items.length < this.maxChildren) return;
    if (this.childNodes.length == 0) {
        var width = this.bound.halfWidth, height = this.bound.halfHeight;
        var x0 = this.bound.minX + width, y0 = this.bound.minY;
        var x1 = this.bound.minX, y1 = this.bound.minY;
        var x2 = this.bound.minX, y2 = this.bound.minY + height;
        var x3 = this.bound.minX + width, y3 = this.bound.minY + height;
        var b0 = {minX: x0, minY: y0, maxX: x0 + width, maxY: y0 + height};
        var b1 = {minX: x1, minY: y1, maxX: x1 + width, maxY: y1 + height};
        var b2 = {minX: x2, minY: y2, maxX: x2 + width, maxY: y2 + height};
        var b3 = {minX: x3, minY: y3, maxX: x3 + width, maxY: y3 + height};
        this.childNodes.push(new QuadNode(b0, this.maxChildren, this.maxLevel, this.level + 1, this)),
        this.childNodes.push(new QuadNode(b1, this.maxChildren, this.maxLevel, this.level + 1, this)),
        this.childNodes.push(new QuadNode(b2, this.maxChildren, this.maxLevel, this.level + 1, this)),
        this.childNodes.push(new QuadNode(b3, this.maxChildren, this.maxLevel, this.level + 1, this));
    }
    for (var i = 0; i < this.items.length;) {
        var quadItem = this.items[i];
        quad = this.getQuad(quadItem.bound);
        if (quad != -1) {
            this.items.splice(i, 1);
            quadItem._quadNode = null;
            this.childNodes[quad].insert(quadItem);
        } else i++;
    }
};

QuadNode.prototype.remove = function(item) {
    if (item._quadNode != this) return item._quadNode.remove(item);
    var index = this.items.indexOf(item);
    if (index < 0) throw new TypeError("QuadNode.remove: Item not found!");
    this.items.splice(index, 1);
    item._quadNode = null;
    cleanup(this);
};

QuadNode.prototype.update = function(item) {
    this.remove(item);
    this.insert(item);
};

QuadNode.prototype.clear = function() {
    for (var i = 0; i < this.items.length; i++) this.items[i]._quadNode = null;
    this.items = [];
    for (var i = 0; i < this.childNodes.length; i++) this.childNodes[i].clear();
    this.childNodes = [];
};

QuadNode.prototype.contains = function(item) {
    if (item._quadNode == null) return 0;
    if (item._quadNode != this) return item._quadNode.contains(item);
    return this.items.indexOf(item) >= 0;
};

QuadNode.prototype.find = function(bound, call) {
    if (0 != this.childNodes.length) {
        var quad = this.getQuad(bound);
        if (quad != -1) this.childNodes[quad].find(bound, call);
        else {
            for (var i = 0; i < this.childNodes.length; i++) {
                var node = this.childNodes[i];
                intersects(node.bound, bound) && node.find(bound, call);
            }
        }
    }
    for (var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        intersects(item.bound, bound) && call(item);
    }
};

QuadNode.prototype.any = function(bound, predicate) {
    if (this.childNodes.length != 0) {
        var quad = this.getQuad(bound);
        if (quad != -1) if (this.childNodes[quad].any(bound, predicate)) return 1;
        else {
            for (var i = 0; i < this.childNodes.length; i++) {
                var node = this.childNodes[i];
                if (intersects(node.bound, bound) &&
                node.any(bound, predicate)) return 1;
            }
        }
    }
    for (var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        if (intersects(item.bound, bound) && (null == predicate || predicate(item))) return 1;
    }
    return 0;
};

QuadNode.prototype.nodeCount = function () {
    var count = 0;
    for (var i = 0; i < this.childNodes.length; i++)
        count += this.childNodes[i].nodeCount();
    return 1 + count;
};

QuadNode.prototype.itemCount = function () {
    var count = 0;
    for (var i = 0; i < this.childNodes.length; i++)
        count += this.childNodes[i].itemCount();
    return this.items.length + count;
};

QuadNode.prototype.getQuad = function(bound) {
    var top = bound.minY < this.bound.cy && bound.maxY < this.bound.cy;
    var left = bound.minX < this.bound.cx && bound.maxX < this.bound.cx;
    if (left) {
        if (top) return 1;
        if (bound.minY > this.bound.cy) return 2;
    } else if (bound.minX > this.bound.cx) {
        if (top) return 0;
        if (bound.minY > this.bound.cy) return 3;
    }
    return -1;
};

function cleanup(node) {
    if (node.parent == null || node.items.length > 0) return;
    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.childNodes.length > 0 || child.items.length > 0) return;
    }
    node.childNodes = [],
    cleanup(node.parent);
}

function intersects(b1, b2) {
    var intersecting =
        b2.minX >= b1.maxX || b2.maxX <= b1.minX ||
        b2.minY >= b1.maxY || b2.maxY <= b1.minY;
    return !intersecting;
}