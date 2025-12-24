"""Risk detection module for identifying at-risk students"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict
from models import RiskScore, RiskLevel

class RiskDetector:
    """Detects at-risk students using rule-based scoring"""
    
    # Risk thresholds
    LOW_RISK_THRESHOLD = 30
    MEDIUM_RISK_THRESHOLD = 60
    
    # Weight factors
    GPA_TREND_WEIGHT = 0.4
    FAILURES_WEIGHT = 0.35
    UNPAID_FEES_WEIGHT = 0.25
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_student(self, student_id: str, university_id: str) -> RiskScore:
        """
        Computes risk score based on GPA trend, failures, and unpaid fees
        
        Args:
            student_id: Student UUID
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            RiskScore with computed risk level and factors
        """
        factors = {
            "gpa_trend": self._compute_gpa_trend_risk(student_id, university_id),
            "failures": self._compute_failure_risk(student_id, university_id),
            "unpaid_fees": self._compute_unpaid_fees_risk(student_id, university_id)
        }
        
        # Calculate weighted risk score
        risk_score = (
            factors["gpa_trend"] * self.GPA_TREND_WEIGHT +
            factors["failures"] * self.FAILURES_WEIGHT +
            factors["unpaid_fees"] * self.UNPAID_FEES_WEIGHT
        )
        
        # Classify risk level
        if risk_score < self.LOW_RISK_THRESHOLD:
            risk_level = RiskLevel.LOW
        elif risk_score < self.MEDIUM_RISK_THRESHOLD:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.HIGH
        
        return RiskScore(
            student_id=student_id,
            risk_score=risk_score,
            risk_level=risk_level,
            factors=factors
        )
    
    def _compute_gpa_trend_risk(self, student_id: str, university_id: str) -> float:
        """
        Compute risk based on GPA trend (declining GPA increases risk)
        Returns score 0-100
        """
        query = text("""
            SELECT gpa, session, semester
            FROM semester_results
            WHERE student_id = :student_id 
            AND university_id = :university_id
            ORDER BY created_at ASC
        """)
        
        result = self.db.execute(
            query, 
            {"student_id": student_id, "university_id": university_id}
        ).fetchall()
        
        if len(result) < 2:
            # Not enough data, assume low risk
            return 0.0
        
        gpas = [row[0] for row in result]
        
        # Calculate trend (negative slope = declining GPA = higher risk)
        trend = (gpas[-1] - gpas[0]) / len(gpas)
        
        if trend >= 0:
            # GPA improving or stable
            return 0.0
        else:
            # GPA declining - map to 0-100 scale
            # A decline of 1.0 GPA point = 100 risk
            decline_risk = min(abs(trend) * 100, 100)
            return decline_risk
    
    def _compute_failure_risk(self, student_id: str, university_id: str) -> float:
        """
        Compute risk based on course failures (F grades)
        Returns score 0-100
        """
        query = text("""
            SELECT COUNT(*) as failure_count
            FROM grades
            WHERE student_id = :student_id 
            AND university_id = :university_id
            AND letter_grade = 'F'
            AND is_published = true
        """)
        
        result = self.db.execute(
            query,
            {"student_id": student_id, "university_id": university_id}
        ).fetchone()
        
        failure_count = result[0] if result else 0
        
        # Map failures to risk score (each failure adds 20 points, capped at 100)
        failure_risk = min(failure_count * 20, 100)
        return float(failure_risk)
    
    def _compute_unpaid_fees_risk(self, student_id: str, university_id: str) -> float:
        """
        Compute risk based on unpaid fees
        Returns score 0-100
        """
        query = text("""
            SELECT 
                SUM(amount) as total_amount,
                SUM(amount_paid) as total_paid
            FROM invoices
            WHERE student_id = :student_id 
            AND university_id = :university_id
            AND status != 'fully_paid'
        """)
        
        result = self.db.execute(
            query,
            {"student_id": student_id, "university_id": university_id}
        ).fetchone()
        
        if not result or result[0] is None:
            # No unpaid fees
            return 0.0
        
        total_amount = float(result[0])
        total_paid = float(result[1]) if result[1] else 0.0
        
        if total_amount == 0:
            return 0.0
        
        # Calculate percentage unpaid
        unpaid_percentage = ((total_amount - total_paid) / total_amount) * 100
        
        return unpaid_percentage
