from sqlalchemy import Column, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base                                                        
                                                                                                                                                                     
class Course(Base):                                                                 
    __tablename__ = 'course'                                                      
    __table_args__ = (
        UniqueConstraint('term', 'crn', name='uq_course_term_crn'),
        Index('ix_course_subject_term_number_section', 'subject', 'term', 'course_number', 'section'),
    )
                                                                                
    id = Column(Integer, primary_key=True)  # From JSON "id" field                
    term = Column(String(10), index=True, nullable=False)   # e.g., "202501"                      
    term_desc = Column(String(50))          # e.g., "Spring 2025"                 
                                                                                
    # Course identification                                                       
    crn = Column(String(10), index=True, nullable=False)  # courseReferenceNumber               
    subject = Column(String(10), index=True)  # e.g., "ADMN" (department code)    
    subject_description = Column(String(100)) # e.g., "Administrative Courses"    
    course_number = Column(String(10))      # e.g., "1030"                        
    course_title = Column(Text)             # Full course name                    
                                                                                
    # Credits & enrollment                                                        
    credit_hours = Column(Integer)                                                
    max_enrollment = Column(Integer)                                              
    enrollment = Column(Integer)                                                  
    seats_available = Column(Integer)                                             
                                                                                
    # Section info                                                                
    section = Column(String(10))            # sequenceNumber                      
    schedule_type = Column(String(50))      # scheduleTypeDescription             
    instructional_method = Column(String(10))

    meeting_times = relationship('MeetingTime', back_populates='course', cascade='all, delete-orphan')
