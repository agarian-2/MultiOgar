module.exports = {
    Mode: require("./Mode"),
    FFA: require("./FFA"),
    Teams: require("./Teams"),
    Experimental: require("./Experimental"),
    Rainbow: require("./Rainbow"),
    Tournament: require("./Tournament"),
    HungerGames: require("./HungerGames"),
    //Hide: require("./Hide")
};
var get = function(id) {
    var mode;
    switch (id) {
        case 1:
            mode = new module.exports.Teams;
            break;
        case 2:
            mode = new module.exports.Experimental;
            break;
        case 3:
            mode = new module.exports.Rainbow;
            break;
        case 4:
            mode = new module.exports.Tournament;
            break;
        case 5:
            mode = new module.exports.HungerGames;
            break;
        /*case 6:
            mode = new module.exports.Hide;
            break;*/
        default:
            mode = new module.exports.FFA;
    }
    return mode;
};
module.exports.get = get;