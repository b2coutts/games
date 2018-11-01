var keyStatus, evqueue;

function keyInit(){
    keyStatus = {};
    evqueue = [];
    document.addEventListener("keydown", function(e){ keyStatus[e.code] = true; evqueue.push(e); });
    document.addEventListener("keyup", function(e){ keyStatus[e.code] = false; });
    document.addEventListener("click", function(e){ evqueue.push(e); });
    document.addEventListener("mousemove", function(e){ evqueue.push(e); });
}

function isdown(code){
    return code in keyStatus ? keyStatus[code] : false;
}

function reset(){
    keyStatus = {};
}
