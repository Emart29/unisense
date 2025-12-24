import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create universities table
    await queryRunner.query(`
      CREATE TABLE universities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DEAN', 'LECTURER', 'STUDENT', 'FINANCE')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (university_id, email)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_university_email ON users(university_id, email)
    `);

    // Create students table
    await queryRunner.query(`
      CREATE TABLE students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        student_id VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        level INTEGER NOT NULL,
        enrollment_status VARCHAR(20) NOT NULL CHECK (enrollment_status IN ('active', 'suspended', 'graduated')),
        credit_limit INTEGER DEFAULT 24,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (university_id, student_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_university_student ON students(university_id, student_id)
    `);

    // Create courses table
    await queryRunner.query(`
      CREATE TABLE courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        course_code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        credit_units INTEGER NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        level INTEGER NOT NULL,
        lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session VARCHAR(20) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (university_id, course_code, session, semester)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_university_course ON courses(university_id, course_code)
    `);

    // Create course_registrations table
    await queryRunner.query(`
      CREATE TABLE course_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        registered_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (student_id, course_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_student_courses ON course_registrations(student_id)
    `);

    // Create grades table
    await queryRunner.query(`
      CREATE TABLE grades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
        letter_grade VARCHAR(2) NOT NULL,
        grade_point DECIMAL(3,2) NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (student_id, course_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_student_grades ON grades(student_id)
    `);

    // Create semester_results table
    await queryRunner.query(`
      CREATE TABLE semester_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        session VARCHAR(20) NOT NULL,
        semester VARCHAR(20) NOT NULL,
        gpa DECIMAL(3,2) NOT NULL,
        cgpa DECIMAL(3,2) NOT NULL,
        total_credits INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (student_id, session, semester)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_student_results ON semester_results(student_id)
    `);

    // Create fee_structures table
    await queryRunner.query(`
      CREATE TABLE fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        session VARCHAR(20) NOT NULL,
        level INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (university_id, session, level)
      )
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        session VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) NOT NULL CHECK (status IN ('unpaid', 'partially_paid', 'fully_paid')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (student_id, session)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_student_invoices ON invoices(student_id)
    `);

    // Create announcements table
    await queryRunner.query(`
      CREATE TABLE announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_roles TEXT[],
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_university_announcements ON announcements(university_id, created_at)
    `);

    // Create whatsapp_messages table
    await queryRunner.query(`
      CREATE TABLE whatsapp_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_status_retry ON whatsapp_messages(status, retry_count)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to handle foreign key constraints
    await queryRunner.query(`DROP TABLE IF EXISTS whatsapp_messages CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS announcements CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS invoices CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS fee_structures CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS semester_results CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS grades CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS course_registrations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS students CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS universities CASCADE`);
  }
}
