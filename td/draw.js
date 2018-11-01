// draw a selection transparency over the grid coordinatesux+
function drawTransparency(gx, gy, alpha = .4, col = "#FFFFFF"){
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = col;
    ctx.fillRect(gx*grid+1, gy*grid+1, grid-2, grid-2);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawButton(x, y, w, h, img, usable){
    ctx.save();
    ctx.fillStyle = '#0000D0';
    ctx.fillRect(x, y, w, h);
    ctx.drawImage(img, x, y, w, h);
    if(!usable){
        ctx.globalAlpha = .3;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
}

function drawRangeCircle(x, y, range, col='#FFFFFF'){
    var ux = grid*gw;

    ctx.save();
    ctx.globalAlpha = .3;
    ctx.beginPath();
    ctx.fillStyle = col;
    if(range >= ux-x){
        var theta = Math.acos((ux-x) / range);
        ctx.arc(x, y, range, theta, 2*Math.PI-theta, false);
        ctx.fill();
    }else{
        ctx.arc(x, y, range, 0, 2*Math.PI, false);
        ctx.fill();
    }
    ctx.lineWidth = 2;
    ctx.globalAlpha = .7;
    ctx.strokeStyle = col;
    ctx.stroke();
    ctx.restore();
}

function draw(){
    var ux = grid*gw;

    perflog('draw1');

    // draw gamearea backdrop
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#008800";
    ctx.fillRect(0, 0, ux, grid*gh);
    ctx.fillStyle = "#BDB76B";
    for(var i=0; i<enemypath.length-1; i++){
        var x1 = Math.min(enemypath[i][0], enemypath[i+1][0]);
        var x2 = Math.max(enemypath[i][0], enemypath[i+1][0]);
        var y1 = Math.min(enemypath[i][1], enemypath[i+1][1]);
        var y2 = Math.max(enemypath[i][1], enemypath[i+1][1]);
        ctx.fillRect(x1*grid, y1*grid, (x2-x1+1)*grid, (y2-y1+1)*grid);
    }
    ctx.strokeStyle = "#000000";
    ctx.globalAlpha = .3;
    ctx.beginPath();
    for(var gx=0; gx<gw; gx++){
        ctx.moveTo(grid*gx, 0);
        ctx.lineTo(grid*gx, grid*gh);
    }
    for(var gy=0; gy<gh; gy++){
        ctx.moveTo(0, grid*gy);
        ctx.lineTo(grid*gw, grid*gy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    perflog('draw2');

    // draw UI backdrop
    ctx.fillStyle = "#CCA700";
    ctx.fillRect(ux, 0, 300, grid*gh);
    ctx.fillStyle = "#000044";
    ctx.fillRect(ux+2, 2, 300-4, grid*gh-4);
    ctx.fillStyle = "#BDB76B";
    ctx.fillRect(ux, 155, ux+300, 2);
    ctx.fillRect(ux, 260, ux+300, 2);
    ctx.fillRect(ux, 400, ux+300, 2);

    ctx.font = '25px Courier New';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText('UNITS', ux+110, 30)
    ctx.fillText('RESEARCH', ux+88, 185)

    // stats
    ctx.font = '15px Courier New';
    ctx.drawImage(document.images.img_coin, ux+5, 405);
    ctx.fillText(money, ux+23, 416);
    ctx.drawImage(document.images.img_life, ux+5, 425);
    ctx.fillText(lives, ux+23, 436);
    ctx.fillText('Wave: ' + wavenum, ux+5, 456);
    ctx.fillText('Era: ' + era_names[era], ux+5, 476);

    effects.forEach(function(ef){ ef.draw(ef); });

    // draw all entities
    ent_lists.forEach(function(ents){
        ents.forEach(function(ent){ ent.draw(ent); });
    });
    perflog('draw3');

    // various curstate-specific drawing
    var cgx = Math.floor(cursor.x/grid);
    var cgy = Math.floor(cursor.y/grid);
    if(curstate.type === 'place_tower' & overlap(gamearea, cursor) &
       !([cgx,cgy] in pathspots)){
        var col = '#FFFFFF';
        if(towers.some(t => t.gx === cgx & t.gy === cgy)) col = '#FF0000';
        //drawTransparency(cgx, cgy, alpha=.4, col=col);
        ctx.save();
        ctx.globalAlpha = .5;
        ctx.drawImage(curstate.bp.img, cgx*grid, cgy*grid, grid, grid);
        drawRangeCircle(cgx*grid + grid/2, cgy*grid + grid/2, curstate.bp.range, col=col);
        ctx.restore();
    }else if(curstate.type === 'select_tower'){
        drawTransparency(curstate.tower.gx, curstate.tower.gy);
        drawRangeCircle(curstate.tower.x + grid/2,
                        curstate.tower.y + grid/2,
                        curstate.tower.range);
        if(towers.some(t => t.gx === cgx & t.gy === cgy))
            drawTransparency(cgx, cgy, alpha=.2);

        ctx.font = '20px Courier New';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(curstate.tower.name + ' Lv ' + curstate.tower.level, ux+10, 285);
        ctx.font = '14px Courier New';
        for(var i=0; i<curstate.tower.tooltip_stats.length; i++){
            var stat = curstate.tower.tooltip_stats[i];
            var sname = stat + ': ';
            var sval = curstate.tower[stat];
            if(stat === 'shotcd'){
                sname = 'speed: ';
                sval = spd(sval);
            }else if(stat === 'decay_rate'){
                sval = fmtf(sval*6000) + '%/sec';
            }else if(stat === 'cost'){
                continue;
            }
            ctx.fillText(pad(sname, 7) + '' + fmtf(sval), ux+10, 305 + 15*i);
        }
    }else if(curstate.type === 'idle'){
        if(towers.some(t => t.gx === cgx & t.gy === cgy)) 
            drawTransparency(cgx, cgy, alpha=.2);
    }
    perflog('draw4');

    if(tooltip !== null){
        var tooltipfontsize = 12;
        var gap = tooltipfontsize + 2;
        var bezel = 2;
        ctx.font = tooltipfontsize + "px Courier New";
        var w = Math.max(...tooltip.map(s => ctx.measureText(s).width)) + 8;
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(cursor.x-w-bezel, cursor.y-tooltipfontsize-bezel,
                     w+bezel*2, gap * (tooltip.length) + bezel*2 + 6);
        ctx.fillStyle = "#000044";
        ctx.fillRect(cursor.x-w, cursor.y-tooltipfontsize,
                     w, gap * (tooltip.length)+6);
        ctx.fillStyle = "#CCCCCC";
        for(var i=0; i<tooltip.length;i++){
            ctx.fillText(tooltip[i], cursor.x-w+4, cursor.y+2 + gap*i);
        }
    }
    perflog('draw5');
}
