function BinaryWriter(size) {
    if (!size || size <= 0) size = Buffer.poolSize / 2;
    this._buffer = Buffer.alloc(size);
    this._length = 0;
}

module.exports = BinaryWriter;

BinaryWriter.prototype.checkAlloc = function(writer, size) {
    var needed = writer._length + size,
        chunk = Math.max(Buffer.poolSize / 2, 1024),
        chunkCount = (needed / chunk) >>> 0;
    if (writer._buffer.length >= needed) return;
    if ((needed % chunk) > 0) chunkCount += 1;
    var buffer = Buffer.alloc(chunkCount * chunk);
    writer._buffer.copy(buffer, 0, 0, writer._length);
    writer._buffer = buffer;
};

BinaryWriter.prototype.writeUInt8 = function(value) {
    this.checkAlloc(this, 1);
    this._buffer[this._length++] = value;
};

BinaryWriter.prototype.writeInt8 = function(value) {
    this.checkAlloc(this, 1);
    this._buffer[this._length++] = value;
};

BinaryWriter.prototype.writeUInt16 = function(value) {
    this.checkAlloc(this, 2);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
};

BinaryWriter.prototype.writeInt16 = function(value) {
    this.checkAlloc(this, 2);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
};

BinaryWriter.prototype.writeUInt32 = function(value) {
    this.checkAlloc(this, 4);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
    this._buffer[this._length++] = value >> 16;
    this._buffer[this._length++] = value >> 24;
};

BinaryWriter.prototype.writeInt32 = function(value) {
    this.checkAlloc(this, 4);
    this._buffer[this._length++] = value;
    this._buffer[this._length++] = value >> 8;
    this._buffer[this._length++] = value >> 16;
    this._buffer[this._length++] = value >> 24;
};

BinaryWriter.prototype.writeFloat = function(value) {
    this.checkAlloc(this, 4);
    this._buffer.writeFloatLE(value, this._length, true);
    this._length += 4;
};

BinaryWriter.prototype.writeDouble = function(value) {
    this.checkAlloc(this, 8);
    this._buffer.writeDoubleLE(value, this._length, true);
    this._length += 8;
};

BinaryWriter.prototype.writeBytes = function(data) {
    this.checkAlloc(this, data.length);
    data.copy(this._buffer, this._length, 0, data.length);
    this._length += data.length;
};

BinaryWriter.prototype.writeStringUtf8 = function(value) {
    var length = Buffer.byteLength(value, 'utf8');
    this.checkAlloc(this, length);
    this._buffer.write(value, this._length, 'utf8');
    this._length += length;
};

BinaryWriter.prototype.writeStringUnicode = function(value) {
    var length = Buffer.byteLength(value, 'ucs2');
    this.checkAlloc(this, length);
    this._buffer.write(value, this._length, 'ucs2');
    this._length += length;
};

BinaryWriter.prototype.writeStringZeroUtf8 = function(value) {
    this.writeStringUtf8(value);
    this.writeUInt8(0);
};

BinaryWriter.prototype.writeStringZeroUnicode = function(value) {
    this.writeStringUnicode(value);
    this.writeUInt16(0);
};

BinaryWriter.prototype.getLength = function() {
    return this._length;
};

BinaryWriter.prototype.reset = function() {
    this._length = 0;
};

BinaryWriter.prototype.toBuffer = function() {
    return Buffer.concat([this._buffer.slice(0, this._length)]);
};
