from sqlalchemy import Column, Integer, String

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(length=255), nullable=False)
    email = Column(String(length=255), nullable=False, unique=True, index=True)
    phone = Column(String(length=64), nullable=False, default="")
    password_hash = Column(String(length=255), nullable=False)
    major = Column(String(length=128), nullable=False, default="Undeclared")
    degree = Column(String(length=64), nullable=False, default="BS")
