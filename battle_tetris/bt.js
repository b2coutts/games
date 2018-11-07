var ws;

var frame, vframe;
var ratemult = 1;

var grid, nextrow;
var offset;
var ftimer;
var totallines;
var scrspd;

var curx, cury;
var air;

var gameover;

function init(){
    frame = 0;
    vframe = 0;

    nextrow = randrow();
    grid = new Array(ymax);
    for(var i=0; i<ymax; i++) grid[i] = new Array(ncols).fill(null);
    offset = 0;
    ftimer = 0;
    totallines = 0;
    scrspd = start_scrspd;

    curx = Math.floor((ncols-1)/2);
    cury = Math.floor(nrows/4);
    air = drowntime;

    keyInit();

    /*
    if(debug){
        for(var i=3; i<11; i++) grid[i][5] = mkblock(block_cols[i%6]);
    }
    */

    gameover = false;

    main();
}

window.onload=function(){
    canvas = document.getElementById('bt');
    ctx = canvas.getContext('2d');
    if(online){
        ws = new WebSocket("ws://127.0.0.1:4733/");
        ws.onmessage = handleMessage;
        document.getElementById('joinbutton').onclick = function(){
            var roomid = document.getElementById('textin').value;
            joinRoom(roomid);
        }
        document.getElementById('makebutton').onclick = function(){
            var roomid = document.getElementById('textin').value;
            makeRoom(roomid);
        }
    }else{
        init();
    }
}

function gridshift(){
    var toprow = grid.pop();
    if(toprow.some(p => p !== null)) game_over();
    grid.unshift(nextrow);
    nextrow = randrow();
    cury = Math.min(nrows-1, cury+1);
    totallines++;
    scrspd += scraccel;
}

function game_over(){
    gameover = true;
    if(online) sendLoss();
}

function checklose(){
    var drowning = false;
    for(var y=nrows; y<ymax; y++){
        drowning = drowning || grid[y].some(p => p !== null);
    }

    if(drowning){
        air -= ratemult;
        if(air <= 0) game_over();
    }else{
        air = drowntime;
    }

    return drowning;
}

