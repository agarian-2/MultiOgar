"use strict";

class ClearOwned {
    build() {
        let buffer = new Buffer(1);
        buffer.writeUInt8(0x14, 0, 1);
        return buffer;
    }
}

module.exports = ClearOwned;
