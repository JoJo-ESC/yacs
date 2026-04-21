from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from utils import load_config, load_secrets

# Load configuration and secrets from YAML files
config = load_config()
secrets = load_secrets()

DB_NAME = config.get('DB_NAME', 'yacsdb')
DB_HOST = config.get('DB_HOST', 'db')
DB_PORT = config.get('DB_PORT', '5432')
DB_USER = secrets.get('DB_USER', 'yacs')
DB_PASS = secrets.get('DB_PASS', 'yacs')

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(retries: int = 5, delay: int = 2):
    """Create all database tables. Call this on app startup.

    Retries connection to handle Docker startup race condition.
    """
    import time
    from .database import Base

    for attempt in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("Database initialized successfully.")
            return
        except Exception as err:
            print(f"Database connection attempt {attempt + 1}/{retries} failed: {err}")
            if attempt < retries - 1:
                time.sleep(delay)

    raise Exception("Could not connect to database after multiple attempts.")


def reset_course_tables():
    """Drop and recreate course import tables for local schema resets."""
    from .database import Base
    from .course import Course
    from .meeting_time import MeetingTime

    Base.metadata.drop_all(bind=engine, tables=[MeetingTime.__table__, Course.__table__])
    Base.metadata.create_all(bind=engine, tables=[Course.__table__, MeetingTime.__table__])

if __name__=="__main__":
    import time

    is_online = False

    for i in range(5):
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            is_online = True
            break
        except Exception as err:
            print(err)

        time.sleep(1)

    if not is_online:
        raise Exception("Database not connected")
