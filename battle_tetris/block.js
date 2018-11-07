var block_cols = ['#A00000', '#00A000', '#0000A0', '#A0A000', '#A000A0',  '#00A0A0'];

function mkblock(col){
    return {'type' : 'block',
            'col'  : col,
            'chain' : 1,
            'falling' : null,
            'clearvframe' : null};
}

function spawn_garbage(x, y, len){
    var garbage = {'type' : 'garbage',
                   'col' : '#A0A0A0',
                   'chain' : 0,
                   'falling' : null,
                   'revealvframe' : null,
                   'clearvframe' : null,
                   'clearseen' : false,
                   'startx' : x,
                   'len' : len};
    for(var i=0; i<len; i++){
        grid[y][x+i] = garbage;
    }
}

function swappable(x,y){
    return (grid[y][x] === null || (grid[y][x].falling === null && grid[y][x].clearvframe === null)) &&
           (y<ymax-1 || grid[y+1][x] === null || grid[y+1][x].falling === null);
}

function fallable(block){
    return block !== null && block.falling === null && block.clearvframe === null;
}

// checks if a block is clearable; if a color is supplied, also requires the
// block to have that color
function clearable(block, col=null){
    return block !== null &&
           block.type === 'block' &&
           block.falling === null &&
           (block.clearvframe === null || block.clearvframe === vframe) &&
           (col === null || block.col === col);
}

function makefall(block){
    block.falling = 0;
    block.fallvframe = vframe + fallwait;
    if('justblocked' in block && block.justblocked>0) block.fallvframe -= fallwait;
}

function randcols(n){
    var colors = new Array(n);
    for(var i=0; i<n; i++){
        do{
            colors[i] = block_cols[randint(block_cols.length)];
        }while(i>=2 && colors[i-2] === colors[i-1] && colors[i-1] === colors[i]);
    }
    return colors;
}

function randrow(){
    return randcols(ncols).map(mkblock);
}

function gdfs(x, y, chain, pushto){
    if(x>=0 && x<ncols && y>=0 && y<ymax &&
       grid[y][x] !== null && grid[y][x].type === 'garbage' && !grid[y][x].clearseen){
        grid[y][x] = Object.assign({}, grid[y][x]);
        grid[y][x].clearseen = true;
        pushto.push([x,y,chain+1]);
        gdfs(x-1, y, chain, pushto);
        gdfs(x+1, y, chain, pushto);
        gdfs(x, y-1, chain, pushto);
        gdfs(x, y+1, chain, pushto);
    }
}

function findgarbage(x, y, chain, pushto){
    gdfs(x-1, y, chain, pushto);
    gdfs(x+1, y, chain, pushto);
    gdfs(x, y-1, chain, pushto);
    gdfs(x, y+1, chain, pushto);
}

// check for clears
function findclears(){
    var maxchain = 0;
    var numcleared = 0;
    var clears = [];
    for(var y=0; y<ymax; y++){
        for(var x=0; x<ncols; x++){
            if(clearable(grid[y][x])){
                var col = grid[y][x].col;
                if(x>1 && clearable(grid[y][x-1], col) && clearable(grid[y][x-2], col)){
                    var chain = Math.max(grid[y][x].chain,  grid[y][x-1].chain,  grid[y][x-2].chain);
                    for(var dx = 0; dx<3; dx++){
                        if(grid[y][x-dx].clearvframe === null) numcleared++;
                        grid[y][x-dx].clearvframe = vframe;
                        grid[y][x-dx].chain = chain;
                        clears.push([x-dx, y, chain]);
                    }
                    maxchain = Math.max(maxchain, chain);
                }
                if(y<ymax-2 && clearable(grid[y+1][x], col) && clearable(grid[y+2][x], col)){
                    var chain = Math.max(grid[y][x].chain,  grid[y+1][x].chain,  grid[y+2][x].chain);
                    for(var dy = 0; dy<3; dy++){
                        if(grid[y+dy][x].clearvframe === null) numcleared++;
                        grid[y+dy][x].clearvframe = vframe;
                        grid[y+dy][x].chain = chain;
                        clears.push([x, y+dy, chain]);
                    }
                    maxchain = Math.max(maxchain, chain);
                }
            }
        }
    }

    clears.sort((a,b) => b[2]-a[2]);

    // find garbage to clear
    var garbage = [];
    for(var i=0; i<clears.length; i++){
        var [x,y,chain] = clears[i];
        findgarbage(x, y, chain, garbage);
    }

    garbage.sort((a,b) => ncols*(b[1]-a[1]) + a[0]-b[0]);
    var cvf = vframe + garbage_inittime + garbage.length*garbage_blocktime + garbage_finaltime;
    var colors = randcols(garbage.length);
    for(var i=0; i<garbage.length; i++){
        var [x,y,chain] = garbage[i];
        grid[y][x].chain = chain;
        grid[y][x].clearvframe = cvf;
        grid[y][x].revealvframe = vframe + garbage_inittime + i*garbage_blocktime;
        grid[y][x].revealcolor = colors[i];
    }

    // add freeze time if needed
    ftimer += combo_ftime(numcleared);
    ftimer += chain_ftime(maxchain);
}
