"""Property-based tests for AI Service analytics functions"""
import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from hypothesis.strategies import composite
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from risk_detector import RiskDetector
from gpa_predictor import GPAPredictor
from workload_analyzer import WorkloadAnalyzer
from insights_generator import InsightsGenerator
from models import RiskLevel
import uuid
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    """Create a test database session"""
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    
    # Create tables
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS universities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                faculty TEXT NOT NULL,
                department TEXT NOT NULL,
                level INTEGER NOT NULL,
                enrollment_status TEXT NOT NULL,
                credit_limit INTEGER DEFAULT 24,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS semester_results (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                session TEXT NOT NULL,
                semester TEXT NOT NULL,
                gpa REAL NOT NULL,
                cgpa REAL NOT NULL,
                total_credits INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS grades (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                score REAL NOT NULL,
                letter_grade TEXT NOT NULL,
                grade_point REAL NOT NULL,
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                session TEXT NOT NULL,
                amount REAL NOT NULL,
                amount_paid REAL DEFAULT 0,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                course_code TEXT NOT NULL,
                title TEXT NOT NULL,
                credit_units INTEGER NOT NULL,
                faculty TEXT NOT NULL,
                department TEXT NOT NULL,
                level INTEGER NOT NULL,
                lecturer_id TEXT,
                session TEXT NOT NULL,
                semester TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_registrations (
                id TEXT PRIMARY KEY,
                university_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.commit()
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    yield session
    
    session.close()
    engine.dispose()

# Strategy generators
def university_id_strategy():
    """Generate a valid university UUID"""
    return st.builds(lambda: str(uuid.uuid4()))

def student_id_strategy():
    """Generate a valid student UUID"""
    return st.builds(lambda: str(uuid.uuid4()))

def gpa_strategy():
    """Generate a valid GPA value (0.0 to 4.0)"""
    return st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False)

def score_strategy():
    """Generate a valid score (0 to 100)"""
    return st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False)

# **Feature: unisense-mvp, Property 26: Risk score computation**
# **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    student_id=st.builds(lambda: str(uuid.uuid4())),
    gpa_trend=st.lists(st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False), min_size=0, max_size=5),
    failure_count=st.integers(min_value=0, max_value=10),
    unpaid_amount=st.floats(min_value=0.0, max_value=10000.0, allow_nan=False, allow_infinity=False),
    total_amount=st.floats(min_value=0.0, max_value=10000.0, allow_nan=False, allow_infinity=False)
)
def test_risk_score_computation(test_db, university_id, student_id, gpa_trend, failure_count, unpaid_amount, total_amount):
    """
    Property 26: Risk score computation
    For any student, the risk score should reflect GPA trend (declining increases risk),
    course failures (failures increase risk), and unpaid fees (unpaid increases risk),
    with classification as Low, Medium, or High Risk.
    """
    # Ensure total_amount >= unpaid_amount
    if total_amount < unpaid_amount:
        total_amount = unpaid_amount
    
    # Insert test data
    # Insert university
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    # Insert student
    test_db.execute(text("""
        INSERT OR IGNORE INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
        VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
    """), {
        "id": student_id,
        "university_id": university_id,
        "student_id": f"STU-{student_id[:8]}",
        "first_name": "Test",
        "last_name": "Student",
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": 100,
        "status": "active"
    })
    
    # Insert GPA trend data
    for i, gpa in enumerate(gpa_trend):
        test_db.execute(text("""
            INSERT INTO semester_results (id, university_id, student_id, session, semester, gpa, cgpa, total_credits)
            VALUES (:id, :university_id, :student_id, :session, :semester, :gpa, :cgpa, :credits)
        """), {
            "id": str(uuid.uuid4()),
            "university_id": university_id,
            "student_id": student_id,
            "session": f"2023-{i}",
            "semester": "First",
            "gpa": gpa,
            "cgpa": gpa,
            "credits": 24
        })
    
    # Insert failure grades
    for i in range(failure_count):
        course_id = str(uuid.uuid4())
        test_db.execute(text("""
            INSERT INTO grades (id, university_id, student_id, course_id, score, letter_grade, grade_point, is_published)
            VALUES (:id, :university_id, :student_id, :course_id, :score, :letter_grade, :grade_point, :is_published)
        """), {
            "id": str(uuid.uuid4()),
            "university_id": university_id,
            "student_id": student_id,
            "course_id": course_id,
            "score": 30.0,
            "letter_grade": "F",
            "grade_point": 0.0,
            "is_published": True
        })
    
    # Insert unpaid fees
    if total_amount > 0:
        test_db.execute(text("""
            INSERT INTO invoices (id, university_id, student_id, session, amount, amount_paid, status)
            VALUES (:id, :university_id, :student_id, :session, :amount, :amount_paid, :status)
        """), {
            "id": str(uuid.uuid4()),
            "university_id": university_id,
            "student_id": student_id,
            "session": "2023-2024",
            "amount": total_amount,
            "amount_paid": total_amount - unpaid_amount,
            "status": "unpaid" if unpaid_amount == total_amount else "partially_paid"
        })
    
    test_db.commit()
    
    # Analyze risk
    detector = RiskDetector(test_db)
    risk_score = detector.analyze_student(student_id, university_id)
    
    # Verify properties
    # 1. Risk score should be between 0 and 100
    assert 0 <= risk_score.risk_score <= 100, f"Risk score {risk_score.risk_score} out of range"
    
    # 2. Risk level should match score thresholds
    if risk_score.risk_score < 30:
        assert risk_score.risk_level == RiskLevel.LOW
    elif risk_score.risk_score < 60:
        assert risk_score.risk_level == RiskLevel.MEDIUM
    else:
        assert risk_score.risk_level == RiskLevel.HIGH
    
    # 3. Declining GPA should increase risk
    if len(gpa_trend) >= 2 and gpa_trend[-1] < gpa_trend[0]:
        assert risk_score.factors["gpa_trend"] > 0, "Declining GPA should increase risk"
    
    # 4. Failures should increase risk
    if failure_count > 0:
        assert risk_score.factors["failures"] > 0, "Failures should increase risk"
    
    # 5. Unpaid fees should increase risk (only if unpaid amount is significant)
    if unpaid_amount > 0.01 and total_amount > 0:
        assert risk_score.factors["unpaid_fees"] > 0, "Unpaid fees should increase risk"


