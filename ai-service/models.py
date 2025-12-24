"""Pydantic models for API requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "Low Risk"
    MEDIUM = "Medium Risk"
    HIGH = "High Risk"

class RiskScore(BaseModel):
    student_id: str
    risk_score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    factors: Dict[str, float]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GPAPrediction(BaseModel):
    student_id: str
    predicted_gpa: float = Field(..., ge=0, le=4.0)
    confidence: float = Field(..., ge=0, le=100)
    current_gpa: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WorkloadScore(BaseModel):
    lecturer_id: str
    course_count: int
    total_students: int
    workload_score: float
    is_overloaded: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TrendPoint(BaseModel):
    period: str
    value: int

class EnrollmentTrends(BaseModel):
    university_id: str
    trends: List[TrendPoint]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CoursePerformance(BaseModel):
    course_code: str
    course_title: str
    pass_rate: float
    fail_rate: float
    total_students: int

class PassFailHeatmap(BaseModel):
    university_id: str
    courses: List[CoursePerformance]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DepartmentPerformance(BaseModel):
    department: str
    faculty: str
    average_gpa: float
    pass_rate: float
    total_students: int

class DepartmentInsights(BaseModel):
    university_id: str
    departments: List[DepartmentPerformance]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
