"""GPA prediction module using linear regression"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import numpy as np
from sklearn.linear_model import LinearRegression
from models import GPAPrediction

class GPAPredictor:
    """Predicts end-semester GPA using linear regression"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def predict_gpa(self, student_id: str, university_id: str) -> GPAPrediction:
        """
        Predicts end-semester GPA with confidence indicator
        
        Args:
            student_id: Student UUID
            university_id: University UUID for multi-tenant filtering
            
        Returns:
            GPAPrediction with predicted GPA and confidence
        """
        # Get historical GPA data
        historical_gpas = self._get_historical_gpas(student_id, university_id)
        
        if len(historical_gpas) == 0:
            # No historical data, return neutral prediction
            return GPAPrediction(
                student_id=student_id,
                predicted_gpa=2.5,
                confidence=0.0,
                current_gpa=None
            )
        
        current_gpa = historical_gpas[-1] if historical_gpas else None
        
        if len(historical_gpas) < 2:
            # Not enough data for trend, predict current GPA
            return GPAPrediction(
                student_id=student_id,
                predicted_gpa=current_gpa,
                confidence=50.0,
                current_gpa=current_gpa
            )
        
        # Prepare data for linear regression
        X = np.array(range(len(historical_gpas))).reshape(-1, 1)
        y = np.array(historical_gpas)
        
        # Train linear regression model
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next semester
        next_semester = len(historical_gpas)
        predicted_gpa = model.predict([[next_semester]])[0]
        
        # Clamp to valid GPA range
        predicted_gpa = max(0.0, min(4.0, predicted_gpa))
        
        # Calculate confidence based on R² score and data points
        r_squared = model.score(X, y)
        
        # Confidence increases with more data points and better fit
        data_confidence = min(len(historical_gpas) * 10, 50)  # Max 50 from data
        fit_confidence = r_squared * 50  # Max 50 from fit quality
        
        confidence = data_confidence + fit_confidence
        confidence = max(0.0, min(100.0, confidence))
        
        return GPAPrediction(
            student_id=student_id,
            predicted_gpa=round(predicted_gpa, 2),
            confidence=round(confidence, 2),
            current_gpa=current_gpa
        )
    
    def _get_historical_gpas(self, student_id: str, university_id: str) -> list:
        """Get historical GPA data for a student"""
        query = text("""
            SELECT gpa
            FROM semester_results
            WHERE student_id = :student_id 
            AND university_id = :university_id
            ORDER BY created_at ASC
        """)
        
        result = self.db.execute(
            query,
            {"student_id": student_id, "university_id": university_id}
        ).fetchall()
        
        return [float(row[0]) for row in result]
