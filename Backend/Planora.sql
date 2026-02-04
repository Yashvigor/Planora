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
    password_hash VARCHAR(255) NOT NULL,
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