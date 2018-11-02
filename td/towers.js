var archer_bp;

var era_names = {'1' : 'Ancient',
                 '2' : 'Medieval',
                 '3' : 'Rennaissance',
                 '4' : 'Modern',
                 '5' : 'Future',
                 '6' : 'Dystopian'};

var era_costs = {'1' : 100,
                 '2' : 1000,
                 '3' : 10000,
                 '4' : 100000,
                 '5' : 1000000};

// make a basic tower structure, to have a specific tower built on top of it
function maketower(gx, gy, bp){
    var tower = Object.assign({}, bp);
    tower.gx = gx;
    tower.gy = gy;
    tower.x = gx*grid;
    tower.y = gy*grid;
    tower.kills = 0;
    tower.draw = function(me){
        if(me.img !== null) ctx.drawImage(me.img, me.x+1, me.y+1, grid-2, grid-2);
        if(me.level > 1){
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(me.x+1, me.y+1, 6, 6);
            ctx.fillRect(me.x+1, me.y+1, 6, 6);
            ctx.font = '9px Courier New';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(me.level, me.x, me.y+7);
        }
    }
    return tower;
}

function mkproj(src, w, h, img, speed, target, pierce, eff, heatseek){
    var sc = getcenter(src);
    var proj = {'x' : sc.x - w/2, 'y': sc.y - h/2, 'w' : w, 'h' : h, 'src' : src,
                'img' : img, 'speed' : src.projspeed, 'target' : target, 'pierce' : src.pierce,
                'heatseek' : heatseek};
    proj.already_hit = [];
    proj.tick = function(me){
        var tc = getcenter(me.target);
        var mc = getcenter(me);
        var d = dist(mc, tc);
        if(!me.heatseek){
            if(!('vx' in me)){
                var rat = smlt*speed / d;
                me.vx = rat*(tc.x - mc.x);
                me.vy = rat*(tc.y - mc.y);
            }
            me.x += me.vx;
            me.y += me.vy;
        }else{
            if(d < smlt*speed){
                me.x = tc.x - me.w/2;
                me.y = tc.y - me.h/2;
                me.heatseek = false;
            }else{
                var rat = smlt*speed / d;
                me.vx = rat*(tc.x - mc.x);
                me.vy = rat*(tc.y - mc.y);
                me.x += me.vx;
                me.y += me.vy;
            }
        }

        for(var i=0; i<bads.length; i++){
            if(overlap(bads[i], me) && me.pierce>0 && me.already_hit.indexOf(bads[i]) == -1){
                me.pierce--;
                me.already_hit.push(bads[i]);
                eff(me, bads[i]);
            }
        }

        // TODO: allowed exceeding the range by 1.3x; not sure if this is a good idea
        if(me.pierce <= 0 || dist(me, src) > 1.3*src.range || dist(me, tc) === 0){
            projs.splice(projs.indexOf(me), 1);
        }
    }

    proj.draw = function(me){
        ctx.save();
        var theta = Math.atan2(me.vy, me.vx) + me.src.projrot;
        var r = Math.sqrt((me.w*me.w + me.h*me.h)/4);
        ctx.translate(me.x + me.w/2, me.y + me.h/2);
        ctx.rotate(theta);
        ctx.translate(-me.w/2, -me.h/2);
        if(me.img !== null){
            ctx.drawImage(me.img, 0, 0, me.w, me.h);
        }else{
            ctx.fillStyle = '#404040';
            ctx.fillRect(0, 0, me.w, me.h);
        }
        ctx.restore();
    }

    return proj;
}

// a heuristic is a function that takes a particular enemy, and assigns it a
// score (lower is better). A score is an array of numbers, to be compared
// lexicographically.

// this simple heuristic targets the living enemy that has progressed the furthest
function heur_furthest_alive(me, enemy){
    return [enemy.hp>0 ? 1 : 0,
            -enemy.dest_idx,
            dist(getcenter(enemy), enemypts[enemy.dest_idx])];
}

