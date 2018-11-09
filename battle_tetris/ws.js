function handleMessage(event){
    console.log('recd msg: ' + event.data);
    var msg = JSON.parse(event.data);
    if(msg.type === 'init'){
        getRooms();
        setInterval(getRooms, 1000);
        setInterval(sendState, 1000);
    }else if(msg.type ===  'start'){
        init();
    }else if(msg.type === 'garbage'){
        garbqueue.push(msg.len);
    }else if(msg.type === 'youwin'){
        gameover = true;
        alert('You win!');
    }else if(msg.type === 'alert'){
        alert(msg.body);
    }else if(msg.type === 'rmlist'){
        oldrmlist = rmlist;
        rmlist = msg['rmlist'];
        myroom = 'yourroom' in msg ? msg['yourroom'] : null;
        if(JSON.stringify(oldrmlist) !== JSON.stringify(rmlist)) updateRmlist();
    }else if(msg.type === 'dc'){
        gameover = true;
        alert('Your opponent has disconnected');
    }else if(msg.type === 'state'){
        egcolors = msg.gcolors;
        enrcolors = msg.nrcolors;
        eoffset = msg.offset;
    }else{
        alert('ERROR: unrecognized message type: ' + msg.type);
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

function leaveRoom(){
    var msg = {'type' : 'leaveroom'};
    ws.send(JSON.stringify(msg));
}

function getRooms(){
    var msg = {'type' : 'getrooms'};
    ws.send(JSON.stringify(msg));
}

function cellToColor(cell){
    if(cell === null) return '#000000';
    return cell.col;
}

function sendState(){
    if(gameover) return;

    var gcolors = grid.slice(0, nrows).map(r => r.map(cellToColor));
    var nrcolors = nextrow.map(cellToColor);

    var msg = {'type' : 'state',
               'gcolors' : gcolors,
               'nrcolors' : nrcolors,
               'offset' : offset};

    ws.send(JSON.stringify(msg));
}
