#!/usr/bin/env python

import asyncio
import websockets
import json

rooms = {}

def mkalert(msg):
    return {'type' : 'alert', 'body' : msg}

async def gameserver(websocket, path):
    roomid = None

    async def send(msg, ws=websocket):
        print('sending %s' % json.dumps(msg))
        await ws.send(json.dumps(msg))
    
    def get_opponent():
        if roomid in rooms:
            for ws in rooms[roomid]:
                if ws != websocket:
                    return ws
        return None

    async def exit_room(roomid):
        if roomid in rooms:
            opp = get_opponent()
            if opp:
                await send({'type' : 'dc'}, opp)
            rooms[roomid] = list(filter(lambda x: x != websocket, rooms[roomid]))
            if len(rooms[roomid]) == 0:
                del rooms[roomid]
            roomid = None
    await send({'type' : 'init'})
    try:
        async for message in websocket:
            if roomid not in rooms:
                roomid = None
            msg = json.loads(message)
            print('msg is %s' % msg)
            if msg['type'] == 'makeroom':
                if roomid != None:
                    await send(mkalert('you\'re already in room %s' % msg['roomid']))
                elif msg['roomid'] in rooms:
                    await send(mkalert('room %s already exists' % msg['roomid']))
                elif len(msg['roomid']) > 50:
                    await send(mkalert('that room name is 2long :|'))
                else:
                    print('creating room %s' % msg['roomid'])
                    roomid = msg['roomid']
                    rooms[msg['roomid']] = [websocket]

            elif msg['type'] == 'joinroom':
                if roomid != None:
                    await send(mkalert('you\'re already in room %s' % roomid))
                elif msg['roomid'] not in rooms:
                    await send(mkalert('room %s doesn\'t exist' % msg['roomid']))
                elif len(rooms[msg['roomid']]) != 1:
                    await send(mkalert('room %s is full' % msg['roomid']))
                else:
                    roomid = msg['roomid']
                    print('joining room %s' % roomid)
                    rooms[roomid].append(websocket)
                    assert(len(rooms[roomid]) == 2)
                    await asyncio.wait([send({'type' : 'start'}, ws) for ws in rooms[roomid]])

            elif msg['type'] == 'leaveroom':
                await exit_room(roomid)

            elif msg['type'] == 'garbage':
                opp = get_opponent()
                if opp:
                    await send(msg, opp)

            elif msg['type'] == 'loss':
                await send(mkalert('git gud'))
                opp = get_opponent()
                if opp:
                    await send({'type' : 'youwin'}, opp)
                del rooms[roomid]
                roomid = None

            elif msg['type'] == 'getrooms':
                rmlist = sorted([[name, len(ppl)] for (name, ppl) in rooms.items()],
                                key = lambda x: x[1])
                msg = {'type' : 'rmlist', 'rmlist' : rmlist}
                if roomid != None:
                    msg['yourroom'] = roomid
                await send(msg)

            else:
                print('WARN: unrecognized msg type: %s' % msg['type'])

    finally:
        await exit_room(roomid)

start_server = websockets.serve(gameserver, '127.0.0.1', 4733)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
