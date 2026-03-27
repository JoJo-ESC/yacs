from sqlalchemy import Column, String, Integer
from .database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password = Column(String, nullable=False)

    major = Column(String, nullable=False)
    degree = Column(String, nullable=False)

    profile_image_url = Column(String, nullable=True)