// slinger heuristic: (1) find least-bleeding enemy, (2) find furthest enemy
function slinger_heuristic(me, enemy){
    var bleed_amt = 'bleedeff' in enemy ? enemy.bleedeff.rate : 0;
    var bleed_left = 'bleedeff' in enemy ? enemy.bleedeff.timeout - vframe : 0;
    return [bleed_amt, bleed_left].concat(heur_furthest_alive(me, enemy));
}

// archer heuristic: (1) find least-slowed enemy, (2) find furthest enemy
function archer_heuristic(me, enemy){
    var slow_amt = 'sloweff' in enemy ? -enemy.sloweff.coef : -1;
    return [slow_amt].concat(heur_furthest_alive(me, enemy));
}

// general procedure for acquiring a target to fire at
// requires fields: me.x, me.y, me.w, me.h, me.range
// returns null if no targets are in range
function acquireTarget(me, pos=getcenter(me)){
    var heur = ('heuristic' in me) ? me.heuristic : heur_furthest_alive;
    var best = null;
    var best_score = null;
    bads.forEach(function(bad){
        if(dist(getcenter(bad), pos) < me.range){
            var score = heur(me, bad);
            if(best_score === null || array_lt(score, best_score)){
                best_score = score;
                best = bad;
            }
        }
    });
    return best;
}

// general projectile-spawning tick function; must be attached to a tower with
// the fields: pierce, projspeed, range, heatseek, and shotcd
function projspawntick(me){
    if(curwave !== null && vframe - me.lastshot >= me.shotcd){
        function eff(proj, target){
            me.kills += target.dmg(target, proj.dmg);
            if('eff' in me) me.eff(me, target);
        }

        var target = acquireTarget(me);
        if(target !== null){
            var projw = 'projw' in me ? me.projw : 5;
            var projh = 'projh' in me ? me.projh : 5;
            var projimg = 'projimg' in me ? me.projimg : null;
            var proj = mkproj(me, projw, projh, projimg, me.projspeed, target, me.pierce, eff, me.heatseek);
            proj.dmg = me.dmg;
            me.lastshot = vframe;
            projs.push(proj);
        }
    }
}

// construct a dict, mapping mage tower indices to a suitable target to hop to.
// mage towers that cannot reach any enemies do not appear in this dict
// runs in O(n^2 log(n)), where n is the number of mage towers
function make_power_grid(){
    var mtowers = towers.filter(t => t.name === 'Mage');
    var nexthop = {};
    var seen = {};
    var tovisit = buckets.PriorityQueue(function(a,b){ a[0] > b[0]; });

    for(var i=0; i<towers.length; i++) towers[i].tmp_idx = i;

    mtowers.forEach(function(mage){
        var target = acquireTarget(mage);
        if(target !== null){
            tovisit.add([0, mage, target]);
            seen[mage] = true;
        }
    });

    while(!tovisit.isEmpty() && research_prog['power_grid']){
        var [d, mage, target] = tovisit.dequeue();
        nexthop[mage.tmp_idx] = target.name==='Mage' ? target.tmp_idx : target;
        seen[mage.tmp_idx] = true;
        mtowers.forEach(function(tower){
            if(!seen[tower.tmp_idx] && dist(getcenter(mage), getcenter(tower)) < tower.range){
                tovisit.add([d+1, tower, mage]);
            }
        });
    }
    
    return nexthop;
}

