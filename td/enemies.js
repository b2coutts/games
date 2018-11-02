var enemypath, enemypts, pathspots;

function enemy_init(){
    enemypath = [[1,-1], [1,11], [8,11], [8,3], [14,3], [14,14], [1,14], [1,17], [17,17], [17,-1]];
    enemypts = enemypath.map(p => ({'x' : grid*p[0], 'y' : grid*p[1]}));
    pathspots = {};
    var [x,y] = enemypath[0];
    for(var i=1; i<enemypath.length; i++){
        var [dx,dy] = enemypath[i];
        while(x !== dx || y !== dy){
            if(x>0 & x<gw & y>0 & y<gh){
                pathspots[[x,y]] = true;
            }
            if(x !== dx){
                x += (dx-x) / Math.abs(dx-x);
            }else{
                y += (dy-y) / Math.abs(dy-y);
            }
        }
    }
}

// function to take a certain amount of damage
function dmg(enemy, dmg){
    var init_hp = enemy.hp;
    if('burneff' in enemy) dmg *= enemy.burneff.mult;
    enemy.hp -= dmg;
    if(init_hp > 0 && enemy.hp <= 0) return 1;
    return 0;
}

function make_wave(enemy, amt, period){
    var wave = {'schedule' : {},
                'amt' : amt,
                'started' : null,
                'dur' : (amt-1)*period,
                'enemy' : enemy};
    for(var i=0; i<amt; i++){
        wave.schedule[i*period] = Object.assign({}, enemy);
        wave.schedule[i*period].spawned = false;
    }

    wave.tick = function(me){
        if(me.started === null) me.started = vframe;
        Object.keys(me.schedule).forEach(function(dt){
            var bad = me.schedule[dt];
            if(!bad.spawned && vframe-me.started >= dt){
                bads.push(bad);
                bad.spawned = true;
            }
        });
        if(vframe - me.started > me.dur & bads.length === 0){
            curwave = null;
            wavenum++;
        }
    }

    return wave;
}

function make_enemy(name, maxhp, speed, w, h, img, gold){
    var enemy = {'x' : enemypts[0].x, 'y' : enemypts[0].y, 'w' : w, 'h' : h,
                 'hp' : maxhp, 'maxhp' : maxhp, 'speed' : speed, 'dest_idx' : 1,
                 'img' : img, 'gold' : gold, 'name' : name};
    enemy.x += (grid-w)/2;

    enemy.dmg = dmg;

    enemy.draw = function(me){
        if(me.img === null){
            ctx.fillStyle = '#888888'
            ctx.fillRect(me.x, me.y, me.w, me.h);
        }else{
            ctx.drawImage(me.img, me.x, me.y, me.w, me.h);
        }

        // hp bar
        var pct = Math.max(0, Math.min(1, me.hp/me.maxhp));
        ctx.fillStyle = '#222222';
        ctx.fillRect(me.x, me.y-6, me.w, 5);
        var r = pct>.5 ? 510*(1-pct) : 255;
        var g = pct<.5 ? 510*pct : 255;
        ctx.fillStyle = 'rgb(' + r + ', ' + g + ',0)';
        ctx.fillRect(me.x+1, me.y-5, pct*(me.w-2), 3);

        // draw status effects
        if('bleedeff' in me){
            ctx.drawImage(document.images.img_bleed, me.x+me.w-5, me.y, 5, 8);
        }

        if('burneff' in me){
            ctx.drawImage(document.images.img_third_degree_burns,
                          me.x, me.y, 7, 7);
        }
    }

    enemy.tick = function(me){
        if('bleedeff' in me){
            if(me.bleedeff.timeout <= vframe){
                delete me['bleedeff'];
            }else{
                me.hp -= me.bleedeff.rate * (vframe - me.bleedeff.lastbleed);
                me.bleedeff.lastbleed = vframe;
            }
        }

        if('burneff' in me && me.burneff.timeout <= vframe) delete me['burneff'];

        if(me.hp <= 0){
            me.die(me);
            return;
        }

        var d = dist(me, enemypts[me.dest_idx]);
        var eff_speed = smlt * me.speed;
        if('sloweff' in me){
            if(me.sloweff.timeout <= vframe){
                delete me['sloweff'];
            }else{
                eff_speed *= me.sloweff.coef;
            }
        }
        if(d <= eff_speed){
            me.x = enemypts[me.dest_idx].x
            me.y = enemypts[me.dest_idx].y;
            me.dest_idx++;
            if(me.dest_idx >= enemypts.length){
                me.finish(me);
                return
            }
        }else{
            var r = eff_speed / d;
            me.x += r * (enemypts[me.dest_idx].x - me.x);
            me.y += r * (enemypts[me.dest_idx].y - me.y);
        }
    };

    enemy.die = function(me){
        bads.splice(bads.indexOf(me), 1);
        money += me.gold;
    }

    enemy.finish = function(me){
        me.die(me);
        lives--;
    }

    return enemy;
}

function getNextWave(){
    var gold = wavenum;
    var maxhp = Math.floor(10 + 5*wavenum*wavenum + .6 * wavenum*wavenum*wavenum);
    var slime = make_enemy('slime', maxhp, .6, 20, 20, document.images.img_slime, gold);
    var wave = make_wave(slime, 20, 40);

    return wave;
}
