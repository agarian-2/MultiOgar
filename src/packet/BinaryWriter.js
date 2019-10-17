/*
 * Simple BinaryWriter is a minimal tool to write binary stream with unpredictable size.
 * Useful for binary serialization.
 *
 * Copyright (c) 2016 Barbosik
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 */

function checkAlloc(writer, size) {
    let needed = writer._length + size;
    let chunk = Math.max(Buffer.poolSize / 2, 1024);
    let chunkCount = (needed / chunk) >>> 0;
    if (writer._buffer.length >= needed) return;
    if ((needed % chunk) > 0) chunkCount += 1;
    let buffer = Buffer.alloc(chunkCount * chunk);
    writer._buffer.copy(buffer, 0, 0, writer._length);
    writer._buffer = buffer;
}

class BinaryWriter {
    constructor(size) {
        if (!size || size <= 0) size = Buffer.poolSize / 2;
        this._buffer = Buffer.alloc(size);
        this._length = 0;
    }
    writeUInt8(value) {
        checkAlloc(this, 1);
        this._buffer[this._length++] = value;
    }
    writeInt8(value) {
        checkAlloc(this, 1);
        this._buffer[this._length++] = value;
    }
    writeUInt16(value) {
        checkAlloc(this, 2);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
    }
    writeInt16(value) {
        checkAlloc(this, 2);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
    }
    writeUInt32(value) {
        checkAlloc(this, 4);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
        this._buffer[this._length++] = value >> 16;
        this._buffer[this._length++] = value >> 24;
    }
    writeInt32(value) {
        checkAlloc(this, 4);
        this._buffer[this._length++] = value;
        this._buffer[this._length++] = value >> 8;
        this._buffer[this._length++] = value >> 16;
        this._buffer[this._length++] = value >> 24;
    }
    writeFloat(value) {
        checkAlloc(this, 4);
        this._buffer.writeFloatLE(value, this._length, true);
        this._length += 4;
    }
    writeDouble(value) {
        checkAlloc(this, 8);
        this._buffer.writeDoubleLE(value, this._length, true);
        this._length += 8;
    }
    writeBytes(data) {
        checkAlloc(this, data.length);
        data.copy(this._buffer, this._length, 0, data.length);
        this._length += data.length;
    }
    writeStringUtf8(value) {
        let length = Buffer.byteLength(value, 'utf8');
        checkAlloc(this, length);
        this._buffer.write(value, this._length, 'utf8');
        this._length += length;
    }
    writeStringUnicode(value) {
        let length = Buffer.byteLength(value, 'ucs2');
        checkAlloc(this, length);
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
