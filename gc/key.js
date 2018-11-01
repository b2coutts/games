keyStatus = {};
listener = function(){};

function keyInit(lfcn){
    listener = lfcn;
    document.addEventListener("keydown", function(e){ keyStatus[e.keyCode] = true; listener(e); });
    document.addEventListener("keyup", function(e){ keyStatus[e.keyCode] = false; });
}

function isdown(code){
    return code in keyStatus ? keyStatus[code] : false;
}

function reset(){
    keyStatus = {};
}

function installListener(f){
    listener = f;
}

SHOOT = 32;
LEFT = 65;
RIGHT = 68;
UP = 87;
DOWN = 83;
