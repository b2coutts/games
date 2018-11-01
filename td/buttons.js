// make a simple NOOP button
function makebutton(bx, by, bw, bh, img, type){
    var button = {'x' : bx, 'y' : by, 'w' : bw, 'h' : bh, 'img' : img,
                  'type' : type, 'press' : function(me){}};
    button.draw = function(me){
        if(me.img !== null & me.active){
            ctx.drawImage(me.img, me.x, me.y, me.w, me.h);
        }
    }
    button.tick = function(me){};
    button.active = true;
    return button;
}

// create a towermaker button
function towermaker(bx, by, bw, bh, bp){
    var tmbutton = makebutton(bx, by, bw, bh, bp.img, bp.builder_type);
    tmbutton.bp = bp;
    function placefcn(gx,gy){
        if(bp.cost <= money & towers.every(t => t.gx !== gx || t.gy !== gy)){
            if(bp.name === 'Dr. Evildoom' && towers.some(t => t.name === 'Dr. Evildoom')) return;
            money -= bp.cost;
            var tower = maketower(gx, gy, bp);
            tower.w = grid;
            tower.h = grid;

            // create upgrade and sell buttons for this tower

            // dimensions and locations for upgrade and sell buttons
            var ux = grid*gw;
            var upw = 75, uph = 50;
            var upx = ux+300-upw-2, upy = 260;
            var slx = upx, sly = upy+uph;

            var upgbutton = makebutton(upx, upy, upw, uph, document.images.img_upgrade, 'upgrade');
            upgbutton.tower = tower;
            upgbutton.press = function(me){
                var lvl = me.tower.level
                if(lvl in me.tower.upgrades & me.tower.upgrades[lvl].cost <= money){
                    money -= me.tower.upgrades[lvl].cost;
                    Object.keys(me.tower.upgrades[lvl]).forEach(function(f){
                        me.tower[f] += me.tower.upgrades[lvl][f];
                    });
                    me.tower.level++;
                }
            }
            upgbutton.tick = function(me){
                me.active = curstate.type === 'select_tower' &
                            curstate.tower === me.tower &
                            me.tower.level in me.tower.upgrades;
            }
            upgbutton.tooltip = function(me){
                if(me.tower.level in me.tower.upgrades){
                    var up = me.tower.upgrades[me.tower.level];
                    var tt = ['Cost: ' + up.cost, ''];
                    me.tower.tooltip_stats.forEach(function(stat){
                        if(stat !== 'cost' && stat !== 'kills'){
                            var val = me.tower[stat];
                            var newval = stat in up ? val + up[stat] : val;
                            var row = null;
                            if(stat === 'shotcd'){
                                stat = 'shots/sec';
                                val = spd(val);
                                newval = spd(newval);
                            }else if(stat === 'decay_rate'){
                                val = fmtf(val*6000) + '%/sec';
                                newval = fmtf(newval*6000) + '%/sec';
                                row = stat + ': ' + val + ' -> ' + newval;
                            }
                            if(row === null) row = stat + ': ' + fmtf(val) + ' -> ' + fmtf(newval);
                            tt.push(row);
                        }
                    });
                    return tt;
                }
                return null;
            }

            var sellbutton = makebutton(slx, sly, upw, uph, document.images.img_sell, 'upgrade');
            sellbutton.tower = tower;

            tower.upgrade_button = upgbutton;
            sellbutton.press = function(me){
                money += Math.floor(me.tower.cost / 2);
                towers.splice(towers.indexOf(me.tower), 1);
                curstate = {'type' : 'idle'};
            }
            sellbutton.tick = function(me){
                me.active = curstate.type === 'select_tower' & curstate.tower === me.tower;
            }
            sellbutton.tooltip = function(me){
                return ['Sells for: ' + Math.floor(me.tower.cost/2)];
            }

            buttons.push(upgbutton);
            buttons.push(sellbutton);
            towers.push(tower);

            curstate = {'type' : 'select_tower', 'tower' : tower};
        }
    }

    // TODO: are there some curstates that shouldn't be interrupted by this?
    tmbutton.press = function(me){
        if(me.bp.era <= era){
            curstate = {'type' : 'place_tower',
                        'info' : 'Placing ' + bp.type + '...',
                        'bp' : bp,
                        'place' : placefcn};
        }
        return true;
    }

    tmbutton.draw = function(me){
        if(me.img !== null & me.active){
            drawButton(me.x, me.y, me.w, me.h, me.img, me.bp.era <= era);
        }
    }

    tmbutton.tooltip = function(me){
        tt = [me.bp.name + ' [' + era_names[me.bp.era] + ']',
              me.bp.desc,
              ''];
        me.bp.tooltip_stats.forEach(function(stat){
            if(stat !== 'kills'){
                var row = stat + ': ' + me.bp[stat];
                if(stat === 'shotcd'){
                    row = 'shots/sec: ' + spd(me.bp[stat]);
                }else if(stat === 'decay_rate'){
                    row = 'decay_rate: ' + fmtf(me.bp[stat]*6000) + '%/sec';
                }
                tt.push(row);
            }
        });
        return tt;
    }

    return tmbutton;
}

// make a research button
function researchmaker(x, y, w, h, req_era, research, cost, img, tooltip){
    var button = makebutton(x, y, w, h, img, 'research_' + research);
    button.press = function(me){
        if(money >= cost && !research_prog[research] && era >= req_era){
            money -= cost;
            research_prog[research] = true;
        }
    }
    button.tooltip = function(me){
        var usable = !research_prog[research] && era>=req_era;
        if(research_prog[research]) tooltip[1] = 'Researched.';
        return tooltip;
    }
    button.draw = function(me){
        var usable = !research_prog[research] && era>=req_era;
        drawButton(me.x, me.y, me.w, me.h, me.img, usable);
    }
    return button;
}

