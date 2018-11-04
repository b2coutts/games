var block_cols = ['#A00000', '#00A000', '#0000A0', '#A0A000', '#A000A0',  '#00A0A0'];

function mkblock(col){
    return {'type' : 'block',
            'col'  : col,
            'combo' : 1,
            'falling' : null,
            'clearvframe' : null};
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
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(clearable(grid[y][x])){
                var col = grid[y][x].col;
                if(x>1 && clearable(grid[y][x-1], col) && clearable(grid[y][x-2], col)){
                    var combo = Math.max(grid[y][x].combo,  grid[y][x-1].combo,  grid[y][x-2].combo);
                    for(var dx = 0; dx<3; dx++){
                        grid[y][x-dx].clearvframe = vframe;
                        grid[y][x-dx].combo = combo;
                    }
                }
                if(y>1 && clearable(grid[y-1][x], col) && clearable(grid[y-2][x], col)){
                    var combo = Math.max(grid[y][x].combo,  grid[y-1][x].combo,  grid[y-2][x].combo);
                    for(var dy = 0; dy<3; dy++){
                        grid[y-dy][x].clearvframe = vframe;
                        grid[y-dy][x].combo = combo;
                    }
                }
            }
        }
    }
}
