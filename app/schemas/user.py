import uuid
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserSkillBase(BaseModel):
    skill_name: str


class UserSkillCreate(UserSkillBase):
    pass


class UserSkillOut(UserSkillBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    employee_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role_id: uuid.UUID
    designation_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None
    employment_type: str = "full_time"
    status: str = "active"
    joining_date: Optional[date] = None


class UserCreate(UserBase):
    password: str
    skills: Optional[List[str]] = []


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    designation_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    joining_date: Optional[date] = None
    skills: Optional[List[str]] = None


class UserStatusUpdate(BaseModel):
    status: str


class UserResetPassword(BaseModel):
    new_password: str


class UserOut(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    role_name: Optional[str] = None
    designation_name: Optional[str] = None
    department_name: Optional[str] = None
    skills: List[UserSkillOut] = []

    model_config = ConfigDict(from_attributes=True)
