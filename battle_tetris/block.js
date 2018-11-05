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
                   'chain' : 1,
                   'falling' : null,
                   'clearvframe' : null,
                   'startx' : x,
                   'len' : len};
    for(var i=0; i<len; i++){
        grid[y][x+i] = garbage;
    }
}

function swappable(x,y){
    return (grid[y][x] === null || (grid[y][x].falling === null && grid[y][x].clearvframe === null)) &&
           (y==0 || grid[y-1][x] === null || grid[y-1][x].falling === null);
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
}

// check for clears
function findclears(){
    var maxchain = 0;
    var numcleared = 0;
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(clearable(grid[y][x])){
                var col = grid[y][x].col;
                if(x>1 && clearable(grid[y][x-1], col) && clearable(grid[y][x-2], col)){
                    var chain = Math.max(grid[y][x].chain,  grid[y][x-1].chain,  grid[y][x-2].chain);
                    for(var dx = 0; dx<3; dx++){
                        if(grid[y][x-dx].clearvframe === null) numcleared++;
                        grid[y][x-dx].clearvframe = vframe;
                        grid[y][x-dx].chain = chain;
                    }
                    maxchain = Math.max(maxchain, chain);
                }
                if(y>1 && clearable(grid[y-1][x], col) && clearable(grid[y-2][x], col)){
                    var chain = Math.max(grid[y][x].chain,  grid[y-1][x].chain,  grid[y-2][x].chain);
                    for(var dy = 0; dy<3; dy++){
                        if(grid[y-dy][x].clearvframe === null) numcleared++;
                        grid[y-dy][x].clearvframe = vframe;
                        grid[y-dy][x].chain = chain;
                    }
                    maxchain = Math.max(maxchain, chain);
                }
            }
        }
    }
    ftimer += combo_ftime(numcleared);
    ftimer += chain_ftime(maxchain);
}
