"use strict";

class QuadNode {
    constructor(bound, maxChild, maxLevel, level, parent) {
        if (!level) level = 0;
        if (!parent) parent = null;
        let width = (bound.maxX - bound.minX) / 2,
            height = (bound.maxY - bound.minY) / 2;
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
        };
        this.maxChildren = maxChild;
        this.maxLevel = maxLevel;
        this.childNodes = [];
        this.items = [];
    }
    cleanup(node) {
        if (node.parent == null || node.items.length > 0) return;
        for (let i = 0; i < node.childNodes.length; i++) {
            let child = node.childNodes[i];
            if (child.childNodes.length > 0 || child.items.length > 0) return;
        }
        node.childNodes = [],
        this.cleanup(node.parent);
    }
    intersects(b1, b2) {
        return !(b2.minX >= b1.maxX || b2.maxX <= b1.minX || b2.minY >= b1.maxY || b2.maxY <= b1.minY);
    }
    insert(item) {
        if (item._quadNode != null) throw new TypeError("QuadNode.insert: Cannot insert item which already belongs to another QuadNode!");
        if (this.childNodes.length !== 0) {
            let quad = this.getQuad(item.bound);
            if (quad !== -1) return this.childNodes[quad].insert(item);
        }
        this.items.push(item);
        item._quadNode = this;
        if (this.childNodes.length !== 0 || this.level >= this.maxLevel || this.items.length < this.maxChildren) return;
        if (this.childNodes.length === 0) {
            let width = this.bound.halfWidth, height = this.bound.halfHeight,
                x0 = this.bound.minX + width,
                y0 = this.bound.minY,
                x1 = this.bound.minX,
                y1 = this.bound.minY,
                x2 = this.bound.minX,
                y2 = this.bound.minY + height,
                x3 = this.bound.minX + width,
                y3 = this.bound.minY + height,
                b0 = {
                    minX: x0,
                    minY: y0,
                    maxX: x0 + width,
                    maxY: y0 + height
                },
                b1 = {
                    minX: x1,
                    minY: y1,
                    maxX: x1 + width,
                    maxY: y1 + height
                },
                b2 = {
                    minX: x2,
                    minY: y2,
                    maxX: x2 + width,
                    maxY: y2 + height
                },
                b3 = {
                    minX: x3,
                    minY: y3,
                    maxX: x3 + width,
                    maxY: y3 + height
                };
            this.childNodes.push(new QuadNode(b0, this.maxChildren, this.maxLevel, this.level + 1, this));
            this.childNodes.push(new QuadNode(b1, this.maxChildren, this.maxLevel, this.level + 1, this));
            this.childNodes.push(new QuadNode(b2, this.maxChildren, this.maxLevel, this.level + 1, this));
            this.childNodes.push(new QuadNode(b3, this.maxChildren, this.maxLevel, this.level + 1, this));
        }
        for (let i = 0; i < this.items.length;) {
            let quadItem = this.items[i],
                quad = this.getQuad(quadItem.bound);
            if (quad !== -1) {
                this.items.splice(i, 1);
                quadItem._quadNode = null;
                this.childNodes[quad].insert(quadItem);
            } else i++;
        }
    }
    remove(item) {
        if (item._quadNode != this) return item._quadNode.remove(item);
        let index = this.items.indexOf(item);
        if (index < 0) throw new TypeError("QuadNode.remove: Item not found!");
        this.items.splice(index, 1);
        item._quadNode = null;
        this.cleanup(this);
    }
    update(item) {
        this.remove(item);
        this.insert(item);
    }
    clear() {
        for (let i = 0; i < this.items.length; i++) this.items[i]._quadNode = null;
        this.items = [];
        for (let i = 0; i < this.childNodes.length; i++) this.childNodes[i].clear();
        this.childNodes = [];
    }
    contains(item) {
        if (item._quadNode == null) return 0;
        if (item._quadNode !== this) return item._quadNode.contains(item);
        return this.items.indexOf(item) >= 0;
    }
    find(bound, call) {
        if (this.childNodes.length) {
            let quad = this.getQuad(bound);
            if (quad !== -1) this.childNodes[quad].find(bound, call);
            else for (let i = 0; i < this.childNodes.length; i++) {
                let node = this.childNodes[i];
                if (this.intersects(node.bound, bound)) node.find(bound, call);
            }
        }
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (this.intersects(item.bound, bound)) call(item);
        }
    }
    any(bound, predicate) {
        if (this.childNodes.length !== 0) {
            let quad = this.getQuad(bound);
            if (quad !== -1) {
                if (this.childNodes[quad].any(bound, predicate)) return 1;
            } else for (let i = 0; i < this.childNodes.length; i++) {
                let node = this.childNodes[i];
                if (this.intersects(node.bound, bound) && node.any(bound, predicate)) return 1;
            }
        }
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (this.intersects(item.bound, bound) && (null == predicate || predicate(item))) return 1;
        }
        return 0;
    }
    nodeCount() {
        let count = 0;
        for (let i = 0; i < this.childNodes.length; i++) count += this.childNodes[i].nodeCount();
        return 1 + count;
    }
    itemCount() {
        let count = 0;
        for (let i = 0; i < this.childNodes.length; i++) count += this.childNodes[i].itemCount();
        return this.items.length + count;
    }
    getQuad(bound) {
        let top = bound.minY < this.bound.cy && bound.maxY < this.bound.cy,
            left = bound.minX < this.bound.cx && bound.maxX < this.bound.cx;
        if (left) {
            if (top) return 1;
            if (bound.minY > this.bound.cy) return 2;
        } else if (bound.minX > this.bound.cx) {
            if (top) return 0;
            if (bound.minY > this.bound.cy) return 3;
        }
        return -1;
    }
}

module.exports = QuadNode;
