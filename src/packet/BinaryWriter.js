'use strict';
const oldNode = parseInt(process.version[1]) < 6;
const allocMax = 524288;

function BinaryWriter() {
    this.sharedBuffer = oldNode ? new Buffer(allocMax) : Buffer.allocUnsafe(allocMax);
    this.allocLength  = 0;
}

module.exports = BinaryWriter;

BinaryWriter.prototype.writeUInt8 = function(value) {
    this.sharedBuffer.writeUInt8(value, this.allocLength++, 1);
};

BinaryWriter.prototype.writeUInt16 = function(value) {
    this.sharedBuffer.writeUInt16LE(value, this.allocLength, 1);
    this.allocLength += 2;
};

BinaryWriter.prototype.writeUInt32 = function(value) {
    this.sharedBuffer.writeUInt32LE(value, this.allocLength, 1);
    this.allocLength += 4;
};

BinaryWriter.prototype.writeFloat = function(value) {
    this.sharedBuffer.writeFloatLE(value, this.allocLength, 1);
    this.allocLength += 4;
};

BinaryWriter.prototype.writeDouble = function(value) {
    this.sharedBuffer.writeDoubleLE(value, this.allocLength, 1);
    this.allocLength += 8;
};

BinaryWriter.prototype.writeBytes = function(data) {
    data.copy(this.sharedBuffer, this.allocLength, 0, data.length);
    this.allocLength += data.length;
};

BinaryWriter.prototype.writeStringZeroUtf8 = function(value) {
    this.sharedBuffer.write(value, this.allocLength, 'utf8');
    this.allocLength += Buffer.byteLength(value, 'utf8');
    this.writeUInt8(0);
};

BinaryWriter.prototype.writeStringZeroUnicode = function(value) {
    this.sharedBuffer.write(value, this.allocLength, 'ucs2');
    this.allocLength += Buffer.byteLength(value, 'ucs2');
    this.writeUInt16(0);
};

BinaryWriter.prototype.toBuffer = function() {
    return this.sharedBuffer.slice(0, this.allocLength);
};