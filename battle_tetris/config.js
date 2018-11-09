var debug = false;

var nrows = 11;
var ncols = 6;
var gsize = 50;
var ssize = 25; // size of enemy display blocks
var rs = 10; // rowslack; space for imaginary rows above top of screen

var ymax = nrows+rs;

var start_scrspd = .3;
var fast_scrspd = 2;
var fallwait = 15;
var fallspd = 20;
var cleartime = 60;
var drowntime = 60;

var garbage_inittime = 30;
var garbage_blocktime = 10;
var garbage_finaltime = 15;

var scraccel = .01;

var online = true;
//var url = "wss://www.adcoba.com/bt/ws";
var url = "ws://127.0.0.1:4733/";

// given a number of cleared blocks, determine how much freeze time should be
// added
function combo_ftime(numcleared){
    if(numcleared < 4) return 0;
    return 20 + 10*(numcleared-4);
}

// given a chain length, determine how much freeze time should be added
function chain_ftime(chain_len){
    if(chain_len < 2) return 0;
    return 60;
}
