all_pwrups = [{'msg' : 'Health +', 'effect' : hpfcn, 'draw' : hpdraw},
              {'msg' : 'Wider shots', 'effect' : widefcn, 'draw' : widedraw},
              {'msg' : 'Speed +', 'effect' : movefcn, 'draw' : movedraw},
              {'msg' : 'Fire rate +', 'effect' : bpsfcn, 'draw' : bpsdraw},
              {'msg' : 'Side shots', 'effect' : sidefcn, 'draw' : sidedraw}]

function hpfcn(){
    var amt = Math.floor(maxHealth * .3);
    myhealth = Math.min(maxHealth, myhealth + amt);
}

function hpdraw(x, y){
    var a = pwrup_size/3;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, pwrup_size, pwrup_size);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(x+a, y, a, pwrup_size);
    ctx.fillRect(x, y+a, pwrup_size, a);
}

function widefcn(){
    shotradius += 2;
}

function widedraw(x, y){
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, pwrup_size, pwrup_size)
    ctx.fillStyle = "#0000FF";
    ctx.beginPath();
    ctx.arc(x+pwrup_size/2, y+pwrup_size/2, pwrup_size/3, 0, 2*Math.PI, false);
    ctx.fill()
}

function movefcn(){
    playervelo++;
}

function movedraw(x,y){
    var h = pwrup_size/2;
    var ps = pwrup_size;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, pwrup_size, pwrup_size);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+h, y+h);
    ctx.lineTo(x, y+ps);
    ctx.moveTo(x+h, y);
    ctx.lineTo(x+ps, y+h);
    ctx.lineTo(x+h, y+ps);
    ctx.stroke();
}

function bpsfcn(){
    if(shoot_cd >= 3) shoot_cd--;
}

function bpsdraw(x,y){
    var h = pwrup_size/2;
    var ps = pwrup_size;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, pwrup_size, pwrup_size);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0000FF";
    ctx.beginPath();
    ctx.moveTo(x,y+ps);
    ctx.lineTo(x+h, y+h);
    ctx.lineTo(x+ps, y+ps);
    ctx.moveTo(x, y+h);
    ctx.lineTo(x+h, y);
    ctx.lineTo(x+ps, y+h);
    ctx.stroke();
}

function sidefcn(){
    sideshots = true;
}

function sidedraw(x,y){
    var h = pwrup_size/2;
    var ps = pwrup_size;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, pwrup_size, pwrup_size);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0000FF";
    ctx.beginPath();
    ctx.moveTo(x,y+h);
    ctx.lineTo(x+h, y+ps);
    ctx.lineTo(x+h, y);
    ctx.moveTo(x+h, y+ps);
    ctx.lineTo(x+ps, y+h);
    ctx.stroke();
}