// make a game area button
function gameareamaker(gx, gy){
    var button = makebutton(grid*gx, grid*gy, grid, grid, null, 'area');
    button.gx = gx;
    button.gy = gy;
    button.press = function(me){
        if(curstate.type === 'place_tower'){
            curstate.place(me.gx, me.gy);
        }else if(['idle', 'select_tower'].indexOf(curstate.type) > -1){
            for(var i=0; i<towers.length; i++){
                if(towers[i].gx == me.gx & towers[i].gy == me.gy){
                    curstate = {'type' : 'select_tower', 'tower' : towers[i]};
                    break;
                }
            }
            if(i === towers.length) curstate = {'type' : 'idle'};
        }else{
            return false;
        }
        return true;
    }
    return button;
}

function genbuttons(){
    var x0 = grid*gw;


    var bps = [slinger_bp, spearman_bp,
               archer_bp, mage_bp, market_bp,
               musketeer_bp, cannon_bp,
               flamethrower_bp,
               laser_cannon_bp,
               dr_evildoom_bp];
    var bp_idx = 0;
    [45, 100, 200].forEach(function(y){
        for(var x=0; x<5; x++){
            if(bp_idx < bps.length){
                var bp = bps[bp_idx];
                bp_idx++;
                buttons.push(towermaker(x0+14 + 57*x, y, 40, 40, bp));
            }
        }
    });

    // TODO: maybe I should put this upgrade stuff into its own file
    var adv_era = makebutton(x0+14, 200, 40, 40, document.images.img_science);
    adv_era.press = function(me){
        if(era in era_costs && era_costs[era] <= money){
            money -= era_costs[era];
            era++;
        }
    }
    adv_era.tooltip = function(me){
        if(era+1 in era_names){
            return ['Advance to ' + era_names[era+1] + ' era.',
                    '',
                    'Cost: ' + era_costs[era]];
        }else{
            return null;
        }
    }
    adv_era.draw = function(me){
        drawButton(me.x, me.y, me.w, me.h, me.img, era+1 in era_names);
    }

    var sr_cost = 50;
    var research_sr = researchmaker(x0+71, 200, 40, 40, 1, 'sharp_rocks',
                                    sr_cost, document.images.img_sharp_rocks,
                                    ['Sharp Rocks [Ancient]',
                                     'Cost: ' + sr_cost, '',
                                     'Your slingers learn to sharpen their',
                                     'rocks, granting them +100% bleed damage',
                                     'dealt over 5 seconds (non-stacking).']);
    var pg_cost = 500;
    var research_pg = researchmaker(x0+128, 200, 40, 40, 2, 'power_grid',
                                    pg_cost, document.images.img_power_grid,
                                    ['Power Grid [Medieval]',
                                     'Cost: ' + pg_cost, '',
                                     'Your mages learn to connect their powers,',
                                     'allowing their bolts to jump between each',
                                     'other to reach enemy units.']);
    var pf_cost = 5000;
    var research_pf = researchmaker(x0+185, 200, 40, 40, 3, 'precise_firearms',
                                    pf_cost, document.images.img_precise_firearms,
                                    ['Precise Firearms [Rennaissance]',
                                     'Cost: ' + pf_cost, '',
                                     'Your muskets become more precise, allowing',
                                     'musketmen to aim for weak points in the',
                                     'armor of wounded enemies (up to +250%',
                                     'damage to low-health enemies).']);
    var db_cost = 50000;
    var research_db = researchmaker(x0+242, 200, 40, 40, 4, '3db',
                                    db_cost, document.images.img_third_degree_burns,
                                    ['3rd Degree Burns [Modern]',
                                     'Cost: ' + db_cost, '',
                                     'Your flamethrowers burn hotter, applying',
                                     '3rd degree burns to enemies, causing them',
                                     'to take 50% more damage from all sources.']);

    buttons = buttons.concat([adv_era, research_sr, research_pg, research_pf, research_db]);

    for(var gx=0; gx<gw; gx++){
        for(var gy=0; gy<gh; gy++){
            if(!([gx,gy] in pathspots)) buttons.push(gameareamaker(gx, gy));
        }
    }

    var wavespawner = makebutton(grid*gw+202, 402, 96, 96, document.images.img_spawn, 'spawn_wave');
    wavespawner.tick = function(me){ me.active = curwave === null; };
    wavespawner.press = function(me){
        if(curwave === null) curwave = getNextWave();
    };
    wavespawner.tooltip = function(me){
        var wave = getNextWave();
        var desc = wave.amt + ' ' + wave.enemy.name + 's (' + wave.enemy.maxhp + ' hp)';
        return ['Wave ' + wavenum, '', desc];
    };

    var turbo = makebutton(grid*gw+202, 402, 96, 96, null, 'fast');
    turbo.tick = function(me){
        me.active = curwave !== null;
        if(!me.active) smlt=gamespeed;
        me.img = smlt===gamespeed ? document.images.img_fast : document.images.img_faston;
        me.tooltip = smlt===gamespeed ? ['Turn on fast-forward'] : ['Turn off fast-forward'];
    };
    turbo.press = function(me){
        if(curwave !== null){
            if(smlt===1){
                smlt = ffspeed;
            }else{
                smlt = gamespeed;
            }
        }
    };

    buttons.push(wavespawner);
    buttons.push(turbo);
}
