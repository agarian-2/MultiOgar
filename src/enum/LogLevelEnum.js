function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: 1,
        writable: 0,
        configurable: 0
    });
}
define("NONE", 0);
define("FATAL", 1);
define("ERROR", 2);
define("WARN", 3);
define("INFO", 4);
define("DEBUG", 5);