window.main = function(){
    if(gameover) return;
    window.requestAnimationFrame(main);

    frame += 1;
    vframe += ratemult;
    //if(frame%60 !== 0) return;

    for(var i=0; i<evqueue.length; i++){
        var e = evqueue[i];
        if(e.code === kbs['up']){
            cury = Math.min(nrows-1, cury+1);
        }
        if(e.code === kbs['down']){
            cury = Math.max(0, cury-1);
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
            // weird hack lol
            if(!online){
                var len = randint(ncols-2)+3;
                handleMessage({'data' : '{"type" : "garbage", "len" : ' + len + '}'});
            }else{
                sendGarbage(randint(4)+3);
            }
        }
    }
    evqueue = [];


    var scramt = scrspd;
    var scrpause = false;
    for(var y=0; y<ymax; y++){
        for(var x=0; x<ncols; x++){
            if(grid[y][x] !== null && (grid[y][x].clearvframe !== null || grid[y][x].falling !== null)) scrpause = true;
        }
    }
    if(isdown('Space') && !scrpause){
        ftimer = 0;
        scramt = fast_scrspd;
    }
    if(ftimer <= 0 && !scrpause){
        var drowning = checklose();
        if(!drowning){
            offset += ratemult * scramt;
            while(offset > gsize){
                offset -= gsize;
                gridshift();
            }
        }
    }else if(!scrpause){
        ftimer = Math.max(0, ftimer - ratemult);
    }

    // simulate blocks
    for(var y=0; y<ymax; y++){
        for(var x=0; x<ncols; x++){
            var block = grid[y][x];
            if(block === null) continue;
            if('justblocked' in block) block.justblocked--;

            if(block.clearvframe !== null){
                var this_cleartime = block.type === 'garbage' ? 0 : cleartime;
                if(vframe >= block.clearvframe + this_cleartime){
                    if(block.type === 'garbage'){
                        block.type = 'block';
                        block.clearvframe = null;
                        block.col = block.revealcolor;
                        block.justblocked = 2;
                    }else{
                        if(y<ymax-1 && grid[y+1][x] !== null && grid[y+1][x].clearvframe === null){
                            grid[y+1][x].chain = block.chain + 1;
                        }
                        grid[y][x] = null;
                    }
                }
            }else if(block.falling !== null){
                if(vframe >= block.fallvframe){
                    var len = block.type === 'garbage' ? block.len : 1;
                    block.falling += fallspd * ratemult;
                    if(block.falling >= gsize){
                        for(var i=0; i < len; i++){
                            grid[y-1][x+i] = block;
                            grid[y][x+i] = null;
                            if(y === 1 || (grid[y-2][x+i] !== null && grid[y-2][x+i].falling === null)){
                                block.falling = null;
                            }
                        }
                        if(block.falling !== null){
                            block.falling -= gsize;
                            for(var i=0; i < len; i++){
                                block.fallvframe = vframe;
                                if(grid[y-2][x+i] !== null && grid[y-2][x+i].falling !== null){
                                    block.fallvframe = Math.max(block.fallvframe, grid[y-2][x+i].fallvframe);
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
                    mkfall = mkfall && y>0 && (grid[y-1][x+i] === null || grid[y-1][x+i].falling !== null);
                }
                if(mkfall) makefall(block);

                x += block.len-1;
            }else{
                if(fallable(block) && y>0 &&
                   (grid[y-1][x] === null || grid[y-1][x].falling !== null)){
                    makefall(block);
                    if(y<ymax-1 && grid[y+1][x] !== null && grid[y+1][x].clearvframe === null){
                        grid[y+1][x].chain = block.chain;
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
    for(var y=0; y<nrows+1; y++){
        for(var x=0; x<ncols; x++){
            var block = grid[y][x];
            if(block !== null){
                ctx.fillStyle = block.col;
                var len = block.type === 'garbage' ? block.len : 1;
                if(block.type === 'garbage' && block.clearvframe !== null){
                    len=1;
                    if(vframe >= block.revealvframe) ctx.fillStyle = block.revealcolor;
                }
                //var ylvl = (y+1)*gsize+2 - offset;
                var ylvl = (nrows-y)*gsize - offset;

                if(block.falling !== null) ylvl += block.falling;
                ctx.fillRect(x*gsize+2, ylvl, len*gsize-4, gsize-4);
                if(block.clearvframe !== null && block.type === 'block'){
                    ctx.fillStyle = '#000000';
                    var sz = (block.clearvframe - vframe) / cleartime * (gsize/2);
                    ctx.fillRect(x*gsize + gsize/2-sz, ylvl-2 + gsize/2-sz, sz*2, sz*2);
                }

                if(block.clearvframe !== null && block.type === 'block'){
                    ctx.fillStyle = '#000000';
                    ctx.font = '30px Courier New';
                    ctx.fillText('x' + block.chain, x*gsize+12, ylvl+35);
                }

                if(block.clearvframe !== null && block.type === 'garbage'){
                    ctx.save();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(x*gsize+2, ylvl, len*gsize-4, gsize-4);
                    ctx.restore();
                }

                if(debug){
                    ctx.font = '30px Courier New';
                    ctx.fillStyle = '#000000';
                    var type = 'S';
                    if(block.falling !== null) type = 'F';
                    if(block.clearvframe !== null) type = 'C';
                    var str = block.chain + type;
                    ctx.fillText(str, x*gsize+2, ylvl+30);
                }

                x += len-1;
            }
        }
    }
    ctx.globalAlpha = .6;
    for(var x=0; x<ncols; x++){
        ctx.fillStyle = nextrow[x].col;
        ctx.fillRect(x*gsize+2, (nrows+1)*gsize+2-offset, gsize-4, offset-2);
    }
    ctx.globalAlpha = 1;

    var bot = nrows*gsize;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(curx*gsize, bot-(cury-1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, bot-(cury-1)*gsize-offset);
    ctx.lineTo((curx+2)*gsize, bot-(cury)*gsize-offset);
    ctx.lineTo(curx*gsize, bot-(cury)*gsize-offset);
    ctx.lineTo(curx*gsize, bot-(cury-1)*gsize-offset);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(gsize*ncols,0);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Courier New';
    ctx.fillText('Speed: ' + Math.floor(scrspd*100), 10, 50);
    ctx.fillText('Freez: ' + ftimer, 10, 100);
    ctx.fillText('Air:   ' + air, 10, 150);
    if(gameover) ctx.fillText('GAME OVER', 10, 400);
    ctx.restore();
}