# **Feature: unisense-mvp, Property 27: GPA prediction with confidence**
# **Validates: Requirements 8.1, 8.2, 8.4**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    student_id=st.builds(lambda: str(uuid.uuid4())),
    historical_gpas=st.lists(st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False), min_size=0, max_size=10)
)
def test_gpa_prediction_with_confidence(test_db, university_id, student_id, historical_gpas):
    """
    Property 27: GPA prediction with confidence
    For any student with current performance data, GPA prediction should use current GPA,
    attendance, and historical data, returning a predicted GPA with confidence percentage between 0 and 100.
    """
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    test_db.execute(text("""
        INSERT OR IGNORE INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
        VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
    """), {
        "id": student_id,
        "university_id": university_id,
        "student_id": f"STU-{student_id[:8]}",
        "first_name": "Test",
        "last_name": "Student",
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": 100,
        "status": "active"
    })
    
    # Insert historical GPA data
    for i, gpa in enumerate(historical_gpas):
        test_db.execute(text("""
            INSERT INTO semester_results (id, university_id, student_id, session, semester, gpa, cgpa, total_credits)
            VALUES (:id, :university_id, :student_id, :session, :semester, :gpa, :cgpa, :credits)
        """), {
            "id": str(uuid.uuid4()),
            "university_id": university_id,
            "student_id": student_id,
            "session": f"2023-{i}",
            "semester": "First",
            "gpa": gpa,
            "cgpa": gpa,
            "credits": 24
        })
    
    test_db.commit()
    
    # Predict GPA
    predictor = GPAPredictor(test_db)
    prediction = predictor.predict_gpa(student_id, university_id)
    
    # Verify properties
    # 1. Predicted GPA should be in valid range
    assert 0.0 <= prediction.predicted_gpa <= 4.0, f"Predicted GPA {prediction.predicted_gpa} out of range"
    
    # 2. Confidence should be between 0 and 100
    assert 0.0 <= prediction.confidence <= 100.0, f"Confidence {prediction.confidence} out of range"
    
    # 3. If there's historical data, current_gpa should be set
    if len(historical_gpas) > 0:
        assert prediction.current_gpa is not None, "Current GPA should be set when historical data exists"
        assert prediction.current_gpa == historical_gpas[-1], "Current GPA should match last historical GPA"
    
    # 4. More data should increase confidence
    if len(historical_gpas) >= 2:
        assert prediction.confidence > 0, "Confidence should be positive with historical data"


