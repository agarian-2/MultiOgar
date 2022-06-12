"use strict";

class BinaryWriter {
    constructor(size) {
        if (!size || size <= 0) size = Buffer.poolSize / 2;
        this._buffer = Buffer.alloc(size);
        this._length = 0;
    }
    checkAlloc(writer, size) {
        let needed = writer._length + size,
            chunk = Math.max(Buffer.poolSize / 2, 1024),
            chunkCount = (needed / chunk) >>> 0;
        if (writer._buffer.length >= needed) return;
        if ((needed % chunk) > 0) chunkCount += 1;
        let buffer = Buffer.alloc(chunkCount * chunk);
        writer._buffer.copy(buffer, 0, 0, writer._length);
        writer._buffer = buffer;
    }
    writeUInt8(value) {
        this.checkAlloc(this, 1);
        this._buffer[this._length++] = value;
    }
    writeInt8(value) {
        this.checkAlloc(this, 1);
        this._buffer[this._length++] = value;
    }
    writeUInt16(value) {
        this.checkAlloc(this, 2);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
    }
    writeInt16(value) {
        this.checkAlloc(this, 2);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
    }
    writeUInt32(value) {
        this.checkAlloc(this, 4);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
        this._buffer[this._length++] = value >> 16;
        this._buffer[this._length++] = value >> 24;
    }
    writeInt32(value) {
        this.checkAlloc(this, 4);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
        this._buffer[this._length++] = value >> 16;
        this._buffer[this._length++] = value >> 24;
    }
    writeFloat(value) {
        this.checkAlloc(this, 4);
        this._buffer.writeFloatLE(value, this._length, true);
        this._length += 4;
    }
    writeDouble(value) {
        this.checkAlloc(this, 8);
        this._buffer.writeDoubleLE(value, this._length, true);
        this._length += 8;
    }
    writeBytes(data) {
        this.checkAlloc(this, data.length);
        data.copy(this._buffer, this._length, 0, data.length);
        this._length += data.length;
    }
    writeStringUtf8(value) {
        let length = Buffer.byteLength(value, 'utf8');
        this.checkAlloc(this, length);
        this._buffer.write(value, this._length, 'utf8');
        this._length += length;
    }
    writeStringUnicode(value) {
        let length = Buffer.byteLength(value, 'ucs2');
        this.checkAlloc(this, length);
        this._buffer.write(value, this._length, 'ucs2');
        this._length += length;
    }
    writeStringZeroUtf8(value) {
        this.writeStringUtf8(value);
        this.writeUInt8(0);
    }
    writeStringZeroUnicode(value) {
        this.writeStringUnicode(value);
        this.writeUInt16(0);
    }
    getLength() {
        return this._length;
    }
    reset() {
        this._length = 0;
    }
    toBuffer() {
        return Buffer.concat([this._buffer.slice(0, this._length)]);
    }
}

module.exports = BinaryWriter;
