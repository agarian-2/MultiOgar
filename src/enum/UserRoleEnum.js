function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: 1,
        writable: 0,
        configurable: 0
    });
}
define("GUEST", 0);
define("USER", 1);
define("MODER", 2);
define("ADMIN", 4);