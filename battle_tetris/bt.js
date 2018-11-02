var nrows = 11;
var ncols = 6;
var gsize = 50;

var frame, vframe;
var ratemult = 1;

var scrspd = .3;

var grid, nextrow;
var offset;

var curx, cury;

var gameover = false;

function init(){
    frame = 0;
    vframe = 0;

    grid = new Array(nrows);
    nextrow = randrow();
    for(var i=0; i<nrows; i++) grid[i] = new Array(ncols).fill(null);
    offset = 0;

    curx = 0;
    cury = 0;

    keyInit();
}

window.onload=function(){
    canvas = document.getElementById('bt');
    ctx = canvas.getContext('2d');
    init();
    main();
}

function randrow(){
    var row = new Array(ncols);
    for(var i=0; i<ncols; i++){
        row[i] = mkblock(block_cols[randint(block_cols.length)]);
    }
    return row;
}

function gridshift(){
    for(var x=0; x<ncols; x++){
        if(grid[0][x] !== null) return false;
    }

    grid.splice(0,1);
    grid.push(nextrow);
    nextrow = randrow();
    cury = Math.max(0, cury-1);

    return true;
}

function game_over(){
    alert('game over');
    gameover = true;
}

window.main = function(){
    if(gameover) return;
    window.requestAnimationFrame(main);

    frame += 1;
    vframe += ratemult;
    offset += ratemult * scrspd;
    while(offset > gsize){
        offset -= gsize;
        if(!gridshift()){
            game_over();
            return;
        }
    }

    for(var i=0; i<evqueue.length; i++){
        var e = evqueue[i];
        if(e.code === kbs['up']){
            cury = Math.max(0, cury-1);
        }
        if(e.code === kbs['down']){
            cury = Math.min(nrows-1, cury+1);
        }
        if(e.code === kbs['left']){
            curx = Math.max(0, curx-1);
        }
        if(e.code === kbs['right']){
            curx = Math.min(ncols-2, curx+1);
        }
        if(e.code === kbs['accept']){
            // TODO: check for falling or something
            var tmp = grid[cury][curx];
            grid[cury][curx] = grid[cury][curx+1];
            grid[cury][curx+1] = tmp;
        }
    }
    evqueue = [];

    draw();
}

function draw(){
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, gsize*ncols, gsize*(nrows+1));
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(grid[y][x] !== null){
                ctx.fillStyle = grid[y][x].col;
                ctx.fillRect(x*gsize+2, (y+1)*gsize+2-offset, gsize-4, gsize-4);
            }
        }
    }
    ctx.globalAlpha = .6;
    for(var x=0; x<ncols; x++){
        ctx.fillStyle = nextrow[x].col;
        ctx.fillRect(x*gsize+2, (nrows+1)*gsize+2-offset, gsize-4, offset-2);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(curx*gsize, (cury+1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, (cury+1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, (cury+2)*gsize-offset);
    ctx.lineTo(curx*gsize, (cury+2)*gsize-offset);
    ctx.lineTo(curx*gsize, (cury+1)*gsize-offset);
    ctx.stroke();
}
