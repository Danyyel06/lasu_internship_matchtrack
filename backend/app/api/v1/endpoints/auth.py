from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}


from app.models.student import Student

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create the new user
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    db.add(user)
    await db.flush()

    if body.role == UserRole.STUDENT:
        if not body.matric_no or not body.faculty or not body.department:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Matric no, faculty, and department are required for students",
            )
            
        # Check if matric_no already exists
        matric_check = await db.execute(select(Student).where(Student.matric_no == body.matric_no))
        if matric_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A student with this matriculation number already exists",
            )

        # Parse level from year_of_study (e.g. "300L" -> 300)
        level = None
        if body.year_of_study:
            try:
                level = int(body.year_of_study.replace("L", ""))
            except ValueError:
                pass
                
        student = Student(
            user_id=user.id,
            matric_no=body.matric_no,
            faculty=body.faculty,
            department=body.department,
            level=level,
            cgpa=body.cgpa,
        )
        db.add(student)
        await db.flush()

    # Generate tokens
    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": False
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


from fastapi.security import OAuth2PasswordRequestForm

@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticate a user (for Swagger UI) and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.student import Student
    from app.models.company import Company
    
    is_onboarded = False
    company_name = None
    if user.role == UserRole.STUDENT:
        student_check = await db.execute(select(Student).where(Student.user_id == user.id))
        student = student_check.scalar_one_or_none()
        if student and student.onboarding_completed_at is not None:
            is_onboarded = True
    elif user.role == UserRole.COMPANY_REP:
        company_check = await db.execute(select(Company).where(Company.user_id == user.id))
        company = company_check.scalar_one_or_none()
        if company:
            company_name = company.company_name
            if company.industry is not None:
                is_onboarded = True

    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": is_onboarded,
        "company_name": company_name
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.student import Student
    from app.models.company import Company
    
    is_onboarded = False
    company_name = None
    if user.role == UserRole.STUDENT:
        student_check = await db.execute(select(Student).where(Student.user_id == user.id))
        student = student_check.scalar_one_or_none()
        if student and student.onboarding_completed_at is not None:
            is_onboarded = True
    elif user.role == UserRole.COMPANY_REP:
        company_check = await db.execute(select(Company).where(Company.user_id == user.id))
        company = company_check.scalar_one_or_none()
        if company:
            company_name = company.company_name
            if company.industry is not None:
                is_onboarded = True

    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": is_onboarded,
        "company_name": company_name
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new token pair."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(body.refresh_token)
        token_type: str | None = payload.get("type")
        user_id: str | None = payload.get("sub")

        if token_type != "refresh" or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name
    }
    access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )
