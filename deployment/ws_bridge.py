"""Fixed-destination binary MTProto bridge for the Bullgram WebK origin."""
import asyncio
from websockets.asyncio.server import serve

async def handle(ws):
    if ws.request.path != '/apiws':
        await ws.close(1008, 'Unknown endpoint')
        return
    reader, writer = await asyncio.wait_for(asyncio.open_connection('127.0.0.1',42000),10)
    async def upload():
        async for message in ws:
            if not isinstance(message, bytes):
                await ws.close(1003,'Binary required')
                break
            writer.write(message)
            await writer.drain()
    async def download():
        while chunk := await reader.read(65536):
            await ws.send(chunk)
    tasks=[asyncio.create_task(upload()),asyncio.create_task(download())]
    try:
        await asyncio.wait(tasks,return_when=asyncio.FIRST_COMPLETED)
    finally:
        for task in tasks:task.cancel()
        await asyncio.gather(*tasks,return_exceptions=True)
        writer.close()
        await writer.wait_closed()
        await ws.close()

async def main():
    async with serve(handle,'127.0.0.1',9081,origins=['https://webk.duckdns.org'],subprotocols=['binary'],compression=None,max_size=4*1024*1024,max_queue=8,ping_interval=30,ping_timeout=30):
        await asyncio.Future()

if __name__=='__main__':asyncio.run(main())
