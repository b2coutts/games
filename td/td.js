// static config
var gw = 20;
var gh = 20;
var grid = 25;
var gamearea = {'x' : 0, 'y' : 0, 'w' : grid*gw, 'h' : grid*gh};

// projectiles within this distance will teleport to their target
var proj_grace_intercept = 20;

var towers, bads, buttons, cursor, curstate, frame, money, tooltip, lives,
    wavenum, curwave, projs, ent_lists, effects;
var vframe, last_vframe, smlt;
var gamespeed = 1;
var ffspeed = 3;

// research state
var era = 1;
var research_prog = {'sharp_rocks' : false,
                     'power_grid' : false,
                     'incendiary_ammo' : false,
                     'precise_firearms' : false};
var power_grid_graph = {};

var debug = false;

function init(){
    console.log('game initializing');

    towers = [];
    bads = [];
    buttons = [];
    projs = [];
    effects = [];
    cursor = {'x' : 0, 'y' : 0, 'w' : 1, 'h' : 1};
    curstate = {'type' : 'idle'};
    frame = 0;
    last_vframe = 0;
    vframe = 0;
    smlt = 1;

    tooltip = null;

    money = 20;
    lives = 40;
    era = 1;
    wavenum = 1;

    curwave = null;

    keyInit();
    enemy_init();
    genbuttons();

    ent_lists = [towers, projs, bads, buttons];
    console.log('done initializing');

    if(debug){
        money = 9999999999;
        era = 6;
        wavenum = 1000;
    }
}

window.onload=function(){
    canvas = document.getElementById('td');
    ctx = canvas.getContext('2d');
    init();
    main();
}

window.main = function(){
    //console.log('main loop ' + frame);
    window.requestAnimationFrame(main);

    last_perf_time = window.performance.now();

    evqueue.forEach(function(e){
        if(e.type == 'mousemove'){
            cursor.x = e.pageX - canvas.offsetLeft;
            cursor.y = e.pageY - canvas.offsetTop;
            for(var i = 0; i<buttons.length; i++){
                if(buttons[i].active & overlap(buttons[i], cursor)){
                    //console.log('overlapping with ' + buttons[i].type);
                    if('tooltip' in buttons[i]){
                        if(typeof(buttons[i].tooltip) === "function"){
                            var tt = buttons[i].tooltip(buttons[i]);
                            if(tt !== null) tooltip = tt;
                        }else{
                            tooltip = buttons[i].tooltip;
                        }
                        break;
                    }
                }
            }
            if(i === buttons.length) tooltip = null;
        }else if(e.type == 'keydown'){
            if(e.code == 'Escape'){
                curstate = {'type' : 'idle'};
            }
        }else if(e.type == 'click'){
            for(var i = 0; i<buttons.length; i++){
                if(buttons[i].active & overlap(buttons[i], cursor)){
                    console.log('pressing button ' + buttons[i].type);
                    var used = buttons[i].press(buttons[i]);
                    if(used) break;
                }
            }
            if(i === buttons.length){
                // TODO: maybe deselect something here
            }
        }
    });
    evqueue = [];
    perflog('afterqueue');

    if(curwave !== null) curwave.tick(curwave);
    power_grid_graph = make_power_grid();
    ent_lists.forEach(function(ents){
        ents.forEach(function(ent){ ent.tick(ent); });
    });

    draw();
    frame++;
    last_vframe = vframe;
    vframe += smlt;

    perflog('FULL FRAME');
    //console.log('---------');
}