function magetick(me){
    if(curwave !== null && vframe - me.lastshot > me.shotcd){
        var path = [];
        var cur_idx = me.tmp_idx;
        var num_enemies = 0;
        while(cur_idx in power_grid_graph){
            path.push(getcenter(towers[cur_idx]));
            cur_idx = power_grid_graph[cur_idx];
        }
        if(path.length === 0) path.push(getcenter(me));
        while(path.length < me.jumps+1){
            var path_heuristic = function(me2, target){
                var tc = getcenter(target);
                return [path.some(p => p.x===tc.x && p.y===tc.y) ? 1 : 0]
                       .concat(heur_furthest_alive(me2, target));
            };
            me.heuristic = path_heuristic;
            var target = acquireTarget(me, path[path.length-1]);
            var tc = target===null ? null : getcenter(target);
            if(target === null || path.some(p => p.x===tc.x && p.y===tc.y)){
                break;
            }else{
                me.kills += target.dmg(target, me.dmg);
                path.push(tc);
                num_enemies++;
            }
        }

        for(var i=1; i<path.length; i++){
            path[i].x += randrange(-5,5);
            path[i].y += randrange(-5,5);
        }

        if(num_enemies > 0){
            var effect = {'type' : 'zap', 'timeout' : vframe+60, 'path' : path};
            effect.draw = function(me){
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.moveTo(path[0].x, path[0].y);
                for(var i=1; i<path.length; i++){
                    ctx.lineTo(path[i].x + 0,
                               path[i].y + 0);
                }
                ctx.stroke();
                ctx.restore();
                if(vframe > me.timeout) effects.splice(effects.indexOf(me), 1);
            }
            effects.push(effect);
            me.lastshot = vframe;
        }
    }
}

function msheur(me, target){
    return [-target.hp].concat(heur_furthest_alive(me, target));
}

