-- Database Schema for Planora
-- Using PostgreSQL

-- Enable UUID extension if needed usually good for IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Contains basic details for all users.
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Planning', 'SiteWork', 'Design and Finish', 'Land Owner', 'Admin')),
    sub_category VARCHAR(50), -- Can be same as category for Land/Admin, or specific role name
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    personal_id_document_path TEXT,
    birthdate DATE,
    bio TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    otp VARCHAR(10),
    otp_expiry TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    latitude DECIMAL(10, 8), -- Added for GPS mapping
    longitude DECIMAL(11, 8), -- Added for GPS mapping
    resume_path TEXT,
    portfolio_url TEXT,
    experience_years INT,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_category ON Users(category);

-- 2. Role Specific Tables (Profile Extensions)
-- These tables link 1:1 to Users via user_id.

-- LandOwner Table
CREATE TABLE LandOwner (
    landowner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    budget DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Architect Table
CREATE TABLE Architect (
    architect_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Structural Engineer Table
CREATE TABLE StructuralEngineer (
    engineer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    building_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Civil Engineer Table
CREATE TABLE CivilEngineer (
    engineer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interior Designer Table
CREATE TABLE InteriorDesigner (
    designer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    building_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- False Ceiling Worker Table
CREATE TABLE FalseCeilingWorker (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    building_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fabrication Worker Table
CREATE TABLE FabricationWorker (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    building_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mason Table
CREATE TABLE Mason (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Electrician Table
CREATE TABLE Electrician (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plumber Table
CREATE TABLE Plumber (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carpenter Table
CREATE TABLE Carpenter (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tile Worker (Tile Fixer) Table
CREATE TABLE TileWorker (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Painter Table
CREATE TABLE Painter (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100), -- Name from Users
    project_name VARCHAR(150),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects Management
CREATE TABLE Projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    location TEXT,
    description TEXT,
    budget DECIMAL(15, 2),
    market_value DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'Planning' CHECK (status IN ('Planning', 'Construction', 'Finishing', 'Completed', 'On Hold')),
    expected_completion DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documents Table (General Storage)
CREATE TABLE Documents (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES Projects(project_id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES Users(user_id),
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payments/Invoices Table (Simplified for Manual tracking)
CREATE TABLE Payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES Projects(project_id) ON DELETE CASCADE,
    client_id UUID REFERENCES Users(user_id),
    vendor_id UUID REFERENCES Users(user_id),
    invoice_number VARCHAR(100) UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue')),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Project Timeline Phases
CREATE TABLE ProjectPhases (
    phase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES Projects(project_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed')),
    start_date DATE,
    end_date DATE,
    sequence_order INT
);

-- 8. Project Assignments Table (Teams)
CREATE TABLE ProjectAssignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES Projects(project_id) ON DELETE CASCADE,
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    assigned_role VARCHAR(50), -- Role in this specific project
    status VARCHAR(20) DEFAULT 'Active',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);
-- 9. Activity Logs Table
CREATE TABLE ActivityLog (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    project_id UUID REFERENCES Projects(project_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
