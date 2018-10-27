'use strict';
function BinaryReader(buffer) {
    this._offset = 0;
    this._buffer = new Buffer(buffer);
}

module.exports = BinaryReader;

BinaryReader.prototype.readUInt8 = function() {
    var val = this._buffer.readUInt8(this._offset);
    this._offset += 1;
    return val;
};

BinaryReader.prototype.readInt8 = function() {
    var val = this._buffer.readInt8(this._offset);
    this._offset += 1;
    return val;
};

BinaryReader.prototype.readUInt16 = function() {
    var val = this._buffer.readUInt16LE(this._offset);
    this._offset += 2;
    return val;
};

BinaryReader.prototype.readInt16 = function() {
    var val = this._buffer.readInt16LE(this._offset);
    this._offset += 2;
    return val;
};

BinaryReader.prototype.readUInt32 = function() {
    var val = this._buffer.readUInt32LE(this._offset);
    this._offset += 4;
    return val;
};

BinaryReader.prototype.readInt32 = function() {
    var val = this._buffer.readInt32LE(this._offset);
    this._offset += 4;
    return val;
};

BinaryReader.prototype.readFloat = function() {
    var val = this._buffer.readFloatLE(this._offset);
    this._offset += 4;
    return val;
};

BinaryReader.prototype.readDouble = function() {
    var val = this._buffer.readDoubleLE(this._offset);
    this._offset += 8;
    return val;
};

BinaryReader.prototype.readBytes = function(len) {
    this._buffer.slice(this._offset, this._offset + len);
};

BinaryReader.prototype.skipBytes = function(len) {
    this._offset += len;
};

BinaryReader.prototype.readStringUtf8 = function(len) {
    if (len == null) len = this._buffer.length - this._offset;
    len = Math.max(0, len);
    var val = this._buffer.toString('utf8', this._offset, this._offset + len);
    this._offset += len;
    return val;
};

BinaryReader.prototype.readStringUnicode = function(len) {
    if (len == null) len = this._buffer.length - this._offset;
    len = Math.max(0, len);
    var safeLen = len - (len % 2);
    safeLen = Math.max(0, safeLen);
    var val = this._buffer.toString('ucs2', this._offset, this._offset + safeLen);
    this._offset += len;
    return val;
};

BinaryReader.prototype.readStringZeroUtf8 = function() {
    var len = 0;
    var termLen = 0;
    for (var i = this._offset; i < this._buffer.length; i++) {
        if (this._buffer.readUInt8(i) == 0) {termLen = 1; break;}
        len++;
    }
    var val = this.readStringUtf8(len);
    this._offset += termLen;
    return val;
};

BinaryReader.prototype.readStringZeroUnicode = function() {
    var len = 0;
    var termLen = ((this._buffer.length - this._offset) & 1) != 0 ? 1 : 0;
    for (var i = this._offset; i + 1 < this._buffer.length; i += 2) {
        if (this._buffer.readUInt16LE(i) == 0) {termLen = 2; break;}
        len += 2;
    }
    var val = this.readStringUnicode(len);
    this._offset += termLen;
    return val;
};