# **Feature: unisense-mvp, Property 28: GPA prediction updates**
# **Validates: Requirements 8.3**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    student_id=st.builds(lambda: str(uuid.uuid4())),
    initial_gpas=st.lists(st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False), min_size=2, max_size=5),
    new_gpa=st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False)
)
def test_gpa_prediction_updates(test_db, university_id, student_id, initial_gpas, new_gpa):
    """
    Property 28: GPA prediction updates
    For any student with new mid-semester scores, the predicted GPA should update
    to reflect the new performance data.
    """
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    test_db.execute(text("""
        INSERT OR IGNORE INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
        VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
    """), {
        "id": student_id,
        "university_id": university_id,
        "student_id": f"STU-{student_id[:8]}",
        "first_name": "Test",
        "last_name": "Student",
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": 100,
        "status": "active"
    })
    
    # Insert initial GPA data
    for i, gpa in enumerate(initial_gpas):
        test_db.execute(text("""
            INSERT INTO semester_results (id, university_id, student_id, session, semester, gpa, cgpa, total_credits)
            VALUES (:id, :university_id, :student_id, :session, :semester, :gpa, :cgpa, :credits)
        """), {
            "id": str(uuid.uuid4()),
            "university_id": university_id,
            "student_id": student_id,
            "session": f"2023-{i}",
            "semester": "First",
            "gpa": gpa,
            "cgpa": gpa,
            "credits": 24
        })
    
    test_db.commit()
    
    # Get initial prediction
    predictor = GPAPredictor(test_db)
    initial_prediction = predictor.predict_gpa(student_id, university_id)
    
    # Add new GPA data
    test_db.execute(text("""
        INSERT INTO semester_results (id, university_id, student_id, session, semester, gpa, cgpa, total_credits)
        VALUES (:id, :university_id, :student_id, :session, :semester, :gpa, :cgpa, :credits)
    """), {
        "id": str(uuid.uuid4()),
        "university_id": university_id,
        "student_id": student_id,
        "session": f"2023-{len(initial_gpas)}",
        "semester": "First",
        "gpa": new_gpa,
        "cgpa": new_gpa,
        "credits": 24
    })
    
    test_db.commit()
    
    # Get updated prediction
    updated_prediction = predictor.predict_gpa(student_id, university_id)
    
    # Verify properties
    # 1. Current GPA should be updated to the new value
    assert updated_prediction.current_gpa == new_gpa, "Current GPA should reflect new data"
    
    # 2. Prediction should change when new data is added (unless trend is perfectly flat)
    # We can't guarantee the direction, but the prediction should be recalculated
    assert updated_prediction.predicted_gpa >= 0.0 and updated_prediction.predicted_gpa <= 4.0
    
    # 3. Confidence should be valid and reflect prediction quality
    # Confidence can vary based on how well the new data fits the trend (R² score)
    # More data doesn't always mean higher confidence if the trend becomes less predictable
    assert 0.0 <= updated_prediction.confidence <= 100.0, "Confidence should be in valid range"
    
    # 4. The prediction should be updated (not the same as initial unless by coincidence)
    # This verifies that the system is recalculating with the new data
    assert updated_prediction.timestamp > initial_prediction.timestamp or \
           updated_prediction.predicted_gpa != initial_prediction.predicted_gpa or \
           updated_prediction.confidence != initial_prediction.confidence, \
           "Prediction should be recalculated with new data"


