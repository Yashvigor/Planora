-- Planora Database Schema
-- Extracted directly from the active PostgreSQL database.

CREATE TABLE IF NOT EXISTS activitylog (
    log_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    project_id uuid,
    action character varying(255) NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    doc_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid,
    uploaded_by uuid,
    name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_type character varying(50),
    file_size character varying(50),
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    rejection_reason text
);

CREATE TABLE IF NOT EXISTS lands (
    land_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255),
    area character varying(100),
    type character varying(100),
    latitude numeric,
    longitude numeric,
    documents_path text,
    verification_status character varying(50) DEFAULT 'Pending'::character varying,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    message_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid,
    sender_id uuid,
    receiver_id uuid,
    text text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    related_id character varying(255)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    amount numeric NOT NULL,
    description text,
    status character varying(50) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pendingprofessionals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    google_id character varying(255),
    category character varying(255),
    sub_category character varying(255),
    mobile_number character varying(50),
    address text,
    bio text,
    experience_years integer,
    specialization character varying(255),
    portfolio_url text,
    resume_path text,
    degree_path text,
    status character varying(50) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    rejection_reason text
);

CREATE TABLE IF NOT EXISTS professional_designs (
    id integer NOT NULL DEFAULT nextval('professional_designs_id_seq'::regclass),
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    title character varying(255) NOT NULL,
    category character varying(100),
    style character varying(100),
    client_name character varying(255),
    status character varying(50) DEFAULT 'draft'::character varying,
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professional_quotations (
    id integer NOT NULL DEFAULT nextval('professional_quotations_id_seq'::regclass),
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    client_id character varying(255),
    title character varying(255) NOT NULL,
    total_amount numeric DEFAULT 0.00,
    status character varying(50) DEFAULT 'draft'::character varying,
    valid_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_materials (
    id integer NOT NULL DEFAULT nextval('project_materials_id_seq'::regclass),
    professional_id character varying(255) NOT NULL,
    project_id character varying(255),
    name character varying(255) NOT NULL,
    category character varying(100),
    supplier character varying(255),
    unit character varying(50),
    unit_price numeric DEFAULT 0.00,
    quantity integer DEFAULT 0,
    total_price numeric DEFAULT 0.00,
    status character varying(50) DEFAULT 'in_stock'::character varying,
    image_url text,
    last_ordered date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projectassignments (
    assignment_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_role character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by uuid
);

CREATE TABLE IF NOT EXISTS projectphases (
    phase_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid,
    title character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying,
    start_date date,
    end_date date,
    sequence_order integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    project_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    land_owner_id uuid NOT NULL,
    land_id uuid,
    name character varying(255) NOT NULL,
    description text,
    budget numeric,
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id integer NOT NULL DEFAULT nextval('quotation_items_id_seq'::regclass),
    quotation_id integer,
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0.00,
    total_price numeric DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS siteprogress (
    progress_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid,
    updated_by uuid,
    note text,
    image_path text,
    alert_type character varying(50),
    status character varying(50) DEFAULT 'Pending'::character varying,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    task_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid,
    assigned_to uuid,
    assigned_by uuid,
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    status character varying(50) DEFAULT 'Pending'::character varying,
    image_path text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    category character varying(50),
    sub_category character varying(50),
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    mobile_number character varying(20),
    personal_id_document_path text,
    birthdate date,
    password_hash character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Pending'::character varying,
    address text,
    city text,
    state text,
    zip_code text,
    otp character varying(6),
    otp_expiry timestamp with time zone,
    google_id character varying(255),
    resume_path text,
    portfolio_url text,
    experience_years integer,
    specialization text,
    latitude numeric,
    longitude numeric,
    bio text,
    profile_completed boolean DEFAULT false,
    degree_path text
);

CREATE TABLE IF NOT EXISTS architect_drawings (
    drawing_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    architect_id uuid NOT NULL,
    project_id uuid,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Floor Plan',
    is_team_project BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_auctions (
    auction_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    bid_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_id uuid NOT NULL REFERENCES land_auctions(auction_id),
    bidder_id uuid NOT NULL REFERENCES users(user_id),
    amount numeric NOT NULL,
    status varchar(20) DEFAULT 'active',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
