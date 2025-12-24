"""Insights generation module for admin dashboards"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from models import (
    EnrollmentTrends, TrendPoint, 
    PassFailHeatmap, CoursePerformance,
    DepartmentInsights, DepartmentPerformance
)

class InsightsGenerator:
    """Generates insights for admin dashboards"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_enrollment_trends(self, university_id: str) -> EnrollmentTrends:
        """
        Returns enrollment trends over time
        
        Args:
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            EnrollmentTrends with time series data
        """
        query = text("""
            SELECT 
                session || '-' || semester as period,
                COUNT(DISTINCT cr.student_id) as enrollment_count
            FROM course_registrations cr
            JOIN courses c ON cr.course_id = c.id
            WHERE c.university_id = :university_id
            GROUP BY session, semester
            ORDER BY session, semester
        """)
        
        result = self.db.execute(
            query,
            {"university_id": university_id}
        ).fetchall()
        
        trends = [
            TrendPoint(period=row[0], value=row[1])
            for row in result
        ]
        
        return EnrollmentTrends(
            university_id=university_id,
            trends=trends
        )
    
    def get_pass_fail_heatmap(self, university_id: str) -> PassFailHeatmap:
        """
        Generates pass/fail heatmap showing success rates by course
        
        Args:
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            PassFailHeatmap with course performance data
        """
        query = text("""
            SELECT 
                c.course_code,
                c.title,
                COUNT(*) as total_students,
                SUM(CASE WHEN g.score >= 45 THEN 1 ELSE 0 END) as pass_count,
                SUM(CASE WHEN g.score < 45 THEN 1 ELSE 0 END) as fail_count
            FROM grades g
            JOIN courses c ON g.course_id = c.id
            WHERE g.university_id = :university_id
            AND g.is_published = true
            GROUP BY c.course_code, c.title
            HAVING COUNT(*) > 0
        """)
        
        result = self.db.execute(
            query,
            {"university_id": university_id}
        ).fetchall()
        
        courses = []
        for row in result:
            course_code = row[0]
            course_title = row[1]
            total_students = row[2]
            pass_count = row[3]
            fail_count = row[4]
            
            pass_rate = (pass_count / total_students * 100) if total_students > 0 else 0
            fail_rate = (fail_count / total_students * 100) if total_students > 0 else 0
            
            courses.append(CoursePerformance(
                course_code=course_code,
                course_title=course_title,
                pass_rate=round(pass_rate, 2),
                fail_rate=round(fail_rate, 2),
                total_students=total_students
            ))
        
        return PassFailHeatmap(
            university_id=university_id,
            courses=courses
        )
    
    def get_department_performance(self, university_id: str) -> DepartmentInsights:
        """
        Computes average GPA and pass rates per department
        
        Args:
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            DepartmentInsights with aggregated department data
        """
        query = text("""
            SELECT 
                s.department,
                s.faculty,
                COUNT(DISTINCT s.id) as total_students,
                AVG(sr.gpa) as avg_gpa,
                AVG(CASE 
                    WHEN sr.gpa >= 1.0 THEN 100.0 
                    ELSE 0.0 
                END) as pass_rate
            FROM students s
            LEFT JOIN semester_results sr ON s.id = sr.student_id
            WHERE s.university_id = :university_id
            AND s.enrollment_status = 'active'
            GROUP BY s.department, s.faculty
            HAVING COUNT(DISTINCT s.id) > 0
        """)
        
        result = self.db.execute(
            query,
            {"university_id": university_id}
        ).fetchall()
        
        departments = []
        for row in result:
            department = row[0]
            faculty = row[1]
            total_students = row[2]
            avg_gpa = float(row[3]) if row[3] else 0.0
            pass_rate = float(row[4]) if row[4] else 0.0
            
            departments.append(DepartmentPerformance(
                department=department,
                faculty=faculty,
                average_gpa=round(avg_gpa, 2),
                pass_rate=round(pass_rate, 2),
                total_students=total_students
            ))
        
        return DepartmentInsights(
            university_id=university_id,
            departments=departments
        )
