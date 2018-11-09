#!/usr/bin/env python

import asyncio
import websockets
import json

# hash mapping room name to list of websockets
rooms = {}

# hash mapping user to their room name
users = {}

def mkalert(msg):
    return {'type' : 'alert', 'body' : msg}

async def gameserver(websocket, path):
    users[websocket] = None

    async def send(msg, ws=websocket):
        #print('sending %s' % json.dumps(msg))
        await ws.send(json.dumps(msg))
    
    def get_opponent():
        if users[websocket] != None:
            for ws in rooms[users[websocket]]:
                if ws != websocket:
                    return ws
        return None

    async def broadcast_rooms():
        sends = []
        for ws in users:
            rmlist = sorted([[name, len(ppl)] for (name, ppl) in rooms.items()],
                            key = lambda x: x[1])
            msg = {'type' : 'rmlist', 'rmlist' : rmlist, 'lurkers' : len(users)}
            if users[ws] != None:
                msg['yourroom'] = users[ws]
            sends.append(send(msg, ws))
        await asyncio.wait(sends)
        

    async def exit_room():
        if users[websocket] in rooms:
            opp = get_opponent()
            if opp:
                await send({'type' : 'dc'}, opp)
            rooms[users[websocket]] = list(filter(lambda x: x != websocket, rooms[users[websocket]]))
            if len(rooms[users[websocket]]) == 0:
                del rooms[users[websocket]]
            users[websocket] = None
            await broadcast_rooms()

    await send({'type' : 'init'})
    await broadcast_rooms()
    try:
        async for message in websocket:
            if users[websocket] not in rooms:
                users[websocket] = None
            msg = json.loads(message)
            #print('msg is %s' % msg)
            if msg['type'] == 'makeroom':
                if users[websocket] != None:
                    await send(mkalert('you\'re already in room %s' % users[websocket]))
                elif msg['roomid'] in rooms:
                    await send(mkalert('room %s already exists' % msg['roomid']))
                elif len(msg['roomid']) > 50:
                    await send(mkalert('that room name is 2long :|'))
                else:
                    print('creating room %s' % msg['roomid'])
                    users[websocket] = msg['roomid']
                    rooms[msg['roomid']] = [websocket]
                    await broadcast_rooms()

            elif msg['type'] == 'joinroom':
                if users[websocket] != None:
                    await send(mkalert('you\'re already in room %s' % users[websocket]))
                elif msg['roomid'] not in rooms:
                    await send(mkalert('room %s doesn\'t exist' % msg['roomid']))
                elif len(rooms[msg['roomid']]) != 1:
                    await send(mkalert('room %s is full' % msg['roomid']))
                else:
                    users[websocket] = msg['roomid']
                    rooms[users[websocket]].append(websocket)
                    assert(len(rooms[users[websocket]]) == 2)
                    await asyncio.wait([send({'type' : 'start'}, ws) for ws in rooms[users[websocket]]])
                    await broadcast_rooms()

            elif msg['type'] == 'leaveroom':
                await exit_room(users[websocket])

            elif msg['type'] == 'garbage':
                opp = get_opponent()
                if opp:
                    await send(msg, opp)

            elif msg['type'] == 'loss':
                await send(mkalert('git gud'))
                opp = get_opponent()
                if opp:
                    await send({'type' : 'youwin'}, opp)
                del rooms[users[websocket]]
                users[websocket] = None
                await broadcast_rooms()

            elif msg['type'] == 'state':
                opp = get_opponent()
                if opp:
                    await send(msg, opp)

            else:
                print('WARN: unrecognized msg type: %s' % msg['type'])

    finally:
        del users[websocket]
        await exit_room(users[websocket])

start_server = websockets.serve(gameserver, '127.0.0.1', 4733)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
