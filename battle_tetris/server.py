#!/usr/bin/env python

import asyncio
import websockets
import json

rooms = {}

# TODO: race conditions
async def mirror(websocket, path):
    async def send(msg, ws=websocket):
        print('sending %s' % json.dumps(msg))
        await ws.send(json.dumps(msg))
    
    def get_opponent():
        if roomid in rooms:
            for ws in rooms[roomid]:
                if ws != websocket:
                    return ws
        return None

    roomid = None
    async for message in websocket:
        if roomid not in rooms:
            roomid = None
        msg = json.loads(message);
        print('msg is %s' % msg)
        if msg['type'] == 'makeroom':
            if roomid != None:
                await send({'type' : 'alert',
                            'body' : 'you\'re already in room %s' % msg['roomid']})
            elif msg['roomid'] in rooms:
                await send({'type' : 'alert',
                            'body' : 'room %s already exists' % msg['roomid']})
            else:
                print('creating room %s' % msg['roomid'])
                roomid = msg['roomid']
                rooms[msg['roomid']] = [websocket]
        if msg['type'] == 'joinroom':
            if roomid != None:
                await send({'type' : 'alert',
                            'body' : 'you\'re already in room %s' % roomid})
            elif msg['roomid'] not in rooms:
                await send({'type' : 'alert',
                            'body' : 'room %s doesn\'t exist' % msg['roomid']})
            elif len(rooms[msg['roomid']]) != 1:
                await send({'type' : 'alert',
                            'body' : 'room %s is full' % msg['roomid']})
            else:
                roomid = msg['roomid']
                print('joining room %s' % roomid)
                rooms[roomid].append(websocket)
                assert(len(rooms[roomid]) == 2)
                await asyncio.wait([send({'type' : 'start'}, ws) for ws in rooms[roomid]])
                    
        if msg['type'] == 'garbage':
            opp = get_opponent()
            if opp:
                await send(msg, opp)
        elif msg['type'] == 'loss':
            await send({'type' : 'alert',
                        'body' : 'git gud'})
            opp = get_opponent()
            if opp:
                await send({'type' : 'youwin'}, opp)
            del rooms[roomid]
            roomid = None

start_server = websockets.serve(mirror, '127.0.0.1', 4733)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
