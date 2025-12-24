from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db_session
from risk_detector import RiskDetector
from gpa_predictor import GPAPredictor
from workload_analyzer import WorkloadAnalyzer
from insights_generator import InsightsGenerator
from models import (
    RiskScore, GPAPrediction, WorkloadScore,
    EnrollmentTrends, PassFailHeatmap, DepartmentInsights
)

app = FastAPI(
    title="UniSense AI Service",
    description="Lightweight analytics and predictions for university management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "UniSense AI Service",
        "version": "1.0.0",
        "status": "running"
    }

# Risk Detection Endpoints
@app.get("/api/risk/student/{student_id}", response_model=RiskScore)
async def analyze_student_risk(
    student_id: str,
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Analyze student risk based on GPA trend, failures, and unpaid fees
    
    Args:
        student_id: Student UUID
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        RiskScore with risk level and contributing factors
    """
    try:
        detector = RiskDetector(db)
        risk_score = detector.analyze_student(student_id, university_id)
        return risk_score
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# GPA Prediction Endpoints
@app.get("/api/gpa/predict/{student_id}", response_model=GPAPrediction)
async def predict_student_gpa(
    student_id: str,
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Predict end-semester GPA for a student with confidence indicator
    
    Args:
        student_id: Student UUID
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        GPAPrediction with predicted GPA and confidence percentage
    """
    try:
        predictor = GPAPredictor(db)
        prediction = predictor.predict_gpa(student_id, university_id)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Workload Analysis Endpoints
@app.get("/api/workload/lecturer/{lecturer_id}", response_model=WorkloadScore)
async def analyze_lecturer_workload(
    lecturer_id: str,
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Analyze lecturer workload based on course count and student count
    
    Args:
        lecturer_id: Lecturer user UUID
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        WorkloadScore with course count, student count, and overload flag
    """
    try:
        analyzer = WorkloadAnalyzer(db)
        workload = analyzer.analyze_lecturer(lecturer_id, university_id)
        return workload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Insights Endpoints
@app.get("/api/insights/enrollment-trends", response_model=EnrollmentTrends)
async def get_enrollment_trends(
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Get enrollment trends over time for a university
    
    Args:
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        EnrollmentTrends with time series data
    """
    try:
        generator = InsightsGenerator(db)
        trends = generator.get_enrollment_trends(university_id)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/insights/pass-fail-heatmap", response_model=PassFailHeatmap)
async def get_pass_fail_heatmap(
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Get pass/fail heatmap showing course performance
    
    Args:
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        PassFailHeatmap with course performance data
    """
    try:
        generator = InsightsGenerator(db)
        heatmap = generator.get_pass_fail_heatmap(university_id)
        return heatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/insights/department-performance", response_model=DepartmentInsights)
async def get_department_performance(
    university_id: str,
    db: Session = Depends(get_db_session)
):
    """
    Get department performance with average GPA and pass rates
    
    Args:
        university_id: University UUID for multi-tenant filtering
        
    Returns:
        DepartmentInsights with aggregated department data
    """
    try:
        generator = InsightsGenerator(db)
        insights = generator.get_department_performance(university_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
