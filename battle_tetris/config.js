var debug = false;

var nrows = 11;
var ncols = 6;
var gsize = 50;

var scrspd = .3;
var fast_scrspd = 2;
var fallwait = 15;
var fallspd = 20;
var cleartime = 60;

var scraccel = .01;

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
