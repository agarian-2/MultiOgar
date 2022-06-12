"use strict";
const eol = process.platform === "win32" ? "\r\n" : "\n";
const Log = require("./Logger");
const encode = (obj, opt) => {
    let children = [],
        out = "";
    if (typeof opt === "string") opt = {
        section: opt,
        whitespace: 0
    };
    else {
        opt = opt || {};
        opt.whitespace = opt.whitespace === 1;
    }
    let separator = " = ";
    Object.keys(obj).forEach(function (k, _, __) {
        let val = obj[k];
        if (val && Array.isArray(val)) val.forEach(item => {
            out += safe(k + "[]") + separator + safe(item) + "\n";
        });
        else if (val && typeof val === "object") children.push(k);
        else out += safe(k) + separator + safe(val) + eol;
    });
    if (opt.section && out.length) out = "[" + safe(opt.section) + "]" + eol + out;
    children.forEach(function (k, _, __) {
        let nk = dotSplit(k).join("\\."),
            section = (opt.section ? opt.section + "." : "") + nk,
            child = encode(obj[k], {
                section: section,
                whitespace: opt.whitespace
            });
        if (out.length && child.length) out += eol;
        out += child;
    });
    return out;
};
const dotSplit = str => str.replace(/\1/g, "\u0002LITERAL\\1LITERAL\u0002").replace(/\\\./g, "\u0001").split(/\./).map(part => part.replace(/\1/g, "\\.").replace(/\2LITERAL\\1LITERAL\2/g, "\u0001"));
const startsWith = (value, pattern) => value.length >= pattern.length && value.indexOf(pattern) === 0;
const endsWith = (value, pattern) => value.length >= pattern.length && value.lastIndexOf(pattern) === value.length - pattern.length;
const decode = str => {
    let out = {},
        p = out,
        re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i,
        lines = str.split(/[\r\n]+/g),
        section = null;
    lines.forEach((line, _, __) => {
        if (!line || line.match(/^\s*[;#]/)) return;
        let match = line.match(re);
        if (!match) return;
        if (match[1] !== undefined) {
            section = unsafe(match[1]);
            p = out[section] = out[section] || {};
            return;
        }
        let key = unsafe(match[2]),
            value = match[3] ? unsafe((match[4] || "")) : 1;
        if (key.length > 2 && key.slice(-2) === "[]") {
            key = key.substring(0, key.length - 2);
            if (!p[key])  p[key] = [];
            else if (!Array.isArray(p[key])) p[key] = [p[key]];
        }
        if (startsWith(value, "mts(") && endsWith(value, ")")) {
            let strValue = value.slice(4, value.length - 1).trim();
            value = Math.sqrt(parseFloat(strValue) * 100) + .5;
        }
        if (isNaN(value)) p[key] = value;
        else if (parseInt(value) == value) p[key] = parseInt(value);
        else p[key] = parseFloat(value);
    });
    Object.keys(out).filter((k, _, __) => {
        if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) return 0;
        let parts = dotSplit(k),
            p = out,
            l = parts.pop(),
            nl = l.replace(/\\\./g, ".");
        parts.forEach((part, _, __) => {
            if (!p[part] || typeof p[part] !== "object") p[part] = {};
            p = p[part];
        });
        if (p === out && nl === l) return 0;
        p[nl] = out[k];
        return 1;
    }).forEach((del, _, __) => {
        delete out[del];
    });
    return out;
};
const isQuoted = val => (val.charAt(0) === "\"" && val.slice(-1) === "\"") || (val.charAt(0) === "'" && val.slice(-1) === "'");
const safe = val => (typeof val !== "string" || val.match(/[=\r\n]/) || val.match(/^\[/) || (val.length > 1 && isQuoted(val)) || val !== val.trim()) ? JSON.stringify(val) : val.replace(/;/g, "\\;").replace(/#/g, "\\#");
const unsafe = val => {
    val = (val || "").trim();
    if (isQuoted(val)) {
        if (val.charAt(0) === "'") val = val.substr(1, val.length - 2);
        try {
            val = JSON.parse(val);
        } catch (err) {
            Log.error(err.stack);
        }
    } else {
        let esc = 0,
            unesc = "";
        for (let i = 0, l = val.length; i < l; i++) {
            let c = val.charAt(i);
            if (esc) {
                if ("\\;#".indexOf(c) !== -1) unesc += c;
                else unesc += "\\" + c;
                esc = 0;
            } else if (";#".indexOf(c) !== -1) break;
            else if (c === "\\") esc = 1;
            else unesc += c;
        }
        if (esc) unesc += "\\";
        return unesc;
    }
    return val;
};
const getLagMessage = updateTimeAvg => updateTimeAvg < 20 ? "smooth" : updateTimeAvg < 35 ? "decent" : updateTimeAvg < 40 ? "minor lag" : updateTimeAvg < 50 ? "moderate lag" : updateTimeAvg >= 50 ? "major lag" : "unknown";

exports.parse = exports.decode = decode;
exports.stringify = exports.encode = encode;
exports.safe = safe;
exports.unsafe = unsafe;
exports.getLagMessage = getLagMessage;
