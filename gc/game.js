// static config parameters
var fps = 1;
var playervelo = 4;
var shotvelo = 8;
var sideshotxspeed = 3;
var playersize = 20;
var shoot_cd = 10; // number of frames between shots
var pwrup_chance = .3;
var pwrup_size = 20;
var text_duration = 60;

// TODO: can we get these from the element itself?
var swidth = 400;
var sheight = 600;

window.onload=function(){
    canvas = document.getElementById('gc');
    ctx = canvas.getContext('2d');
    keyInit(handleInput);
    main();
}

// game state
var frame = 0;
var score = 0;
var vx,vy;
var px = swidth/2;
var py = sheight/2;
var lastshot = -shoot_cd;
var shotradius = 2;
var sideshots = false;
var gameArea = {'x' : 0, 'y' : 0, 'w' : swidth, 'h' : sheight};
var maxHealth = 10;
var myhealth = maxHealth;
var gameover = false;

var goodprojs = [];
var baddies = [];
var pwrups = [];
var texts = [];

function handleInput(e){
    if(e.code === 'KeyZ'){
        baddies.push(randnoob(20));
    }else if(e.code === 'KeyX'){
        baddies.push(wave(10, 10, null));
    }
}

function addproj(lst, x, y, w, h, vx, vy, good){
    var proj = {'x' : x, 'y' : y, 'w' : w, 'h' : h, 'vx' : vx, 'vy' : vy,
                'col' : '#0000FF'};
    lst.push(proj);
}

function player(){
    return {'x' : px, 'y' : py, 'vx' : vx, 'vy' : vy, 'w' : playersize, 'h' : playersize};
}

function overlap(a, b){
    return a.x < b.x+b.w & b.x < a.x+a.w  &  a.y < b.y+b.h & b.y < a.y+a.h;
}

function inArea(ent){
    //return ent.x >= 0-ent.w & ent.x < swidth & ent.y >= 0-ent.h & ent.y < sheight;
    return overlap(ent, gameArea);
}

window.main = function(){
    if(gameover) return;
    window.requestAnimationFrame(main);
    curtime = window.performance.now();

    if(frame%100 === 50) baddies.push(randnoob(20));
    if(frame%300 === 200) baddies.push(wave(10, 10, null));

    if(isdown(SHOOT) & frame - lastshot >= shoot_cd){
        lastshot = frame;
        addproj(goodprojs, px + playersize/2 - shotradius, py, shotradius*2, 8, 0, -shotvelo, true);
        if(sideshots){
            addproj(goodprojs, px, py, shotradius*2, 8, -sideshotxspeed, -shotvelo, true);
            addproj(goodprojs, px + playersize, py, shotradius*2, 8, sideshotxspeed, -shotvelo, true);
        }
    }

    vx = vy = 0;
    if(isdown(LEFT)) vx -= playervelo;
    if(isdown(RIGHT)) vx += playervelo;
    if(isdown(UP)) vy -= playervelo;
    if(isdown(DOWN)) vy += playervelo;
    px = Math.max(0, Math.min(swidth-playersize, px+vx));
    py = Math.max(0, Math.min(sheight-playersize, py+vy));

    goodprojs.forEach(function(proj){
        proj.x += proj.vx;
        proj.y += proj.vy;
    });

    baddies.forEach(function(baddy){ baddy.tick(baddy); });

    baddies.forEach(function(baddy){
        goodprojs.forEach(function(proj){
            if(baddy.vuln & overlap(baddy, proj)){
                baddy.health -= 1;
                proj.x = swidth + 1000;
                if(baddy.health <= 0){
                    if('pwrup' in baddy & baddy.pwrup & Math.random()<pwrup_chance){
                        var type = all_pwrups[randint(all_pwrups.length)];
                        var pwrup = {'x' : baddy.x, 'y' : baddy.y, 'vx' : 0, 'vy' : 1,
                                     'w' : pwrup_size, 'h' : pwrup_size, 'type' : type};
                        pwrups.push(pwrup);
                    }
                    if('score' in baddy){
                        score += baddy.score;
                        texts.push({'msg' : baddy.score, 'x' : baddy.x, 'y' : baddy.y, 'frame' : frame});
                    }
                    baddy.x = swidth + 1000;
                }
            }
        });
        if(overlap(baddy, player())){
            myhealth--;
            baddy.x = swidth + 1000;
        }
    });

    pwrups.forEach(function(pwrup){
        pwrup.x += pwrup.vx;
        pwrup.y += pwrup.vy;
        if(overlap(pwrup, player())){
            texts.push({'msg' : pwrup.type.msg, 'x' : pwrup.x, 'y' : pwrup.y, 'frame' : frame});
            pwrup.type.effect();
            pwrup.x = swidth + 1000;
        }
    });

    goodprojs = goodprojs.filter(inArea);
    baddies = baddies.filter(inArea);
    pwrups = pwrups.filter(inArea);
    texts = texts.filter(t => frame <= t.frame + text_duration);

    if(myhealth <= 0){
        myhealth = 0;
        gameover = true;
    }

    draw();
    frame++;
}

function drawent(proj){
    ctx.fillStyle = "#FFFFFF";
    if("col" in proj) ctx.fillStyle = proj.col;
    ctx.fillRect(proj.x, proj.y, proj.w, proj.h);
}

function draw(){
    // backdrop
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, swidth, sheight);

    // player
    ctx.fillStyle = "#AAAAAA";
    ctx.fillRect(px, py, playersize, playersize);

    // good projectiles
    goodprojs.forEach(drawent);

    // baddies
    baddies.forEach(drawent);

    // pwrups
    pwrups.forEach(function(pwrup){ pwrup.type.draw(pwrup.x, pwrup.y); });

    // texts
    texts.forEach(function(text){
        ctx.font = "15px Courier New";
        ctx.fillStyle = "#999999";
        ctx.fillText(text.msg, text.x, text.y);
    });


    // health bar
    ctx.fillStyle = "#555555";
    ctx.fillRect(swidth, 0, 100, sheight);
    ctx.font = "20px Courier New";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("HEALTH", swidth+12, 30);
    ctx.fillStyle = "#000000";
    ctx.fillRect(swidth+27, 47, 46, 206);
    ctx.fillStyle = "#00FF00";
    lvl = 250 - 200 * myhealth / maxHealth
    ctx.fillRect(swidth+30, lvl, 40, 250 - lvl);

    // score
    ctx.font = "20px Courier New";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("SCORE", swidth+20, 330);
    scorestr = score + "";
    while(scorestr.length < 6) scorestr = "0" + scorestr;
    ctx.fillText(scorestr, swidth+14, 350);

    if(gameover){
        ctx.fillStyle = "#FF0000";
        ctx.font = "100px Courier New";
        ctx.fillText("GAME", 80, 220);
        ctx.fillText("OVER", 80, 320);
    }
}
