'use strict';
exports.parse = exports.decode = decode;
exports.stringify = exports.encode = encode;
exports.safe = safe;
exports.unsafe = unsafe;
exports.getLagMessage = getLagMessage;

var eol = process.platform === "win32" ? "\r\n" : "\n";
const Log = require('./Logger');

function encode(obj, opt) {
    var children = [];
    var out = "";
    if (typeof opt === "string") {
        opt = {
            section: opt,
            whitespace: 0
        };
    } else {
        opt = opt || {};
        opt.whitespace = opt.whitespace === 1;
    }
    var separator = " = ";
    Object.keys(obj).forEach(function (k, _, __) {
        var val = obj[k];
        if (val && Array.isArray(val)) {
            val.forEach(function (item) {
                out += safe(k + "[]") + separator + safe(item) + "\n";
            });
        } else if (val && typeof val === "object") children.push(k);
        else out += safe(k) + separator + safe(val) + eol;
    });
    if (opt.section && out.length) out = "[" + safe(opt.section) + "]" + eol + out;
    children.forEach(function (k, _, __) {
        var nk = dotSplit(k).join('\\.');
        var section = (opt.section ? opt.section + "." : "") + nk;
        var child = encode(obj[k], {
            section: section,
            whitespace: opt.whitespace
        });
        if (out.length && child.length) out += eol;
        out += child;
    });
    return out;
}

function dotSplit(str) {
    return str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
        .replace(/\\\./g, '\u0001')
        .split(/\./).map(function (part) {
    return part.replace(/\1/g, '\\.').replace(/\2LITERAL\\1LITERAL\2/g, '\u0001');
    });
}

function decode(str) {
    var out = {};
    var p = out;
    var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i;
    var lines = str.split(/[\r\n]+/g);
    var section = null;
    lines.forEach(function (line, _, __) {
        if (!line || line.match(/^\s*[;#]/)) return;
        var match = line.match(re);
        if (!match) return;
        if (match[1] !== undefined) {
            section = unsafe(match[1]);
            p = out[section] = out[section] || {};
            return;
        }
        var key = unsafe(match[2]);
        var value = match[3] ? unsafe((match[4] || "")) : 1;
        if (key.length > 2 && key.slice(-2) === "[]") {
            key = key.substring(0, key.length - 2);
            if (!p[key])  p[key] = [];
            else if (!Array.isArray(p[key])) p[key] = [p[key]];
        }
        if (startsWith(value, "mts(") && endsWith(value, ")")) {
            var strValue = value.slice(4, value.length - 1).trim();
            value = Math.sqrt(parseFloat(strValue) * 100) + .5;
        }
        function startsWith(value, pattern) {
            return value.length >= pattern.length && value.indexOf(pattern) === 0;
        }
        function endsWith(value, pattern) {
            return value.length >= pattern.length && value.lastIndexOf(pattern) === value.length - pattern.length;
        }
        if (isNaN(value)) p[key] = value;
        else if (isInt(value)) p[key] = parseInt(value);
        else p[key] = parseFloat(value);
    });
    Object.keys(out).filter(function (k, _, __) {
        if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) return 0;
        var parts = dotSplit(k);
        var p = out;
        var l = parts.pop();
        var nl = l.replace(/\\\./g, '.');
        parts.forEach(function (part, _, __) {
            if (!p[part] || typeof p[part] !== "object") p[part] = {};
            p = p[part];
        });
        if (p === out && nl === l) return 0;
        p[nl] = out[k];
        return 1;
    }).forEach(function (del, _, __) {
        delete out[del];
    });
    return out;
}

function isQuoted(val) {
    return (val.charAt(0) === "\"" && val.slice(-1) === "\"") || (val.charAt(0) === "'" && val.slice(-1) === "'");
}

function safe(val) {
    return (typeof val !== "string" || val.match(/[=\r\n]/) || val.match(/^\[/) || (val.length > 1 && isQuoted(val)) || val !== val.trim()) ?
        JSON.stringify(val) : val.replace(/;/g, '\\;').replace(/#/g, "\\#");
}

function unsafe(val, doUnesc) {
    val = (val || "").trim();
    if (isQuoted(val)) {
        if (val.charAt(0) === "'") val = val.substr(1, val.length - 2);
        try {
            val = JSON.parse(val);
        } catch (err) {
            Log.error(err.stack);
        }
    } else {
        var esc = 0;
        var unesc = "";
        for (var i = 0, l = val.length; i < l; i++) {
            var c = val.charAt(i);
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
}

var isInt = function (n) {
    return parseInt(n) == n;
};

function getLagMessage(updateTimeAvg) {
    if (updateTimeAvg < 20) return "smooth";
    if (updateTimeAvg < 35) return "decent";
    if (updateTimeAvg < 40) return "minor lag";
    if (updateTimeAvg < 50) return "moderate lag";
    if (updateTimeAvg >= 50) return "major lag";
}