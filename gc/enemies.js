function bullet(x, y, vx, vy){
    function tick(me){
        me.x += me.vx;
        me.y += me.vy;
    }

    var ent = {'x' : x, 'y' : y, 'vx' : vx, 'vy' : vy, 'w' : 6, 'h' : 6,
               'health' : 1, 'vuln' : false, 'tick' : tick, 'col' : '#FF0000'};
    return ent;
}

function randint(n){
    return Math.floor(Math.random()*n);
}

function randnoob(size){
    function tick(me){
        me.life++;
        var xpct = 1.0 * me.x / swidth;
        if(me.oscs>0){
            var orig = me.dir
            if(xpct > .8) me.dir = -1;
            if(xpct < .2) me.dir = 1;
            if(me.dir !== orig) me.oscs--;
        }
        me.x += me.dir * me.speed;

        if(me.life%15 == 0){
            baddies.push(bullet(me.x + me.w/2, me.y+me.h+2,
                                randint(2), 4));
        }
    }
    var x = Math.random()<.5 ? 1-size : swidth-1;
    var y = randint(300);
    var speed = randint(3)+1;
    var oscs = randint(4)+1;
    var ent = {'x' : x, 'y' : y, 'w' : size, 'h' : size, 'health' : 3, 'oscs' : oscs,
               'speed' : speed, 'vuln' : true, 'dir' : 0, 'life' : 0, 'tick' : tick,
               'score' : 100, 'col' : '#DD6633', 'pwrup' : true};
    return ent
}

function wave(size, rank, init){
    function tick(me){
        me.life++;
        if(me.life === 15 & me.rank > 0){
            baddies.push(wave(size, me.rank-1, me.init));
        }

        me.x += me.vx;
        me.y += me.vy;
        if(me.life%8 === 0) me.vy--;
    }
    if(init !== null){
        var clone = Object.assign({}, init);
        clone.size = size;
        clone.rank = rank;
        clone.init = init;
        return clone;
    }
    var left = Math.random() < .5;
    var x = left ? 1-size : swidth-1;
    var vx = left ? 4 : -4;
    var y = randint(100)+50;
    var vy = randint(3)+8;
    var ent = {'x' : x, 'y' : y, 'vx' : vx, 'vy' : 8, 'w' : size,
               'h' : size, 'health' : 1, 'vuln' : true, 'life' : 0,
               'rank' : rank, 'tick' : tick, 'score' : 10, 'col' : '#FF00FF'};
    ent.init = Object.assign({}, ent);
    return ent;
}
