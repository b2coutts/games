var frame, vframe;
var ratemult = 1;

var grid, nextrow;
var offset;
var ftimer;
var totallines;

var curx, cury;

var gameover = false;

function init(){
    frame = 0;
    vframe = 0;

    nextrow = randrow();
    grid = new Array(nrows);
    for(var i=0; i<nrows; i++) grid[i] = new Array(ncols).fill(null);
    offset = 0;
    ftimer = 0;
    totallines = 0;

    curx = Math.floor((ncols-1)/2);
    cury = Math.floor(nrows*3/4);

    keyInit();

    if(debug){
        for(var i=3; i<11; i++) grid[i][5] = mkblock(block_cols[i%6]);
    }
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
        do{
            row[i] = mkblock(block_cols[randint(block_cols.length)]);
        }while(i>=2 && row[i-2].col === row[i-1].col && row[i-1].col === row[i].col);
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
    totallines++;
    scrspd += scraccel;

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
        if(e.code === 'KeyG'){
            for(var y=nrows-1; y>0; y--){
                if(grid[y].every(p => p === null)){
                    spawn_garbage(0, y, ncols);
                    break;
                }
            }
        }
    }
    evqueue = [];

    var scramt = scrspd;
    var scrpause = false;
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(grid[y][x] !== null && (grid[y][x].clearvframe !== null || grid[y][x].falling !== null)) scrpause = true;
        }
    }
    if(isdown('Space') && !scrpause){
        ftimer = 0;
        scramt = fast_scrspd;
    }
    if(ftimer <= 0 && !scrpause){
        offset += ratemult * scramt;
        while(offset > gsize){
            offset -= gsize;
            if(!gridshift()){
                game_over();
                return;
            }
        }
    }else if(!scrpause){
        ftimer = Math.max(0, ftimer - ratemult);
    }

    // simulate blocks
    // iterate backwards over y for falling resolution to work
    for(var y=nrows-1; y>=0; y--){
        for(var x=0; x<ncols; x++){
            var block = grid[y][x];
            if(block === null) continue;
            if(block.clearvframe !== null){
                if(vframe >= block.clearvframe + cleartime){
                    if(y>0 && grid[y-1][x] !== null && grid[y-1][x].clearvframe === null){
                        grid[y-1][x].chain = block.chain + 1;
                    }
                    grid[y][x] = null;
                }
            }else if(block.falling !== null){
                if(vframe >= block.fallvframe){
                    var len = block.type === 'garbage' ? block.len : 1;
                    block.falling += fallspd * ratemult;
                    if(block.falling >= gsize){
                        for(var i=0; i < len; i++){
                            grid[y+1][x+i] = block;
                            grid[y][x+i] = null;
                            if(y === nrows-2 || (grid[y+2][x+i] !== null && grid[y+2][x+i].falling === null)){
                                block.falling = null;
                            }
                        }
                        if(block.falling !== null){
                            block.falling -= gsize;
                            for(var i=0; i < len; i++){
                                block.fallvframe = vframe;
                                if(grid[y+2][x+i] !== null && grid[y+2][x+i].falling !== null){
                                    block.fallvframe = Math.max(block.fallvframe, grid[y+2][x+i].fallvframe);
                                    block.falling = 0;
                                }
                            }
                        }
                    }
                    x += len-1;
                }
            }else if(block.type === 'garbage'){
                var mkfall = true;
                for(var i=0; i<block.len; i++){
                    mkfall = mkfall & (grid[y+1][x+i] === null || grid[y+1][x+i].falling !== null);
                }
                if(mkfall) makefall(block);

                x += block.len-1;
            }else{
                if(fallable(block) && y<grid.length-1 &&
                   (grid[y+1][x] === null || grid[y+1][x].falling !== null)){
                    makefall(block);
                    if(y>0 && grid[y-1][x] !== null && grid[y-1][x].clearvframe === null){
                        grid[y-1][x].chain = block.chain;
                    }
                }else{
                    block.chain = 1;
                }
            }
        }
    }
    findclears();

    draw();
}

function draw(){
    ctx.save();
    ctx.fillStyle = '#505050';
    ctx.fillRect(0, 0, 500, 600);

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

                if(block.clearvframe !== null){
                    ctx.fillStyle = '#000000';
                    ctx.font = '30px Courier New';
                    ctx.fillText('x' + block.chain, x*gsize+12, ylvl+35);
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
    ctx.restore();

    ctx.save();
    ctx.translate(gsize*ncols,0);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Courier New';
    ctx.fillText('Speed: ' + Math.floor(scrspd*100), 10, 50);
    ctx.fillText('Freez: ' + ftimer, 10, 100);
    ctx.restore();
}
