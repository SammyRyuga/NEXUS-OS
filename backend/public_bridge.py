from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import httpx
import uvicorn

BACKEND_URL = "http://127.0.0.1:8000"

app = FastAPI(title="NEXUS Telemetry Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/state")
async def get_state():
    async with httpx.AsyncClient(timeout=3.0) as client:
        response = await client.get(f"{BACKEND_URL}/api/state")
        response.raise_for_status()
        return response.json()


@app.websocket("/ws")
async def telemetry_socket(websocket: WebSocket):
    await websocket.accept()

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            while True:
                response = await client.get(f"{BACKEND_URL}/api/state")
                response.raise_for_status()

                await websocket.send_text(response.text)

                await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        print(f"Telemetry bridge closed: {exc}")


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
    )