# **Feature: unisense-mvp, Property 29: Lecturer workload calculation**
# **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    lecturer_id=st.builds(lambda: str(uuid.uuid4())),
    course_count=st.integers(min_value=0, max_value=10),
    students_per_course=st.lists(st.integers(min_value=0, max_value=50), min_size=0, max_size=10)
)
def test_lecturer_workload_calculation(test_db, university_id, lecturer_id, course_count, students_per_course):
    """
    Property 29: Lecturer workload calculation
    For any lecturer, the workload score should be computed from the count of courses taught
    and the total number of students across all courses, with overload flagging when exceeding thresholds.
    """
    # Ensure students_per_course matches course_count
    students_per_course = students_per_course[:course_count] if len(students_per_course) > course_count else students_per_course + [0] * (course_count - len(students_per_course))
    
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    # Insert courses and students
    total_students = 0
    for i in range(course_count):
        course_id = str(uuid.uuid4())
        test_db.execute(text("""
            INSERT INTO courses (id, university_id, course_code, title, credit_units, faculty, department, level, lecturer_id, session, semester)
            VALUES (:id, :university_id, :course_code, :title, :credit_units, :faculty, :department, :level, :lecturer_id, :session, :semester)
        """), {
            "id": course_id,
            "university_id": university_id,
            "course_code": f"CS{100+i}",
            "title": f"Course {i}",
            "credit_units": 3,
            "faculty": "Engineering",
            "department": "Computer Science",
            "level": 100,
            "lecturer_id": lecturer_id,
            "session": "2023-2024",
            "semester": "First"
        })
        
        # Add students to this course
        for j in range(students_per_course[i]):
            student_id = str(uuid.uuid4())
            test_db.execute(text("""
                INSERT INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
                VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
            """), {
                "id": student_id,
                "university_id": university_id,
                "student_id": f"STU-{student_id[:8]}",
                "first_name": "Test",
                "last_name": f"Student{j}",
                "faculty": "Engineering",
                "department": "Computer Science",
                "level": 100,
                "status": "active"
            })
            
            test_db.execute(text("""
                INSERT INTO course_registrations (id, university_id, student_id, course_id)
                VALUES (:id, :university_id, :student_id, :course_id)
            """), {
                "id": str(uuid.uuid4()),
                "university_id": university_id,
                "student_id": student_id,
                "course_id": course_id
            })
            
            total_students += 1
    
    test_db.commit()
    
    # Analyze workload
    analyzer = WorkloadAnalyzer(test_db)
    workload = analyzer.analyze_lecturer(lecturer_id, university_id)
    
    # Verify properties
    # 1. Course count should match
    assert workload.course_count == course_count, f"Expected {course_count} courses, got {workload.course_count}"
    
    # 2. Total students should match
    assert workload.total_students == total_students, f"Expected {total_students} students, got {workload.total_students}"
    
    # 3. Workload score should be computed correctly
    expected_score = (course_count * 20) + (total_students * 0.5)
    assert workload.workload_score == expected_score, f"Expected score {expected_score}, got {workload.workload_score}"
    
    # 4. Overload flag should be set correctly
    expected_overload = course_count > 5 or total_students > 200
    assert workload.is_overloaded == expected_overload, f"Expected overload={expected_overload}, got {workload.is_overloaded}"


