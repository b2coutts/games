// determine whether two entities are overlapping
function overlap(a, b){
    return a.x < b.x+b.w & b.x < a.x+a.w  &  a.y < b.y+b.h & b.y < a.y+a.h;
}

var last_perf_time;
var use_perflog = false;

function perflog(label){
    if(!use_perflog) return;
    var t = window.performance.now();
    console.log('Label ' + label + ': ' + (t-last_perf_time) + 'ms');
    last_perf_time = t;
}

// convert shotcd to speed
function spd(shotcd){
    return 60/shotcd;
}

function pad(str, len, chr = ' '){
    if(str.length >= len) return str;
    return str + ' '.repeat(len - str.length);
}

function dist(a, b){
    return Math.sqrt( (a.x-b.x)*(a.x-b.x)  +  (a.y-b.y)*(a.y-b.y) );
}

function getcenter(a){
    return {'x' : a.x + a.w/2, 'y' : a.y + a.h/2};
}

function vadd(u, v){
    return {'x' : u.x+v.x, 'y' : u.y+v.y};
}

function randrange(lo, hi){
    return (hi-lo) * Math.random() + lo;
}

// compare two arrays lexicographically; return true if a < b
function array_lt(a,b){
    for(var i = 0; i < Math.min(a.length, b.length); i++){
        if(a[i] < b[i]) return true;
        if(a[i] > b[i]) return false;
    }
    return a.length < b.length;
}

// used for logging
function goodlog(x, msg=null){
    if(msg !== null) console.log(msg);
    console.log(JSON.stringify(x));
}

// display a float to a number of decimal points
function fmtf(x, pts = 2){
    var s = x.toString();
    var dotposn = null;
    for(var i = 0; i<s.length; i++){
        if(s[i] === '.') dotposn = i;
    }
    if(dotposn === null || dotposn >= s.length - pts - 1) return s;
    return x.toFixed(pts);
}

// atan2 with range [0,2pi) instead of [-pi,pi)
function myatan2(y, x){
    var theta = Math.atan2(y, x);
    return theta<0 ? theta+Math.PI*2 : theta;
}

// determines the interval of angles for which a laser starting at start with
// width lw can hit the given target. By convention, the interval [a,b]
// returned satisfies 0 <= a < 2pi and a <= b < 4pi.
function hitrange(start, target){
    var corners = [{'x' : target.x, 'y' : target.y},
                   {'x' : target.x+target.w, 'y' : target.y},
                   {'x' : target.x, 'y' : target.y+target.h},
                   {'x' : target.x+target.w, 'y' : target.y+target.h}];
    var angles = corners.map(p => myatan2(p.y-start.y, p.x-start.x));
    var min = Math.min(...angles);
    var max = Math.max(...angles);
    if(Math.max(...angles) - Math.min(...angles) > Math.PI)
        angles = angles.map(a => a<Math.PI ? a+Math.PI*2 : a);
    return [Math.min(...angles) , Math.max(...angles)];
}

// determines the best angle to shoot at to hit the max number of targets
// also returns a list of the hit targets
function bestshot(start, targets){
    var ivls = targets.map(target => hitrange(start, target).concat([target]));
    var endpts = [];
    for(var i=0; i<ivls.length; i++){
        endpts.push([ivls[i][0], 1, ivls[i][2]]);
        endpts.push([ivls[i][1], -1, ivls[i][2]]);
    }
    endpts.sort((x,y) => x[0] - y[0]);

    var cur_targets = [];
    var best_ct = [];
    var besttheta = 0;
    for(var i=0; i<endpts.length; i++){
        endpt = endpts[i];
        if(endpt[1] === 1){
            cur_targets.push(endpt[2]);
        }else{
            cur_targets.splice(cur_targets.indexOf(endpt[2]), 1);
        }
        if(cur_targets.length > best_ct.length){
            best_ct = cur_targets.slice(0);
            besttheta = endpt[0];
        }
    }

    return [besttheta, best_ct];
}
