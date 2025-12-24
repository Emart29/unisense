# UniSense User Guides

## Table of Contents

1. [Administrator Guide](#administrator-guide)
2. [Faculty Dean Guide](#faculty-dean-guide)
3. [Lecturer Guide](#lecturer-guide)
4. [Student Guide](#student-guide)
5. [Finance Officer Guide](#finance-officer-guide)

---

## Administrator Guide

### Overview

As a University Administrator, you have full access to all system features and are responsible for managing users, students, courses, and system-wide settings.

### Getting Started

1. **Login**
   - Navigate to <https://your-university.unisense.com>
   - Enter your admin email and password
   - Click "Login"

2. **Dashboard Overview**
   - Total students count
   - Active courses
   - Pending invoices
   - At-risk students alert
   - Recent announcements

### Managing Students

#### Adding a Single Student

1. Navigate to **Students** → **Add Student**
2. Fill in required information:
   - Student ID (unique identifier)
   - First Name and Last Name
   - Faculty and Department
   - Level (100, 200, 300, 400, 500)
   - Enrollment Status (Active, Suspended, Graduated)
   - Credit Limit (default: 24 units)
3. Click **Save**

#### Bulk Import Students

1. Navigate to **Students** → **Import**
2. Download the CSV template
3. Fill in student data following the template format:

   ```csv
   studentId,firstName,lastName,faculty,department,level,enrollmentStatus
   STU001,John,Doe,Engineering,Computer Science,100,active
   ```

4. Upload the completed CSV file
5. Review import results:
   - Success count
   - Error count
   - Error details for failed records
6. Fix any errors and re-import if needed

#### Viewing and Filtering Students

1. Navigate to **Students** → **All Students**
2. Use filters:
   - Faculty dropdown
   - Department dropdown
   - Level dropdown
   - Enrollment status
3. Search by student ID or name
4. Click on a student to view full profile

#### Editing Student Information

1. Find the student using search or filters
2. Click on student name
3. Click **Edit** button
4. Update information
5. Click **Save Changes**

### Managing Users

#### Creating User Accounts

1. Navigate to **Users** → **Add User**
2. Fill in user details:
   - Email address
   - Role (Admin, Dean, Lecturer, Student, Finance)
   - Password (temporary)
3. Click **Create User**
4. User receives email with login credentials

#### Assigning Roles

Available roles:

- **Admin** - Full system access
- **Dean** - Faculty/department management
- **Lecturer** - Course and grade management
- **Student** - View grades and register courses
- **Finance** - Fee and payment management

### Managing Courses

#### Creating Courses

1. Navigate to **Courses** → **Add Course**
2. Fill in course details:
   - Course Code (e.g., CS101)
   - Course Title
   - Credit Units
   - Faculty and Department
   - Level
   - Assigned Lecturer
   - Session (e.g., 2023/2024)
   - Semester (First/Second)
3. Click **Create Course**

#### Viewing Course Registrations

1. Navigate to **Courses** → **All Courses**
2. Click on a course
3. View **Registrations** tab
4. See list of registered students
5. Export registration list as CSV

### Creating Announcements

1. Navigate to **Announcements** → **Create**
2. Fill in announcement details:
   - Title
   - Content/Message
   - Target Roles (select one or more):
     - Students
     - Lecturers
     - Deans
     - Finance Officers
     - All
3. Click **Publish**
4. Announcement is sent via:
   - Email
   - SMS (if configured)
   - WhatsApp (if configured)
   - In-app notification

### Viewing Analytics

#### At-Risk Students

1. Navigate to **Analytics** → **At-Risk Students**
2. View list of students flagged by AI
3. Risk levels:
   - **High Risk** - Immediate intervention needed
   - **Medium Risk** - Monitor closely
   - **Low Risk** - General monitoring
4. Click on student to see risk factors:
   - GPA decline
   - Course failures
   - Unpaid fees
   - Low attendance
5. Take action:
   - Schedule counseling
   - Contact student
   - Adjust course load

#### Enrollment Trends

1. Navigate to **Analytics** → **Enrollment Trends**
2. View graphs showing:
   - Total enrollment over time
   - New enrollments per session
   - Graduation rates
   - Suspension rates
3. Filter by:
   - Date range
   - Faculty
   - Department

#### Course Performance

1. Navigate to **Analytics** → **Course Performance**
2. View pass/fail heatmap
3. Identify difficult courses (low pass rates)
4. View average scores by course
5. Export data for further analysis

### System Settings

#### Configuring Notifications

1. Navigate to **Settings** → **Notifications**
2. Configure channels:
   - Email (SMTP settings)
   - SMS (Gateway API key)
   - WhatsApp (Business API credentials)
3. Set notification preferences:
   - Grade publication alerts
   - Fee reminders
   - Announcement delivery
4. Test notification delivery

#### Managing Academic Sessions

1. Navigate to **Settings** → **Academic Sessions**
2. Create new session:
   - Session year (e.g., 2023/2024)
   - Start date
   - End date
   - Semesters
3. Set active session
4. Archive old sessions

---

## Faculty Dean Guide

### Overview

As a Faculty Dean, you manage courses and view student information within your faculty.

### Dashboard

Your dashboard shows:

- Total students in your faculty
- Active courses
- Lecturer workload summary
- Department performance metrics

### Managing Courses

#### Creating Courses

1. Navigate to **Courses** → **Add Course**
2. Fill in course details (limited to your faculty)
3. Assign lecturer from your faculty
4. Set course schedule

#### Assigning Lecturers

1. Navigate to **Courses** → **All Courses**
2. Click on a course
3. Click **Edit**
4. Select lecturer from dropdown
5. Save changes

#### Monitoring Workload

1. Navigate to **Analytics** → **Lecturer Workload**
2. View workload distribution:
   - Course count per lecturer
   - Student count per lecturer
   - Workload status (Normal/High/Overloaded)
3. Identify overloaded lecturers
4. Redistribute courses if needed

### Viewing Students

1. Navigate to **Students**
2. View students in your faculty
3. Filter by department and level
4. View student profiles
5. Check academic performance

### Creating Announcements

1. Navigate to **Announcements** → **Create**
2. Create faculty-specific announcements
3. Target specific departments or levels
4. Publish to students and lecturers

---

## Lecturer Guide

### Overview

As a Lecturer, you manage your courses, enter grades, and communicate with students.

### Dashboard

Your dashboard shows:

- Your assigned courses
- Total students across all courses
- Pending grade entries
- Recent announcements

### Viewing Your Courses

1. Navigate to **My Courses**
2. See list of assigned courses
3. Click on a course to view:
   - Course details
   - Registered students
   - Grade entry status

### Entering Grades

#### Single Grade Entry

1. Navigate to **My Courses**
2. Click on a course
3. Click **Enter Grades**
4. Find student in list
5. Enter score (0-100)
6. System automatically calculates:
   - Letter grade (A, B, C, D, F)
   - Grade point (5.0, 4.0, 3.0, 2.0, 0.0)
7. Click **Save**

#### Bulk Grade Entry

1. Navigate to **My Courses**
2. Click on a course
3. Click **Bulk Entry**
4. Download grade template (CSV)
5. Fill in scores for all students
6. Upload completed file
7. Review and confirm

#### Publishing Results

1. Navigate to **My Courses**
2. Click on a course
3. Verify all grades are entered
4. Click **Publish Results**
5. Confirm publication
6. Students can now view their grades
7. System sends notifications to students

**Important:** Once published, grades cannot be unpublished. You can still edit individual grades if needed.

### Viewing Student Performance

1. Navigate to **My Courses**
2. Click on a course
3. View **Analytics** tab
4. See:
   - Class average
   - Pass/fail distribution
   - Grade distribution (A, B, C, D, F)
   - At-risk students in your course

### Predicted GPA

1. Navigate to **My Courses**
2. Click on a course
3. View **Predictions** tab
4. See AI-predicted end-semester GPA for each student
5. Confidence level indicates prediction reliability
6. Use predictions to identify students needing support

### Communicating with Students

#### Course Announcements

1. Navigate to **My Courses**
2. Click on a course
3. Click **Announcements**
4. Create course-specific announcement
5. All registered students receive notification

---

## Student Guide

### Overview

As a Student, you can view your grades, register for courses, check fee status, and receive announcements.

### Dashboard

Your dashboard shows:

- Current GPA and CGPA
- Registered courses for current semester
- Fee balance
- Recent announcements
- Upcoming deadlines

### Registering for Courses

#### Course Registration

1. Navigate to **Course Registration**
2. View available courses for your level
3. Filter by department
4. Click **Register** next to desired course
5. System checks:
   - Credit limit (default 24 units)
   - Prerequisites (if any)
   - Duplicate registration
6. Confirm registration
7. View registered courses in **My Courses**

#### Viewing Registered Courses

1. Navigate to **My Courses**
2. See list of registered courses
3. View course details:
   - Course code and title
   - Credit units
   - Lecturer name
   - Schedule (if available)

### Viewing Grades

#### Current Semester Grades

1. Navigate to **Grades** → **Current Semester**
2. View grades for registered courses
3. See:
   - Course name
   - Score
   - Letter grade
   - Grade point
   - Credit units

**Note:** You can only see published grades. Unpublished grades are hidden.

#### Semester Results

1. Navigate to **Grades** → **Semester Results**
2. View results for each completed semester:
   - Session and semester
   - GPA (Grade Point Average)
   - CGPA (Cumulative GPA)
   - Total credits earned
3. Download transcript (PDF)

#### Understanding Your GPA

**GPA Calculation:**

```
GPA = Sum(Grade Point × Credit Units) / Sum(Credit Units)
```

**Grading Scale:**

- A: 70-100 (5.0 points)
- B: 60-69 (4.0 points)
- C: 50-59 (3.0 points)
- D: 45-49 (2.0 points)
- F: 0-44 (0.0 points)

**Example:**

- CS101 (3 units): Score 75 → Grade A → 5.0 points
- MTH101 (3 units): Score 65 → Grade B → 4.0 points
- PHY101 (2 units): Score 55 → Grade C → 3.0 points

```
GPA = (5.0×3 + 4.0×3 + 3.0×2) / (3+3+2)
    = (15 + 12 + 6) / 8
    = 33 / 8
    = 4.125
```

### Checking Fee Status

#### Viewing Invoices

1. Navigate to **Fees** → **My Invoices**
2. View invoices for each session
3. See:
   - Session
   - Total amount
   - Amount paid
   - Balance
   - Status (Unpaid/Partially Paid/Fully Paid)

#### Payment History

1. Navigate to **Fees** → **Payment History**
2. View all payments made
3. See:
   - Payment date
   - Amount
   - Payment method
   - Receipt number
4. Download receipt (PDF)

### Viewing Announcements

1. Navigate to **Announcements**
2. View announcements targeted to students
3. Filter by:
   - Date
   - Category (Academic/Administrative/General)
4. Click on announcement to read full content

### Using Offline Mode (PWA)

The UniSense app works offline on mobile devices:

1. **Install PWA:**
   - Visit UniSense on mobile browser
   - Click "Add to Home Screen"
   - App icon appears on home screen

2. **Offline Access:**
   - View your profile
   - Check registered courses
   - View published grades
   - Read cached announcements

3. **Sync When Online:**
   - App automatically syncs when internet is available
   - New data is downloaded
   - Cached data is updated

---

## Finance Officer Guide

### Overview

As a Finance Officer, you manage fee structures, generate invoices, record payments, and generate financial reports.

### Dashboard

Your dashboard shows:

- Total revenue (current session)
- Outstanding fees
- Payment collection rate
- Recent payments
- Overdue invoices

### Managing Fee Structures

#### Creating Fee Structure

1. Navigate to **Fees** → **Fee Structures**
2. Click **Add Fee Structure**
3. Fill in details:
   - Academic session (e.g., 2023/2024)
   - Level (100, 200, 300, 400, 500)
   - Amount (in Naira)
4. Click **Save**

#### Viewing Fee Structures

1. Navigate to **Fees** → **Fee Structures**
2. Filter by session or level
3. View all fee structures
4. Edit or delete as needed

### Generating Invoices

#### Bulk Invoice Generation

1. Navigate to **Fees** → **Generate Invoices**
2. Select academic session
3. System generates invoices for all active students
4. Invoices are based on:
   - Student level
   - Fee structure for that level
5. View generation summary:
   - Total invoices created
   - Total amount
6. Students receive invoice notifications

### Recording Payments

#### Single Payment Entry

1. Navigate to **Fees** → **Invoices**
2. Search for student by name or ID
3. Click on invoice
4. Click **Record Payment**
5. Enter payment details:
   - Amount paid
   - Payment method (Cash/Bank Transfer/Online)
   - Payment date
   - Reference number
6. Click **Save**
7. System updates:
   - Amount paid
   - Balance
   - Status (Unpaid → Partially Paid → Fully Paid)

#### Bulk Payment Import

1. Navigate to **Fees** → **Import Payments**
2. Download payment template (CSV)
3. Fill in payment data:

   ```csv
   studentId,amount,paymentDate,paymentMethod,reference
   STU001,50000,2024-01-15,Bank Transfer,REF001
   ```

4. Upload completed file
5. Review import results
6. Confirm to apply payments

### Viewing Payment History

1. Navigate to **Fees** → **Payment History**
2. View all payments
3. Filter by:
   - Date range
   - Payment method
   - Student
4. Search by reference number
5. Export to CSV or PDF

### Generating Financial Reports

#### Session Financial Report

1. Navigate to **Reports** → **Financial Report**
2. Select session
3. View summary:
   - Total fees billed
   - Total collected
   - Outstanding balance
   - Collection rate
4. View breakdown by:
   - Level
   - Faculty
   - Department
5. Export report (CSV/PDF)

#### Payment Analysis

1. Navigate to **Reports** → **Payment Analysis**
2. View charts:
   - Payment trends over time
   - Collection rate by month
   - Payment method distribution
3. Identify:
   - Peak payment periods
   - Students with overdue fees
   - Payment patterns

### Managing Overdue Fees

#### Viewing Overdue Invoices

1. Navigate to **Fees** → **Overdue**
2. View list of students with unpaid fees
3. Sort by:
   - Amount owed
   - Days overdue
   - Level
4. Filter by faculty or department

#### Sending Payment Reminders

1. Navigate to **Fees** → **Overdue**
2. Select students
3. Click **Send Reminder**
4. Customize reminder message
5. Send via:
   - Email
   - SMS
   - WhatsApp
6. Track reminder delivery status

### Generating Receipts

1. Navigate to **Fees** → **Invoices**
2. Find paid invoice
3. Click **Generate Receipt**
4. Receipt includes:
   - Student details
   - Payment amount
   - Payment date
   - Receipt number
   - University stamp
5. Download PDF
6. Email to student

---

## Common Tasks

### Changing Your Password

1. Click on your profile icon (top right)
2. Select **Settings**
3. Click **Change Password**
4. Enter current password
5. Enter new password
6. Confirm new password
7. Click **Update Password**

### Updating Your Profile

1. Click on your profile icon
2. Select **Profile**
3. Update information:
   - Name
   - Email
   - Phone number
   - Profile picture
4. Click **Save Changes**

### Getting Help

1. Click **Help** icon (bottom right)
2. Options:
   - **Search Help** - Search documentation
   - **Contact Support** - Submit support ticket
   - **Video Tutorials** - Watch how-to videos
   - **FAQ** - Frequently asked questions

### Reporting Issues

1. Click **Help** → **Report Issue**
2. Fill in issue details:
   - Category (Bug/Feature Request/Question)
   - Description
   - Screenshots (optional)
3. Click **Submit**
4. Receive ticket number
5. Track issue status in **My Tickets**

---

## Mobile App Usage

### Installing the App

**Android:**

1. Visit UniSense on Chrome browser
2. Tap menu (three dots)
3. Select "Add to Home screen"
4. Tap "Add"

**iOS:**

1. Visit UniSense on Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Using Offline Mode

- View cached data when offline
- App syncs automatically when online
- Offline indicator shows connection status
- Pending actions sync when reconnected

---

## Tips and Best Practices

### For Administrators

- Import students before the session starts
- Create courses early for registration
- Monitor at-risk students weekly
- Review analytics monthly
- Keep user accounts up to date

### For Lecturers

- Enter grades promptly after exams
- Review grades before publishing
- Use bulk entry for large classes
- Monitor student performance regularly
- Communicate with struggling students

### For Students

- Register for courses early
- Check grades regularly
- Pay fees on time
- Read announcements daily
- Keep profile information updated

### For Finance Officers

- Generate invoices at session start
- Record payments daily
- Send reminders for overdue fees
- Reconcile accounts monthly
- Generate reports for management

---

## Troubleshooting

### Cannot Login

- Verify email and password
- Check caps lock is off
- Try password reset
- Contact administrator

### Grades Not Showing

- Check if results are published
- Verify you're registered for the course
- Refresh the page
- Contact lecturer

### Course Registration Failed

- Check credit limit
- Verify course availability
- Check for duplicate registration
- Contact administrator

### Payment Not Reflected

- Wait 24 hours for processing
- Check payment reference
- Contact finance office
- Provide payment proof

---

## Contact Support

- **Email:** <support@unisense.com>
- **Phone:** +234 XXX XXX XXXX
- **Hours:** Monday-Friday, 8AM-5PM WAT
- **Emergency:** <emergency@unisense.com>

---

## Glossary

- **GPA** - Grade Point Average (per semester)
- **CGPA** - Cumulative Grade Point Average (all semesters)
- **Credit Unit** - Academic weight of a course
- **Session** - Academic year (e.g., 2023/2024)
- **Semester** - Half of academic session (First/Second)
- **Level** - Year of study (100, 200, 300, 400, 500)
- **PWA** - Progressive Web App (works offline)
- **At-Risk** - Student likely to fail or drop out

---

*Last Updated: January 2024*  
*Version: 1.0*