function mstick(me){
    var swapped = true;
    var target = acquireTarget(me);
    if(me.lastswap + me.swap_cd >= vframe && me.last_target !== null && me.last_target.hp>0){
        target = me.last_target
        swapped = false;
    }
    if(target !== null){
        var dmg_amt = target.hp * (vframe - last_vframe) * me.decay_rate;
        me.kills += target.dmg(target, dmg_amt);
        if(swapped) me.lastswap = vframe;
        me.last_target = target;

        var effect = {'type' : 'rad', 'timeout' : vframe+1,
                      'start' : getcenter(me), 'end' : getcenter(target)};
        effect.draw = function(me){
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.moveTo(me.start.x, me.start.y);
            ctx.lineTo(me.end.x, me.end.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = '#33EE33';
            ctx.lineWidth = 3;
            ctx.moveTo(me.start.x, me.start.y);
            ctx.lineTo(me.end.x, me.end.y);
            ctx.stroke();
            ctx.restore();
            effects.splice(effects.indexOf(me), 1);
        }
        effects.push(effect);
    }
}

function lctick(me){
    if(curwave !== null && vframe - me.lastshot >= me.shotcd){
        var inrange = bads.filter(bad => dist(getcenter(bad), getcenter(me)) < me.range);
        var [theta, hit_targets] = bestshot(me, inrange);
        if(hit_targets.length > 0){
            for(var i=0; i<hit_targets.length; i++){
                me.kills += hit_targets[i].dmg(hit_targets[i], me.dmg);
            }
            
            var disp = {'x' : Math.cos(theta)*me.range, 'y' : Math.sin(theta)*me.range};
            var effect = {'type' : 'lc_laser', 'timeout' : vframe+15, 'start_vf' : vframe,
                          'start' : getcenter(me), 'end' : vadd(getcenter(me), disp)};
            effect.draw = function(me){
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = '#C04040';
                ctx.lineWidth=Math.min(5, Math.floor(15 * (vframe-me.start_vf) / (me.timeout-me.start_vf)));
                ctx.moveTo(me.start.x, me.start.y);
                ctx.lineTo(me.end.x, me.end.y);
                ctx.stroke();
                ctx.restore();

                if(me.timeout < vframe) effects.splice(effects.indexOf(me), 1);
            }
            effects.push(effect);
            me.lastshot = vframe;
        }
    }
}

function markettick(me){
    if(me.lastpayoutwave === null) me.lastpayoutwave = wavenum;
    if(me.lastpayoutwave !== wavenum){
        money += me.income;
        me.lastpayoutwave = wavenum;
    }
}

// a standard slow effect; must be applied to a tower with slow_coef and slow_dur fields
function sloweff(me, target){
    if(!('sloweff' in target) || (target.sloweff.coef <= me.slow_coef)){
        target.sloweff = {'coef' : me.slow_coef, 'timeout' : vframe + me.slow_dur};
    }
}

function bleedeff(me, target){
    var bleed_dur = 60*5; // 5 seconds
    var bleed_rate = me.dmg / bleed_dur; // a rate of bleeding per vframe
    if(research_prog['sharp_rocks'] &
       (!('bleedeff' in target) || (target.bleedeff.rate <= bleed_rate))){
        target.bleedeff = {'rate' : bleed_rate,
                           'lastbleed' : vframe,
                           'timeout' : vframe + bleed_dur};
    }
}

function splasheff(me, target){
    var mecenter = getcenter(target);
    bads.forEach(function(bad){
        if(dist(getcenter(bad), mecenter) <= me.splash_radius){
            console.log(me.splash_dmg)
            me.kills += bad.dmg(bad, me.splash_dmg);
        }
    });

    var effect = {'type' : 'cannon_expl',
                  'timeout' : vframe+20,
                  'start' : vframe, 
                  'x' : mecenter.x,
                  'y' : mecenter.y,
                  'radius' : me.splash_radius};
    effect.draw = function(me){
        ctx.save();
        ctx.beginPath();
        var theta = 0; // TODO: should prolly calculate this in case it's near the right
        var durpct = (vframe-me.start) / (me.timeout-me.start);
        var radius = durpct<.5 ? durpct*me.radius*2 : me.radius;
        ctx.fillStyle = '#DD0000';
        ctx.globalAlpha = .5;
        ctx.arc(me.x, me.y, radius, theta, 2*Math.PI-theta, false);
        ctx.fill();
        ctx.restore();
        if(vframe > me.timeout) effects.splice(effects.indexOf(me), 1);
    };
    effects.push(effect);
}

function execute_eff(me, target){
    if(research_prog['precise_firearms']){
        var health_pct = target.hp / target.maxhp;
        var bonusdmg = (1-health_pct) * 1.5 * me.dmg;
        var init_hp = target.hp;
        me.kills += target.dmg(target, bonusdmg);
    }
}

function burneff(me, target){
    if(research_prog['3db']){
        var burn_dur = 2*60; // two seconds
        var burn_mult = 1.5;
        target.burneff = {'timeout' : vframe + burn_dur,
                          'mult' : burn_mult};
    }
}

slinger_bp =
    {'name' : 'Slinger',
     'tick' : projspawntick, 
     'img' : document.images.img_slinger,
     'era' : 1,
     'level' : 1,
     'cost' : 10,
     'dmg' : 15,
     'range' : 60,
     'shotcd' : 40,
     'lastshot' : 0,
     'pierce' : 1,
     'projspeed' : 5,
     'projw' : 20,
     'projh' : 20,
     'projrot' : -3*Math.PI/4,
     'projimg' : document.images.img_sharp_rocks,
     'heatseek' : true,
     'heuristic' : slinger_heuristic,
     'eff' : bleedeff,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd'],
     'desc' : "Close range single-target damage",
     'upgrades' : {1 : {'dmg' : 15, 'range' : 10, 'shotcd' : -10, 'cost' : 10},
                   2 : {'dmg' : 30, 'range' : 10, 'shotcd' : -5, 'cost' : 30},
                   3 : {'dmg' : 30, 'range' : 10, 'shotcd' : -5, 'cost' : 100}},
     'builder_type' : 'make_slinger'};

spearman_bp =
    {'name' : 'Spearman',
     'tick' : projspawntick, 
     'img' : document.images.img_spearman,
     'era' : 1,
     'level' : 1,
     'cost' : 15,
     'dmg' : 10,
     'range' : 80,
     'shotcd' : 60,
     'lastshot' : 0,
     'pierce' : 3,
     'projspeed' : 3,
     'projw' : 20,
     'projh' : 20,
     'projimg' : document.images.img_spearman,
     'projrot' : Math.PI/4,
     'heatseek' : false,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd', 'pierce'],
     'desc' : "Throws spears that pierce through multiple enemies",
     'upgrades' : {1 : {'dmg' : 10, 'range' : 20, 'pierce' : 1, 'cost' : 15},
                   2 : {'dmg' : 25, 'range' : 20, 'pierce' : 1, 'cost' : 45},
                   3 : {'dmg' : 70, 'range' : 30, 'pierce' : 2, 'cost' : 150}},
     'builder_type' : 'make_spearman'};

archer_bp =
    {'name' : 'Archer',
     'tick' : projspawntick, 
     'img' : document.images.img_archer,
     'era' : 2,
     'level' : 1,
     'cost' : 50,
     'dmg' : 30,
     'range' : 150,
     'shotcd' : 60,
     'lastshot' : 0,
     'pierce' : 1,
     'projspeed' : 10,
     'projimg' : document.images.img_arrow,
     'projrot' : Math.PI/4,
     'projw' : 10,
     'projh' : 10,
     'heatseek' : true,
     'heuristic' : archer_heuristic,
     'slow_coef' : .8,
     'slow_dur' : 180,
     'eff' : sloweff,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd', 'slow_coef', 'slow_dur'],
     'desc' : "Long-range single-target damage and slow",
     'upgrades' : {1 : {'dmg' : 20, 'shotcd' : -15, 'slow_coef' : -.1, 'slow_dur' : 20, 'cost' : 50},
                   2 : {'dmg' : 30, 'shotcd' : -15, 'slow_coef' : -.1, 'slow_dur' : 20, 'cost' : 150},
                   3 : {'dmg' : 50, 'shotcd' : -15, 'slow_coef' : -.1, 'slow_dur' : 20, 'cost' : 500}},
     'builder_type' : 'make_archer'};


mage_bp =
    {'name' : 'Mage',
     'tick' : magetick, 
     'img' : document.images.img_mage,
     'era' : 2,
     'level' : 1,
     'cost' : 100,
     'dmg' : 100,
     'range' : 60,
     'shotcd' : 120,
     'lastshot' : 0,
     'jumps' : 3,
     'grid_paths' : {},
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd', 'jumps'],
     'desc' : "Multi-target lightning damage",
     'upgrades' : {1 : {'dmg' : 100, 'range' : 15, 'jumps' : 1, 'shotcd' : 0, 'cost' : 100},
                   2 : {'dmg' : 200, 'range' : 15, 'jumps' : 1, 'shotcd' : 0, 'cost' : 300},
                   3 : {'dmg' : 600, 'range' : 15, 'jumps' : 2, 'shotcd' : 0, 'cost' : 1000}},
     'builder_type' : 'make_mage'};

market_bp =
    {'name' : 'Market',
     'tick' : markettick, 
     'img' : document.images.img_market,
     'era' : 2,
     'level' : 1,
     'cost' : 500,
     'income' : 50,
     'dmg' : 0,
     'range' : 0,
     'shotcd' : Infinity,
     'last_payout_wave' : null,
     'tooltip_stats' : ['cost', 'income'],
     'desc' : "Generates gold per turn",
     'upgrades' : {1 : {'income' : 100, 'cost' : 900},
                   2 : {'income' : 350, 'cost' : 2500},
                   3 : {'income' : 1000, 'cost' : 7000}},
     'builder_type' : 'make_market'};

musketeer_bp =
    {'name' : 'Musketeer',
     'tick' : projspawntick,
     'img' : document.images.img_musketeer,
     'era' : 3,
     'level' : 1,
     'cost' : 400,
     'dmg' : 500,
     'range' : 200,
     'shotcd' : 80,
     'lastshot' : 0,
     'pierce' : 1,
     'projspeed' : 15,
     'heatseek' : true,
     'eff' : execute_eff,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd'],
     'desc' : "Long-range single-target damage",
     'upgrades' : {1 : {'dmg' : 500, 'shotcd' : -20, 'range' : 25, 'cost' : 400},
                   2 : {'dmg' : 1000, 'shotcd' : -15, 'range' : 25, 'cost' : 1000},
                   3 : {'dmg' : 2000, 'shotcd' : -10, 'range' : 25, 'cost' : 2000}},
     'builder_type' : 'make_musketeer'};

cannon_bp =
    {'name' : 'Cannon',
     'tick' : projspawntick,
     'img' : document.images.img_cannon,
     'era' : 3,
     'level' : 1,
     'cost' : 800,
     'dmg' : 500,
     'range' : 200,
     'shotcd' : 80,
     'lastshot' : 0,
     'pierce' : 1,
     'projspeed' : 5,
     'projimg' : document.images.img_cannonball,
     'projw' : 15,
     'projh' : 15,
     'heatseek' : true,
     'splash_dmg' : 500,
     'splash_radius' : 25,
     'eff' : splasheff,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd', 'splash_dmg', 'splash_radius'],
     'desc' : "Long-range splash damage",
     'upgrades' : {1 : {'dmg' : 500, 'splash_dmg' : 500, 'splash_radius' : 10, 'cost' : 800},
                   2 : {'dmg' : 1500, 'splash_dmg' : 1500, 'splash_radius' : 10, 'cost' : 2500},
                   3 : {'dmg' : 4500, 'splash_dmg' : 4500, 'splash_radius' : 10, 'cost' : 7500}},
     'builder_type' : 'make_cannon'};

flamethrower_bp =
    {'name' : 'Flamethrower',
     'tick' : projspawntick,
     'img' : document.images.img_flamethrower,
     'era' : 4,
     'level' : 1,
     'cost' : 2000,
     'dmg' : 500,
     'range' : 50,
     'shotcd' : 10,
     'lastshot' : 0,
     'pierce' : 1000,
     'projspeed' : .8,
     'projw' : 20,
     'projh' : 20,
     'projimg' : document.images.img_third_degree_burns,
     'projrot' : Math.PI/2,
     'heatseek' : false,
     'eff' : burneff,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd'],
     'desc' : "Close range area damage",
     'upgrades' : {1 : {'dmg' : 500, 'shotcd' : -1, 'range' : 5, 'cost' : 2500},
                   2 : {'dmg' : 1200, 'shotcd' : -1, 'range' : 5, 'cost' : 7000},
                   3 : {'dmg' : 2500, 'shotcd' : -1, 'range' : 10, 'cost' : 14000}},
     'builder_type' : 'make_flamethrower'};

laser_cannon_bp =
    {'name' : 'Laser Cannon',
     'tick' : lctick,
     'img' : document.images.img_laser_cannon,
     'era' : 5,
     'level' : 1,
     'cost' : 50000,
     'dmg' : 50000,
     'range' : 300,
     'lastshot' : 0,
     'shotcd' : 60,
     'tooltip_stats' : ['cost', 'dmg', 'range', 'shotcd'],
     'desc' : "Powerful long-range beam.",
     'upgrades' : {1 : {'dmg' : 50000, 'shotcd' : -10, 'range' : 50, 'cost' : 50000},
                   2 : {'dmg' : 100000, 'shotcd' : -10, 'range' : 50, 'cost' : 150000},
                   3 : {'dmg' : 200000, 'shotcd' : -10, 'range' : 100, 'cost' : 500000}},
     'builder_type' : 'make_laser_cannon'};

dr_evildoom_bp =
    {'name' : 'Dr. Evildoom',
     'tick' : mstick,
     'heuristic' : msheur,
     'img' : document.images.img_mad_scientist,
     'era' : 6,
     'level' : 1,
     'cost' : 500000,
     'dmg' : 0,
     // decay_rate units are health ratio per vframe; e.g. 1/6000 represents 1% per second at 60vfps
     'decay_rate' : 5/6000,
     // minimum cooldown for swapping targets; mostly there to stop it from looking dumb
     'swap_cd' : 60,
     'lastswap' : 0,
     'last_target' : null,
     'range' : 75,
     'tooltip_stats' : ['cost', 'decay_rate', 'range'],
     'desc' : "Deals dmg based on % of current enemy health. Limit 1.",
     'upgrades' : {1 : {'decay_rate' : 5/6000, 'range' : 25, 'cost' : 500000},
                   2 : {'decay_rate' : 15/6000, 'range' : 25, 'cost' : 1500000},
                   3 : {'decay_rate' : 25/6000, 'range' : 25, 'cost' : 3000000}},
     'builder_type' : 'make_dr_evildoom'};
