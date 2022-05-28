var BinaryWriter = require("./BinaryWriter");

function ClearAll() {}

module.exports = ClearAll;

ClearAll.prototype.build = function() {
    var writer = new BinaryWriter();
    writer.writeUInt8(0x12);
    return writer.toBuffer();
};
