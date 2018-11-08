function handleMessage(event){
    var msg = JSON.parse(event.data);
    console.log('recd msg: ' + msg);
    if(msg.type ===  'start'){
        init();
    }else if(msg.type === 'garbage'){
        garbqueue.push(msg.len);
    }else if(msg.type === 'youwin'){
        gameover = true;
        alert('You win!');
    }else if(msg.type === 'alert'){
        alert(msg.body);
    }
}

function sendGarbage(len){
    var msg = {'type' : 'garbage',
               'len' : len};
    ws.send(JSON.stringify(msg));
}

function sendLoss(){
    var msg = {'type' : 'loss'};
    ws.send(JSON.stringify(msg));
}

function joinRoom(roomid){
    var msg = {'type' : 'joinroom',
               'roomid' : roomid};
    ws.send(JSON.stringify(msg));
}

function makeRoom(roomid){
    var msg = {'type' : 'makeroom',
               'roomid' : roomid};
    ws.send(JSON.stringify(msg));
}
