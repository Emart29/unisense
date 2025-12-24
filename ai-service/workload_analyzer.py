"""Lecturer workload analysis module"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import WorkloadScore

class WorkloadAnalyzer:
    """Analyzes lecturer teaching workload"""
    
    # Workload thresholds
    OVERLOAD_COURSE_THRESHOLD = 5  # More than 5 courses
    OVERLOAD_STUDENT_THRESHOLD = 200  # More than 200 students
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_lecturer(self, lecturer_id: str, university_id: str) -> WorkloadScore:
        """
        Computes teaching load based on courses and student count
        
        Args:
            lecturer_id: Lecturer user UUID
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            WorkloadScore with course count, student count, and overload flag
        """
        # Get course count and total students
        query = text("""
            SELECT 
                COUNT(DISTINCT c.id) as course_count,
                COUNT(DISTINCT cr.student_id) as total_students
            FROM courses c
            LEFT JOIN course_registrations cr ON c.id = cr.course_id
            WHERE c.lecturer_id = :lecturer_id 
            AND c.university_id = :university_id
        """)
        
        result = self.db.execute(
            query,
            {"lecturer_id": lecturer_id, "university_id": university_id}
        ).fetchone()
        
        course_count = result[0] if result and result[0] else 0
        total_students = result[1] if result and result[1] else 0
        
        # Calculate workload score
        # Score = (course_count * 20) + (total_students * 0.5)
        workload_score = (course_count * 20) + (total_students * 0.5)
        
        # Check if overloaded
        is_overloaded = (
            course_count > self.OVERLOAD_COURSE_THRESHOLD or
            total_students > self.OVERLOAD_STUDENT_THRESHOLD
        )
        
        return WorkloadScore(
            lecturer_id=lecturer_id,
            course_count=course_count,
            total_students=total_students,
            workload_score=workload_score,
            is_overloaded=is_overloaded
        )
