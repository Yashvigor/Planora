--
-- PostgreSQL database dump
--

\restrict Tle4DxF1SzHPoR1EUOG7m5N0JWE233W1DRqOAfMqqWyfPjTH6cFtc1l3T0MUQmk

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activitylog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activitylog (
    log_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    project_id uuid,
    action character varying(255) NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: architect; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.architect (
    architect_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: carpenter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carpenter (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: civilengineer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.civilengineer (
    engineer_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contractor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractor (
    contractor_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    doc_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    uploaded_by uuid,
    name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_type character varying(50),
    file_size character varying(50),
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


--
-- Name: electrician; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.electrician (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fabricationworker; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fabricationworker (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    building_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: falseceilingworker; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.falseceilingworker (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    building_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: interiordesigner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interiordesigner (
    designer_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    building_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: landowner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landowner (
    landowner_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    budget numeric(15,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: mason; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mason (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: painter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.painter (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    payment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    client_id uuid,
    vendor_id uuid,
    invoice_number character varying(100),
    amount numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying,
    due_date date,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Paid'::character varying, 'Partial'::character varying, 'Overdue'::character varying])::text[])))
);


--
-- Name: plumber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plumber (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: projectphases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projectphases (
    phase_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    title character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying,
    start_date date,
    end_date date,
    sequence_order integer,
    CONSTRAINT projectphases_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Active'::character varying, 'Completed'::character varying])::text[])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid,
    name character varying(200) NOT NULL,
    type character varying(100),
    location text,
    description text,
    budget numeric(15,2),
    market_value numeric(15,2),
    status character varying(50) DEFAULT 'Planning'::character varying,
    expected_completion date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['Planning'::character varying, 'Construction'::character varying, 'Finishing'::character varying, 'Completed'::character varying, 'On Hold'::character varying])::text[])))
);


--
-- Name: structuralengineer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.structuralengineer (
    engineer_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    building_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tileworker; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tileworker (
    worker_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100),
    project_name character varying(150),
    project_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    latitude numeric(10,8),
    longitude numeric(11,8),
    bio text,
    profile_completed boolean DEFAULT false,
    CONSTRAINT check_status CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT users_category_check CHECK (((category)::text = ANY ((ARRAY['Planning'::character varying, 'SiteWork'::character varying, 'Design and Finish'::character varying, 'Land Owner'::character varying, 'Admin'::character varying])::text[])))
);


--
-- Data for Name: activitylog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activitylog (log_id, user_id, project_id, action, details, created_at) FROM stdin;
290aadcf-c2e9-4328-9ad4-3abb7c880732	475423df-e843-4964-99c9-52b04dff2d56	\N	Profile Completed	User completed profile as undefined	2026-02-07 10:22:48.741756+05:30
e3ab14e2-260d-4a13-beee-2ce45bda1cd1	ee67e4cf-2af8-4065-88e0-ff0e0cec6242	\N	Profile Completed	User completed profile as undefined	2026-02-07 10:50:46.385927+05:30
04b05587-ec73-46b9-8f3b-d8f10013a3c7	8ab37c6b-5446-4c24-9f34-5b1eabb3d1ee	\N	Profile Completed	User completed profile as undefined	2026-02-07 11:42:40.140857+05:30
5ca3de0a-d78e-45db-b3bf-e720bdf1bbe8	d9aa9a11-f994-4000-975c-40eb3a9ef753	\N	Profile Completed	User completed profile as undefined	2026-02-09 17:06:55.371481+05:30
2ecb47fd-f6fe-4076-8e14-1e25ffc3df3a	413f2e6a-cf48-408b-99f1-ec9b0e763bbe	\N	Profile Completed	User completed profile as undefined	2026-02-09 18:51:10.311341+05:30
2993cb2f-0834-4cf8-b42c-d959a19552f4	413f2e6a-cf48-408b-99f1-ec9b0e763bbe	\N	Status Update	User status updated to Approved	2026-02-10 14:45:45.549326+05:30
73258e43-68a8-4730-9503-0a91b3427199	d9aa9a11-f994-4000-975c-40eb3a9ef753	\N	Status Update	User status updated to Rejected	2026-02-10 14:45:50.818853+05:30
bc4e601e-26d0-4d9e-a399-380c7d883b05	8ab37c6b-5446-4c24-9f34-5b1eabb3d1ee	\N	Status Update	User status updated to Approved	2026-02-10 14:45:52.659008+05:30
9c3ac286-7522-4fcc-a5ec-9fa29db2a607	475423df-e843-4964-99c9-52b04dff2d56	\N	Status Update	User status updated to Approved	2026-02-10 14:45:54.779321+05:30
7cc27959-1c69-42ee-9c2e-32333da5063b	ee67e4cf-2af8-4065-88e0-ff0e0cec6242	\N	Status Update	User status updated to Approved	2026-02-10 14:45:55.895344+05:30
d6fd1d11-544d-4857-8766-140586d7750b	44f165ef-f3d6-4131-9683-eabb07326695	\N	Profile Completed	User completed profile as undefined	2026-02-10 15:18:27.908701+05:30
\.


--
-- Data for Name: architect; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.architect (architect_id, user_id, name, project_name, project_type, address, created_at) FROM stdin;
\.


--
-- Data for Name: carpenter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carpenter (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: civilengineer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.civilengineer (engineer_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: contractor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contractor (contractor_id, user_id, name, project_name, project_type, address, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (doc_id, project_id, uploaded_by, name, file_path, file_type, file_size, status, created_at) FROM stdin;
\.


--
-- Data for Name: electrician; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.electrician (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: fabricationworker; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fabricationworker (worker_id, user_id, name, project_name, project_type, building_type, created_at) FROM stdin;
\.


--
-- Data for Name: falseceilingworker; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.falseceilingworker (worker_id, user_id, name, project_name, project_type, building_type, created_at) FROM stdin;
\.


--
-- Data for Name: interiordesigner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interiordesigner (designer_id, user_id, name, project_name, project_type, building_type, created_at) FROM stdin;
\.


--
-- Data for Name: landowner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.landowner (landowner_id, user_id, name, project_name, project_type, budget, created_at) FROM stdin;
\.


--
-- Data for Name: mason; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mason (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: painter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.painter (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (payment_id, project_id, client_id, vendor_id, invoice_number, amount, status, due_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: plumber; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plumber (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: projectphases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projectphases (phase_id, project_id, title, status, start_date, end_date, sequence_order) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (project_id, owner_id, name, type, location, description, budget, market_value, status, expected_completion, created_at) FROM stdin;
\.


--
-- Data for Name: structuralengineer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.structuralengineer (engineer_id, user_id, name, project_name, project_type, building_type, created_at) FROM stdin;
\.


--
-- Data for Name: tileworker; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tileworker (worker_id, user_id, name, project_name, project_type, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, category, sub_category, name, email, mobile_number, personal_id_document_path, birthdate, password_hash, created_at, updated_at, status, address, city, state, zip_code, otp, otp_expiry, google_id, resume_path, portfolio_url, experience_years, specialization, latitude, longitude, bio, profile_completed) FROM stdin;
44f165ef-f3d6-4131-9683-eabb07326695	Design and Finish	Interior Designer	nishra	24ce031@charusat.edu.in	8140532610	\N	\N	$2b$10$4dC3YB8ggTerBaqiMkNqVOyLXkWU3xjbj0L5KNNXm48D0XE4l3pRW	2026-02-10 15:18:03.143571+05:30	2026-02-10 15:18:28.143091+05:30	Pending	CHanga	\N	\N	\N	\N	\N	\N	\N	\N	34	Mordern Architect	22.60016298	72.81983933	\N	t
413f2e6a-cf48-408b-99f1-ec9b0e763bbe	SiteWork	Painter	Trusha Patel	trushapatel2905@gmail.com	8140532610	\N	\N	$2b$10$lDO1LZgBDS/NrUJ34JmTRec1LNIsOinlVdRG9hJTonRbx5FnRlorq	2026-02-09 18:50:39.265864+05:30	2026-02-10 14:45:45.538659+05:30	Approved	Godhra	\N	\N	\N	\N	\N	\N	\N	\N	2	Plumber	22.60163755	72.81761640	I am a Plumber	t
d9aa9a11-f994-4000-975c-40eb3a9ef753	Design and Finish	Fabrication Worker	Kalp Gor	24ce037@charusat.edu.in	8140532610	uploads/General/1770637043408-Unit-4_PPT.pdf	2026-02-11	$2b$10$yU9fofc1iqKgtoZsqMbR4.a1jc4kGVT4mbkzexXMqBC/GHnhMUFYO	2026-02-09 17:06:02.873863+05:30	2026-02-10 14:45:50.812404+05:30	Rejected	68/D, Anjali Park, Mahakali Mandir road, Mahavirnagar, Himmatnagar	Himmatnagar	Gujarat	383001	\N	\N	\N	\N	\N	6	fabrication worker	22.60173339	72.81754385	I am a fabricator	t
8ab37c6b-5446-4c24-9f34-5b1eabb3d1ee	Planning	Architect	Sandip Gor	yashvigor2606@gmail.com	8140532610	\N	\N	$2b$10$hJ2g.5IsV2KXJEXkbVcZFuHYIP0g9oi3bWQ/oE7GXesi.pW.8bks2	2026-02-07 11:42:01.242265+05:30	2026-02-10 14:45:52.652497+05:30	Approved	Charotar University of Science and Technology	Anand	Gujarat	\N	\N	\N	\N	\N	\N	12	Architect	22.56450000	72.92890000	Construction enthusiast and project manager.	t
475423df-e843-4964-99c9-52b04dff2d56	Planning	Architect	Kalp Gor	kalpgor06@gmail.com	8140532610	\N	\N	$2b$10$3RSPnFTvKVdgmDKaNaCDYuHnH24CpxPkjydhrTC.0tmwS/JirIOnu	2026-02-07 09:56:53.359804+05:30	2026-02-10 14:45:54.776624+05:30	Approved	1/A, Anjali Park, Mahakali Mandir Road,Mahavirnagar, Himmatnagar	Himmatnagar	\N	\N	\N	\N	\N	uploads/General/1770439967338-24CE037_Bronze.pdf	https://github.com/Yashvigor	12	Architect	23.59796900	72.96981700	Experienced Architect in Himmatnagar	t
ee67e4cf-2af8-4065-88e0-ff0e0cec6242	Land Owner	Land Owner	Yashvi gor	yashvigor.ce@gmail.com	8140532610	\N	\N	$2b$10$e0FwsGMEwZEaU2Pl///KmO1egGJlMrktJj9lguBUcPxaMJ2JWRmHu	2026-02-05 17:51:42.012716+05:30	2026-02-10 17:20:01.046696+05:30	Approved	68/D, Anjali Park, Mahakali Mandir Road, Mahavirnagar, Himmatnagar	Himmatnagar	Gujarat	383001	\N	\N	\N	\N	\N	34	Land owner	22.60169529	72.81728541	I am a lo	t
\.


--
-- Name: activitylog activitylog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activitylog
    ADD CONSTRAINT activitylog_pkey PRIMARY KEY (log_id);


--
-- Name: architect architect_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.architect
    ADD CONSTRAINT architect_pkey PRIMARY KEY (architect_id);


--
-- Name: architect architect_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.architect
    ADD CONSTRAINT architect_user_id_key UNIQUE (user_id);


--
-- Name: carpenter carpenter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carpenter
    ADD CONSTRAINT carpenter_pkey PRIMARY KEY (worker_id);


--
-- Name: carpenter carpenter_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carpenter
    ADD CONSTRAINT carpenter_user_id_key UNIQUE (user_id);


--
-- Name: civilengineer civilengineer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civilengineer
    ADD CONSTRAINT civilengineer_pkey PRIMARY KEY (engineer_id);


--
-- Name: civilengineer civilengineer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civilengineer
    ADD CONSTRAINT civilengineer_user_id_key UNIQUE (user_id);


--
-- Name: contractor contractor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_pkey PRIMARY KEY (contractor_id);


--
-- Name: contractor contractor_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_user_id_key UNIQUE (user_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (doc_id);


--
-- Name: electrician electrician_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrician
    ADD CONSTRAINT electrician_pkey PRIMARY KEY (worker_id);


--
-- Name: electrician electrician_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrician
    ADD CONSTRAINT electrician_user_id_key UNIQUE (user_id);


--
-- Name: fabricationworker fabricationworker_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fabricationworker
    ADD CONSTRAINT fabricationworker_pkey PRIMARY KEY (worker_id);


--
-- Name: fabricationworker fabricationworker_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fabricationworker
    ADD CONSTRAINT fabricationworker_user_id_key UNIQUE (user_id);


--
-- Name: falseceilingworker falseceilingworker_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.falseceilingworker
    ADD CONSTRAINT falseceilingworker_pkey PRIMARY KEY (worker_id);


--
-- Name: falseceilingworker falseceilingworker_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.falseceilingworker
    ADD CONSTRAINT falseceilingworker_user_id_key UNIQUE (user_id);


--
-- Name: interiordesigner interiordesigner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interiordesigner
    ADD CONSTRAINT interiordesigner_pkey PRIMARY KEY (designer_id);


--
-- Name: interiordesigner interiordesigner_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interiordesigner
    ADD CONSTRAINT interiordesigner_user_id_key UNIQUE (user_id);


--
-- Name: landowner landowner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landowner
    ADD CONSTRAINT landowner_pkey PRIMARY KEY (landowner_id);


--
-- Name: landowner landowner_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landowner
    ADD CONSTRAINT landowner_user_id_key UNIQUE (user_id);


--
-- Name: mason mason_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mason
    ADD CONSTRAINT mason_pkey PRIMARY KEY (worker_id);


--
-- Name: mason mason_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mason
    ADD CONSTRAINT mason_user_id_key UNIQUE (user_id);


--
-- Name: painter painter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painter
    ADD CONSTRAINT painter_pkey PRIMARY KEY (worker_id);


--
-- Name: painter painter_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painter
    ADD CONSTRAINT painter_user_id_key UNIQUE (user_id);


--
-- Name: payments payments_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_number_key UNIQUE (invoice_number);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: plumber plumber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plumber
    ADD CONSTRAINT plumber_pkey PRIMARY KEY (worker_id);


--
-- Name: plumber plumber_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plumber
    ADD CONSTRAINT plumber_user_id_key UNIQUE (user_id);


--
-- Name: projectphases projectphases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projectphases
    ADD CONSTRAINT projectphases_pkey PRIMARY KEY (phase_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- Name: structuralengineer structuralengineer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structuralengineer
    ADD CONSTRAINT structuralengineer_pkey PRIMARY KEY (engineer_id);


--
-- Name: structuralengineer structuralengineer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structuralengineer
    ADD CONSTRAINT structuralengineer_user_id_key UNIQUE (user_id);


--
-- Name: tileworker tileworker_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tileworker
    ADD CONSTRAINT tileworker_pkey PRIMARY KEY (worker_id);


--
-- Name: tileworker tileworker_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tileworker
    ADD CONSTRAINT tileworker_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_users_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_category ON public.users USING btree (category);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: activitylog activitylog_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activitylog
    ADD CONSTRAINT activitylog_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: activitylog activitylog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activitylog
    ADD CONSTRAINT activitylog_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: architect architect_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.architect
    ADD CONSTRAINT architect_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: carpenter carpenter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carpenter
    ADD CONSTRAINT carpenter_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: civilengineer civilengineer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.civilengineer
    ADD CONSTRAINT civilengineer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: contractor contractor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor
    ADD CONSTRAINT contractor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: documents documents_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: electrician electrician_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrician
    ADD CONSTRAINT electrician_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: fabricationworker fabricationworker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fabricationworker
    ADD CONSTRAINT fabricationworker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: falseceilingworker falseceilingworker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.falseceilingworker
    ADD CONSTRAINT falseceilingworker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: interiordesigner interiordesigner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interiordesigner
    ADD CONSTRAINT interiordesigner_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: landowner landowner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landowner
    ADD CONSTRAINT landowner_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: mason mason_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mason
    ADD CONSTRAINT mason_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: painter painter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.painter
    ADD CONSTRAINT painter_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: payments payments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id);


--
-- Name: payments payments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: payments payments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.users(user_id);


--
-- Name: plumber plumber_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plumber
    ADD CONSTRAINT plumber_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: projectphases projectphases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projectphases
    ADD CONSTRAINT projectphases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: structuralengineer structuralengineer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structuralengineer
    ADD CONSTRAINT structuralengineer_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: tileworker tileworker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tileworker
    ADD CONSTRAINT tileworker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Tle4DxF1SzHPoR1EUOG7m5N0JWE233W1DRqOAfMqqWyfPjTH6cFtc1l3T0MUQmk

