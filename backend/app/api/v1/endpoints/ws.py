from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.ws.manager import manager

router = APIRouter()

async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalars().first()
        return user
    except JWTError:
        return None

@router.websocket("/stream")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    await manager.connect(user.id, websocket)
    try:
        while True:
            # We don't expect the client to send much, but we need to keep the connection open
            # and handle disconnects
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