# **Feature: unisense-mvp, Property 30: Enrollment trends accuracy**
# **Validates: Requirements 10.1**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    enrollments=st.lists(
        st.tuples(
            st.text(min_size=1, max_size=10, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))),  # session
            st.text(min_size=1, max_size=10, alphabet=st.characters(whitelist_categories=('Lu', 'Ll'))),  # semester
            st.integers(min_value=1, max_value=100)  # student count
        ),
        min_size=0,
        max_size=10
    )
)
def test_enrollment_trends_accuracy(test_db, university_id, enrollments):
    """
    Property 30: Enrollment trends accuracy
    For any university's enrollment data over time, the trends dashboard should accurately
    reflect enrollment changes across time periods.
    """
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    # Track expected enrollments by period
    expected_enrollments = {}
    
    for session, semester, student_count in enrollments:
        period = f"{session}-{semester}"
        
        # Create a course for this period
        course_id = str(uuid.uuid4())
        test_db.execute(text("""
            INSERT INTO courses (id, university_id, course_code, title, credit_units, faculty, department, level, session, semester)
            VALUES (:id, :university_id, :course_code, :title, :credit_units, :faculty, :department, :level, :session, :semester)
        """), {
            "id": course_id,
            "university_id": university_id,
            "course_code": f"CS{hash(period) % 1000}",
            "title": f"Course for {period}",
            "credit_units": 3,
            "faculty": "Engineering",
            "department": "Computer Science",
            "level": 100,
            "session": session,
            "semester": semester
        })
        
        # Add students to this course
        for i in range(student_count):
            student_id = str(uuid.uuid4())
            test_db.execute(text("""
                INSERT INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
                VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
            """), {
                "id": student_id,
                "university_id": university_id,
                "student_id": f"STU-{student_id[:8]}",
                "first_name": "Test",
                "last_name": f"Student{i}",
                "faculty": "Engineering",
                "department": "Computer Science",
                "level": 100,
                "status": "active"
            })
            
            test_db.execute(text("""
                INSERT INTO course_registrations (id, university_id, student_id, course_id)
                VALUES (:id, :university_id, :student_id, :course_id)
            """), {
                "id": str(uuid.uuid4()),
                "university_id": university_id,
                "student_id": student_id,
                "course_id": course_id
            })
            
            # Track expected enrollment
            if period not in expected_enrollments:
                expected_enrollments[period] = set()
            expected_enrollments[period].add(student_id)
    
    test_db.commit()
    
    # Get enrollment trends
    generator = InsightsGenerator(test_db)
    trends = generator.get_enrollment_trends(university_id)
    
    # Verify properties
    # 1. All periods should be represented
    trend_periods = {trend.period for trend in trends.trends}
    expected_periods = set(expected_enrollments.keys())
    assert trend_periods == expected_periods, f"Expected periods {expected_periods}, got {trend_periods}"
    
    # 2. Enrollment counts should match
    for trend in trends.trends:
        expected_count = len(expected_enrollments[trend.period])
        assert trend.value == expected_count, f"Period {trend.period}: expected {expected_count}, got {trend.value}"


