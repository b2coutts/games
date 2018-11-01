// static config parameters
var fps = 1;
var playervelo = 4;
var shotvelo = 8;
var playersize = 10;
var shoot_cd = 5; // number of frames between shots

// TODO: can we get these from the element itself?
var swidth = 600;
var sheight = 600;

window.onload=function(){
    canvas = document.getElementById('gc');
    ctx = canvas.getContext('2d');
    keyInit(handleInput);
    setInterval(frame,1000/fps);
}

// game state
var frame = 0;
var vx,vy;
var px,py;
var lastshot = 0;

var goodprojs = [];
var badprojs = [];

function handleInput(e){
}

function addproj(lst, x, y, vx, vy){
    var proj = {'x' : x, 'y' : y, 'vx' : vx, 'vy' : vy}
    lst.push(proj);
}

window.main = function(){
    window.requestAnimationFrame(main);

    if(e.code == SHOOT) addproj(goodprojs, px, py, 0, shotvelo);

    vx = vy = 0;
    if(isdown(LEFT)) vx -= playervelo;
    if(isdown(RIGHT)) vx += playervelo;
    if(isdown(UP)) vy -= playervelo;
    if(isdown(DOWN)) vy += playervelo;

    px = max(0, min(swidth-playersize, px+vx));
    py = max(0, min(sheight-playersize, py+vy));

    draw();
}

function draw(){
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, swidth, sheight);

    ctx.fillStyle = "#00AAAA";
    ctx.fillRect(px, py, playersize, playersize);
}
