from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_optional(
    token: str | None = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Extract the current user from the JWT access token if present, else return None."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            return None
    except JWTError:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()


def require_role(*roles: UserRole):
    """Factory that returns a dependency enforcing that the current user has one of the given roles."""

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        print(f"DEBUG role_checker: user={current_user.email}, role={current_user.role}, required_roles={roles}")
        if current_user.role not in roles:
            print(f"DEBUG role_checker FAILED for {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker
