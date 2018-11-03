var frame, vframe;
var ratemult = 1;

var grid, nextrow;
var offset;

var curx, cury;

var gameover = false;

function init(){
    frame = 0;
    vframe = 0;

    nextrow = randrow();
    grid = new Array(nrows);
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
            if(swappable(curx, cury) && swappable(curx+1, cury)){
                var tmp = grid[cury][curx];
                grid[cury][curx] = grid[cury][curx+1];
                grid[cury][curx+1] = tmp;
            }
        }
    }
    evqueue = [];

    var scramt = scrspd;
    if(isdown('Space')) scramt = fast_scrspd;
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(grid[y][x] !== null && grid[y][x].clearvframe !== null) scramt = 0;
        }
    }
    offset += ratemult * scramt;
    while(offset > gsize){
        offset -= gsize;
        if(!gridshift()){
            game_over();
            return;
        }
    }

    // simulate blocks
    findclears();
    // iterate backwards over y for falling resolution to work
    for(var y=nrows-1; y>=0; y--){
        for(var x=0; x<ncols; x++){
            var block = grid[y][x];
            if(block === null) continue;
            if(block.clearvframe !== null){
                if(vframe >= block.clearvframe + cleartime){
                    grid[y][x] = null;
                }
            }else if(block.falling !== null){
                block.falling += fallspd * ratemult;
                if(block.falling >= gsize){
                    if(y === nrows-2 || grid[y+2][x] !== null){
                        block.falling = null;
                    }else{
                        block.falling -= gsize;
                    }
                    grid[y+1][x] = block;
                    grid[y][x] = null;
                }
            }else{
                if(fallable(block) && y<grid.length-1 &&
                   (grid[y+1][x] === null || grid[y+1][x].falling !== null)){
                    makefall(block);
                }
            }
        }
    }

    frame += 1;
    vframe += ratemult;

    draw();
}

function draw(){
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, gsize*ncols, gsize*(nrows+1));
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            var block = grid[y][x];
            if(block !== null){
                ctx.fillStyle = block.col;
                var ylvl = (y+1)*gsize+2 - offset;
                if(block.falling !== null) ylvl += block.falling;
                ctx.fillRect(x*gsize+2, ylvl, gsize-4, gsize-4);
                if(block.clearvframe !== null){
                    ctx.fillStyle = '#000000';
                    var sz = (block.clearvframe - vframe) / cleartime * (gsize/2);
                    ctx.fillRect(x*gsize + gsize/2-sz, ylvl-2 + gsize/2-sz, sz*2, sz*2);
                }

                // for debug purposes
                if(debug){
                    var letter = 'S';
                    if(block.falling !== null) letter = 'F';
                    if(block.clearvframe !== null) letter = 'C';
                    ctx.fillStyle = '#000000';
                    ctx.font = '30px Courier New';
                    ctx.fillText(letter, x*gsize+12, ylvl+35);
                    ctx.font = '15px Courier New';
                    ctx.fillText(block.seen, x*gsize+30, ylvl+40);
                }
            }
        }
    }
    ctx.globalAlpha = .6;
    for(var x=0; x<ncols; x++){
        ctx.fillStyle = nextrow[x].col;
        ctx.fillRect(x*gsize+2, (nrows+1)*gsize+2-offset, gsize-4, offset-2);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(curx*gsize, (cury+1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, (cury+1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, (cury+2)*gsize-offset);
    ctx.lineTo(curx*gsize, (cury+2)*gsize-offset);
    ctx.lineTo(curx*gsize, (cury+1)*gsize-offset);
    ctx.stroke();
}