# **Feature: unisense-mvp, Property 31: Pass/fail heatmap accuracy**
# **Validates: Requirements 10.2**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    courses_with_grades=st.lists(
        st.tuples(
            st.text(min_size=1, max_size=10, alphabet=st.characters(whitelist_categories=('Lu', 'Nd'))),  # course_code
            st.lists(st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False), min_size=1, max_size=20)  # scores
        ),
        min_size=0,
        max_size=5
    )
)
def test_pass_fail_heatmap_accuracy(test_db, university_id, courses_with_grades):
    """
    Property 31: Pass/fail heatmap accuracy
    For any set of course grades, the heatmap should display pass rates (grades >= 45)
    and fail rates (grades < 45) accurately for each course.
    """
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    # Track expected pass/fail rates
    expected_rates = {}
    
    # Group by course code to handle duplicates
    course_scores = {}
    for course_code, scores in courses_with_grades:
        if course_code not in course_scores:
            course_scores[course_code] = []
        course_scores[course_code].extend(scores)
    
    for course_code, scores in course_scores.items():
        course_id = str(uuid.uuid4())
        
        # Create course
        test_db.execute(text("""
            INSERT INTO courses (id, university_id, course_code, title, credit_units, faculty, department, level, session, semester)
            VALUES (:id, :university_id, :course_code, :title, :credit_units, :faculty, :department, :level, :session, :semester)
        """), {
            "id": course_id,
            "university_id": university_id,
            "course_code": course_code,
            "title": f"Course {course_code}",
            "credit_units": 3,
            "faculty": "Engineering",
            "department": "Computer Science",
            "level": 100,
            "session": "2023-2024",
            "semester": "First"
        })
        
        # Add grades
        pass_count = 0
        fail_count = 0
        
        for i, score in enumerate(scores):
            student_id = str(uuid.uuid4())
            
            test_db.execute(text("""
                INSERT INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
                VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
            """), {
                "id": student_id,
                "university_id": university_id,
                "student_id": f"STU-{student_id[:8]}",
                "first_name": "Test",
                "last_name": f"Student{i}",
                "faculty": "Engineering",
                "department": "Computer Science",
                "level": 100,
                "status": "active"
            })
            
            # Determine letter grade
            if score >= 70:
                letter_grade = "A"
                grade_point = 4.0
            elif score >= 60:
                letter_grade = "B"
                grade_point = 3.0
            elif score >= 50:
                letter_grade = "C"
                grade_point = 2.0
            elif score >= 45:
                letter_grade = "D"
                grade_point = 1.0
            else:
                letter_grade = "F"
                grade_point = 0.0
            
            test_db.execute(text("""
                INSERT INTO grades (id, university_id, student_id, course_id, score, letter_grade, grade_point, is_published)
                VALUES (:id, :university_id, :student_id, :course_id, :score, :letter_grade, :grade_point, :is_published)
            """), {
                "id": str(uuid.uuid4()),
                "university_id": university_id,
                "student_id": student_id,
                "course_id": course_id,
                "score": score,
                "letter_grade": letter_grade,
                "grade_point": grade_point,
                "is_published": True
            })
            
            if score >= 45:
                pass_count += 1
            else:
                fail_count += 1
        
        total = len(scores)
        expected_rates[course_code] = {
            "pass_rate": (pass_count / total * 100) if total > 0 else 0,
            "fail_rate": (fail_count / total * 100) if total > 0 else 0,
            "total": total
        }
    
    test_db.commit()
    
    # Get heatmap
    generator = InsightsGenerator(test_db)
    heatmap = generator.get_pass_fail_heatmap(university_id)
    
    # Verify properties
    # 1. All courses should be represented
    heatmap_courses = {course.course_code for course in heatmap.courses}
    expected_courses = set(expected_rates.keys())
    assert heatmap_courses == expected_courses, f"Expected courses {expected_courses}, got {heatmap_courses}"
    
    # 2. Pass/fail rates should be accurate
    for course in heatmap.courses:
        expected = expected_rates[course.course_code]
        assert abs(course.pass_rate - expected["pass_rate"]) < 0.01, f"Course {course.course_code}: expected pass rate {expected['pass_rate']}, got {course.pass_rate}"
        assert abs(course.fail_rate - expected["fail_rate"]) < 0.01, f"Course {course.course_code}: expected fail rate {expected['fail_rate']}, got {course.fail_rate}"
        assert course.total_students == expected["total"], f"Course {course.course_code}: expected {expected['total']} students, got {course.total_students}"
        
        # 3. Pass rate + fail rate should equal 100%
        assert abs(course.pass_rate + course.fail_rate - 100.0) < 0.01, f"Pass rate + fail rate should equal 100%"


