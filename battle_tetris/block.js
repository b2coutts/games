var block_cols = ['#A00000', '#00A000', '#0000A0', '#A0A000', '#A000A0',  '#00A0A0'];

function mkblock(col){
    return {'type' : 'block',
            'col'  : col,
            'falling' : null,
            'clearvframe' : null};
}

function swappable(x,y){
    return (grid[y][x] === null || (!grid[y][x].falling && grid[y][x].clearvframe === null)) &&
           (y==0 || grid[y-1][x] === null || grid[y-1][x].falling === null);
}

function fallable(block){
    return block !== null && block.falling === null && block.clearvframe === null;
}

function clearable(block){
    return block !== null && block.falling === null && block.clearvframe === null;
}

function makefall(block){
    block.falling = 0;
}

// BFS from (x,y) for the colour col, pushing all nodes to acc
function bfs(x, y, grpnum, seen, col, acc){
    if(y>=0 && y<nrows && x>=0 && x<ncols &&
       !seen[y][x] && clearable(grid[y][x]) && grid[y][x].col === col){
        acc.push([x,y]);
        seen[y][x] = grpnum;
        bfs(x-1, y, grpnum, seen, col, acc);
        bfs(x+1, y, grpnum, seen, col, acc);
        bfs(x, y-1, grpnum, seen, col, acc);
        bfs(x, y+1, grpnum, seen, col, acc);
    }
}

// check for clears
function findclears(){
    var seen = new Array(nrows);
    for(var i=0; i<nrows; i++) seen[i] = new Array(ncols).fill(0);
    var grpnum = 1;

    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(!seen[y][x] && clearable(grid[y][x])){
                var col = grid[y][x].col;
                if(grid[y][x].clearvframe !== null) col = '#A0A0A0';
                var grp = [];
                bfs(x, y, grpnum, seen, col, grp);
                for(var i = 0; i < grp.length; i++){
                    var [x,y] = grp[i];
                    if(x<ncols-2 && seen[y][x+1] === grpnum && seen[y][x+2] === grpnum){
                        grid[y][x].clearvframe = vframe;
                        grid[y][x+1].clearvframe = vframe;
                        grid[y][x+2].clearvframe = vframe;
                    }
                    if(y<nrows-2 && seen[y+1][x] === grpnum && seen[y+2][x] === grpnum){
                        grid[y][x].clearvframe = vframe;
                        grid[y+1][x].clearvframe = vframe;
                        grid[y+2][x].clearvframe = vframe;
                    }
                }
                grpnum++;
            }
        }
    }

    // for debugging
    for(var y=0; y<nrows; y++){
        for(var x=0; x<ncols; x++){
            if(grid[y][x] !== null) grid[y][x].seen = seen[y][x];
        }
    }
}
