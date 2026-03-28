-- Planora Database Schema
-- Complete and Up-to-Date for New Environment Creation
-- Includes all geographical, project phase, and rating system extensions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Management
CREATE TABLE IF NOT EXISTS users (
    user_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255),
    google_id character varying(255),
    category character varying(50), -- 'land_owner', 'professional', 'admin'
    sub_category character varying(50), -- 'Contractor', 'Architect', 'Painter', etc.
    mobile_number character varying(20),
    personal_id_document_path text,
    birthdate date,
    bio text,
    address text,
    city text,
    state text,
    zip_code text,
    latitude numeric,
    longitude numeric,
    profile_completed boolean DEFAULT false,
    resume_path text,
    portfolio_url text,
    experience_years integer,
    specialization text,
    degree_path text,
    otp character varying(6),
    otp_expiry timestamp with time zone,
    status character varying(20) DEFAULT 'Pending',
    rejection_reason text,
    appeal_reason text,
    appeal_document_path text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Professional Onboarding
CREATE TABLE IF NOT EXISTS pendingprofessionals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    google_id character varying(255),
    category character varying(255),
    sub_category character varying(255),
    mobile_number character varying(50),
    address text,
    city text,
    state text,
    zip_code text,
    latitude numeric,
    longitude numeric,
    bio text,
    experience_years integer,
    specialization character varying(255),
    portfolio_url text,
    resume_path text,
    degree_path text,
    status character varying(50) DEFAULT 'Pending',
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Land and Real Estate
CREATE TABLE IF NOT EXISTS lands (
    land_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES users(user_id),
    name character varying(255) NOT NULL,
    location character varying(255),
    area character varying(100),
    type character varying(100),
    latitude numeric,
    longitude numeric,
    documents_path text,
    verification_status character varying(50) DEFAULT 'Pending',
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Project Management
CREATE TABLE IF NOT EXISTS projects (
    project_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    land_owner_id uuid NOT NULL REFERENCES users(user_id),
    land_id uuid REFERENCES lands(land_id),
    name character varying(255) NOT NULL,
    description text,
    budget numeric,
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'Pending',
    planning_completed boolean DEFAULT false,
    design_completed boolean DEFAULT false,
    execution_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Project Assignments/Teams
CREATE TABLE IF NOT EXISTS projectassignments (
    assignment_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(project_id),
    user_id uuid NOT NULL REFERENCES users(user_id),
    assigned_role character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'Pending',
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by uuid REFERENCES users(user_id),
    UNIQUE(project_id, user_id)
);

-- Project Site Progress
CREATE TABLE IF NOT EXISTS siteprogress (
    progress_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES projects(project_id),
    updated_by uuid REFERENCES users(user_id),
    note text,
    image_path text,
    alert_type character varying(50),
    status character varying(50) DEFAULT 'Pending',
    rejection_reason text,
    personal_id_document_path text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    task_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES projects(project_id),
    assigned_to uuid REFERENCES users(user_id),
    assigned_by uuid REFERENCES users(user_id),
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    status character varying(50) DEFAULT 'Pending',
    image_path text,
    rejection_reason text,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Ratings/Appraisals
CREATE TABLE IF NOT EXISTS ratings (
    rating_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES projects(project_id),
    rater_id uuid REFERENCES users(user_id),
    rated_user_id uuid REFERENCES users(user_id),
    rating integer CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Documents Repository
CREATE TABLE IF NOT EXISTS documents (
    doc_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES projects(project_id),
    uploaded_by uuid REFERENCES users(user_id),
    name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_type character varying(50),
    file_size character varying(50),
    status character varying(20) DEFAULT 'Pending',
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Communications
CREATE TABLE IF NOT EXISTS messages (
    message_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES projects(project_id),
    sender_id uuid REFERENCES users(user_id),
    receiver_id uuid REFERENCES users(user_id),
    text text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(user_id),
    type character varying(50) NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    related_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(project_id),
    sender_id uuid REFERENCES users(user_id),
    receiver_id uuid REFERENCES users(user_id),
    amount numeric NOT NULL,
    type character varying(50) DEFAULT 'adhoc',
    description text,
    notes text,
    reference_id character varying(255),
    proof_image_path text,
    status character varying(50) DEFAULT 'Pending',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Professional Sub-Systems
CREATE TABLE IF NOT EXISTS professional_designs (
    id SERIAL PRIMARY KEY,
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    title character varying(255) NOT NULL,
    category character varying(100),
    style character varying(100),
    client_name character varying(255),
    status character varying(50) DEFAULT 'draft',
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professional_quotations (
    id SERIAL PRIMARY KEY,
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    client_id character varying(255),
    title character varying(255) NOT NULL,
    total_amount numeric DEFAULT 0.00,
    status character varying(50) DEFAULT 'draft',
    valid_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id integer REFERENCES professional_quotations(id),
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0.00,
    total_price numeric DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS project_materials (
    id SERIAL PRIMARY KEY,
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    name character varying(255) NOT NULL,
    category character varying(100),
    supplier character varying(255),
    unit character varying(50),
    unit_price numeric DEFAULT 0.00,
    quantity integer DEFAULT 0,
    total_price numeric DEFAULT 0.00,
    status character varying(50) DEFAULT 'in_stock',
    image_url text,
    last_ordered date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS architect_drawings (
    drawing_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    architect_id uuid NOT NULL REFERENCES users(user_id),
    project_id uuid REFERENCES projects(project_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Floor Plan',
    is_team_project BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auctions (Extension)
CREATE TABLE IF NOT EXISTS land_auctions (
    auction_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    land_id uuid NOT NULL REFERENCES lands(land_id),
    owner_id uuid NOT NULL REFERENCES users(user_id),
    base_price numeric NOT NULL,
    reserve_price numeric,
    current_highest_bid numeric DEFAULT 0,
    status varchar(20) DEFAULT 'active',
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    bid_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_id uuid NOT NULL REFERENCES land_auctions(auction_id),
    bidder_id uuid NOT NULL REFERENCES users(user_id),
    amount numeric NOT NULL,
    status varchar(20) DEFAULT 'active',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activitylog (
    log_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES users(user_id),
    project_id uuid REFERENCES projects(project_id),
    action character varying(255) NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