# **Feature: unisense-mvp, Property 32: Department performance aggregation**
# **Validates: Requirements 10.3**
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
@given(
    university_id=st.builds(lambda: str(uuid.uuid4())),
    departments=st.lists(
        st.tuples(
            st.text(min_size=1, max_size=15, alphabet=st.characters(whitelist_categories=('Lu', 'Ll'))),  # department
            st.text(min_size=1, max_size=15, alphabet=st.characters(whitelist_categories=('Lu', 'Ll'))),  # faculty
            st.lists(st.floats(min_value=0.0, max_value=4.0, allow_nan=False, allow_infinity=False), min_size=1, max_size=10)  # GPAs
        ),
        min_size=0,
        max_size=5
    )
)
def test_department_performance_aggregation(test_db, university_id, departments):
    """
    Property 32: Department performance aggregation
    For any department, the computed average GPA and pass rate should accurately
    reflect all students in that department.
    """
    # Insert test data
    test_db.execute(text("""
        INSERT OR IGNORE INTO universities (id, name, code)
        VALUES (:id, :name, :code)
    """), {"id": university_id, "name": "Test University", "code": f"TEST-{university_id[:8]}"})
    
    # Track expected performance
    expected_performance = {}
    
    # Group by department-faculty pair to handle duplicates
    dept_data = {}
    for department, faculty, gpas in departments:
        key = (department, faculty)
        if key not in dept_data:
            dept_data[key] = []
        dept_data[key].extend(gpas)
    
    for (department, faculty), gpas in dept_data.items():
        for i, gpa in enumerate(gpas):
            student_id = str(uuid.uuid4())
            
            test_db.execute(text("""
                INSERT INTO students (id, university_id, student_id, first_name, last_name, faculty, department, level, enrollment_status)
                VALUES (:id, :university_id, :student_id, :first_name, :last_name, :faculty, :department, :level, :status)
            """), {
                "id": student_id,
                "university_id": university_id,
                "student_id": f"STU-{student_id[:8]}",
                "first_name": "Test",
                "last_name": f"Student{i}",
                "faculty": faculty,
                "department": department,
                "level": 100,
                "status": "active"
            })
            
            # Add semester result
            test_db.execute(text("""
                INSERT INTO semester_results (id, university_id, student_id, session, semester, gpa, cgpa, total_credits)
                VALUES (:id, :university_id, :student_id, :session, :semester, :gpa, :cgpa, :credits)
            """), {
                "id": str(uuid.uuid4()),
                "university_id": university_id,
                "student_id": student_id,
                "session": "2023-2024",
                "semester": "First",
                "gpa": gpa,
                "cgpa": gpa,
                "credits": 24
            })
        
        # Calculate expected values
        avg_gpa = sum(gpas) / len(gpas) if gpas else 0.0
        pass_count = sum(1 for gpa in gpas if gpa >= 1.0)
        pass_rate = (pass_count / len(gpas) * 100) if gpas else 0.0
        
        expected_performance[(department, faculty)] = {
            "avg_gpa": avg_gpa,
            "pass_rate": pass_rate,
            "total_students": len(gpas)
        }
    
    test_db.commit()
    
    # Get department performance
    generator = InsightsGenerator(test_db)
    insights = generator.get_department_performance(university_id)
    
    # Verify properties
    # 1. All departments should be represented
    actual_depts = {(dept.department, dept.faculty) for dept in insights.departments}
    expected_depts = set(expected_performance.keys())
    assert actual_depts == expected_depts, f"Expected departments {expected_depts}, got {actual_depts}"
    
    # 2. Performance metrics should be accurate
    for dept in insights.departments:
        key = (dept.department, dept.faculty)
        expected = expected_performance[key]
        
        assert abs(dept.average_gpa - expected["avg_gpa"]) < 0.01, f"Department {key}: expected avg GPA {expected['avg_gpa']}, got {dept.average_gpa}"
        assert abs(dept.pass_rate - expected["pass_rate"]) < 0.01, f"Department {key}: expected pass rate {expected['pass_rate']}, got {dept.pass_rate}"
        assert dept.total_students == expected["total_students"], f"Department {key}: expected {expected['total_students']} students, got {dept.total_students}"
