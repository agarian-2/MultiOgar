"use strict";
const UserRoleEnum = require("../enum/UserRoleEnum");
const BinaryWriter = require("./BinaryWriter");

class ChatMessage {
    constructor (sender, message) {
        this.sender = sender;
        this.message = message;
    }
    build(protocol) {
        let text = this.message;
        if (text == null) text = "";
        let name = "SERVER",
            color = {
                r: 255,
                g: 0,
                b: 0
            };
        if (this.sender != null) {
            name = this.sender._name;
            if (name !== "SERVER") color = {
                r: 155,
                g: 155,
                b: 155
            };
            if (name == null || !name.length) {
                if (this.sender.cells.length) name = "An unnamed cell";
                else name = "Spectator";
            }
            if (this.sender.cells.length) color = this.sender.cells[0].color;
        }
        let writer = new BinaryWriter();
        writer.writeUInt8(0x63);
        let flags = 0;
        if (this.sender == null) flags = 0x80;
        else if (this.sender.userRole === UserRoleEnum.ADMIN) flags = 0x40;
        else if (this.sender.userRole === UserRoleEnum.MODER) flags = 0x20;
        writer.writeUInt8(flags);
        writer.writeUInt8(color.r >> 0);
        writer.writeUInt8(color.g >> 0);
        writer.writeUInt8(color.b >> 0);
        if (protocol < 6) {
            writer.writeStringZeroUnicode(name);
            writer.writeStringZeroUnicode(text);
        } else {
            writer.writeStringZeroUtf8(name);
            writer.writeStringZeroUtf8(text);
        }
        return writer.toBuffer();
    }
}

module.exports = ChatMessage;
