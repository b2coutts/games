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
    block.fallvframe = vframe + fallwait;
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
                    var [gx,gy] = grp[i];
                    if(gx<ncols-2 && seen[gy][gx+1] === grpnum && seen[gy][gx+2] === grpnum){
                        grid[gy][gx].clearvframe = vframe;
                        grid[gy][gx+1].clearvframe = vframe;
                        grid[gy][gx+2].clearvframe = vframe;
                    }
                    if(gy<nrows-2 && seen[gy+1][gx] === grpnum && seen[gy+2][gx] === grpnum){
                        grid[gy][gx].clearvframe = vframe;
                        grid[gy+1][gx].clearvframe = vframe;
                        grid[gy+2][gx].clearvframe = vframe;
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
