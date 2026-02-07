import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMockApp } from '../hooks/useMockApp';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

// Public Pages
import LandingPage from '../pages/LandingPage';
import Auth from '../pages/Auth';
import ComingSoon from '../components/ComingSoon';

// Dashboard Pages
import ClientDashboard from '../pages/dashboard/Client/LandOwnerDashboard';
import MyLands from '../pages/dashboard/Client/MyLands';
import MyProjects from '../pages/dashboard/Client/MyProjects';
import FindProfessionals from '../pages/dashboard/Client/FindProfessionals';

// Planning
import ArchitectDashboard from '../pages/dashboard/Planning/ArchitectDashboard';
import CivilEngineerDashboard from '../pages/dashboard/Engineer/CivilEngineerDashboard';
import StructuralDashboard from '../pages/dashboard/Planning/StructuralDashboard';

// Design & Finish
import FinishingDashboard from '../pages/dashboard/Design/FinishingDashboard';
import InteriorDashboard from '../pages/dashboard/Design/InteriorDashboard';

// Site
import WorkerDashboard from '../pages/dashboard/Site/WorkerDashboard';
import TileWorkerDashboard from '../pages/dashboard/Site/TileWorkerDashboard';
import PainterDashboard from '../pages/dashboard/Site/PainterDashboard';

// Admin
import AdminOverview from '../pages/dashboard/Admin/AdminDashboard';
import DocumentVerification from '../pages/dashboard/Admin/DocumentVerification';

// Common
import Settings from '../pages/dashboard/Common/Settings';
import Messages from '../pages/dashboard/Common/Messages';
import ProjectWorkspace from '../pages/dashboard/Common/ProjectWorkspace';
import Documents from '../pages/dashboard/Common/Documents';
import Verifications from '../pages/dashboard/Common/Verifications';
import Payments from '../pages/dashboard/Common/Payments';

// Design Pages
import Materials from '../pages/dashboard/Design/Materials';
import Designs from '../pages/dashboard/Design/Designs';

const AppRoutes = () => {
    const { currentUser } = useMockApp();

    const renderDashboardByRole = () => {
        if (!currentUser) return <Navigate to="/login" replace />;

        switch (currentUser.role) {
            case 'land_owner': return <ClientDashboard />;

            // Planning
            case 'architect': return <ArchitectDashboard />;
            case 'civil_engineer': return <CivilEngineerDashboard />;
            case 'structural_engineer': return <StructuralDashboard />;

            // Design & Finish
            case 'interior_designer':
            case 'false_ceiling':
            case 'fabrication':
                return <FinishingDashboard />;

            // Site Workers (Specific)
            case 'tile_fixer': return <TileWorkerDashboard />;
            case 'painter': return <PainterDashboard />;

            // Site Workers (Common)
            case 'site_supervisor':
            case 'mason':
            case 'electrician':
            case 'plumber':
            case 'carpenter':
                return <WorkerDashboard roleType={currentUser.role.replace('_', ' ')} />;

            // Admin
            case 'admin': return <AdminOverview />;

            default:
                return <ComingSoon title="Workspace Setup" message={`Configuring environment for ${currentUser.role}...`} />;
        }
    };

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={currentUser ? <DashboardLayout /> : <Navigate to="/login" />}>
                <Route index element={renderDashboardByRole()} />

                {/* Common Routes - Available to ALL roles */}
                <Route path="verifications" element={<Verifications />} />
                <Route path="documents" element={<Documents />} />
                <Route path="messages" element={<Messages />} />
                <Route path="payments" element={<Payments />} />
                <Route path="settings" element={<Settings />} />
                <Route path="project/:id" element={<ProjectWorkspace />} />

                {/* Role Specific Routes */}
                {currentUser?.role === 'land_owner' && (
                    <>
                        <Route path="lands" element={<MyLands />} />
                        <Route path="projects" element={<MyProjects />} />
                        <Route path="find-pros" element={<FindProfessionals />} />
                    </>
                )}

                {currentUser?.role === 'admin' && (
                    <>
                        <Route path="verifications" element={<DocumentVerification />} />
                        <Route path="users" element={<AdminOverview initialSection="verify_users" />} />
                        <Route path="projects" element={<AdminOverview initialSection="verify_projects" />} />
                    </>
                )}

                {/* Placeholders for Future Modules */}
                <Route path="drawings" element={<ComingSoon title="Blueprints & Drawings" />} />
                <Route path="design-status" element={<ComingSoon title="Design Status" />} />
                <Route path="approvals" element={<ComingSoon title="Regulatory Approvals" />} />
                <Route path="materials" element={<Materials />} />
                <Route path="designs" element={<Designs />} />
                <Route path="quotations" element={<ComingSoon title="Quotations" />} />
                <Route path="workboard" element={<ComingSoon title="Work Board" />} />
                <Route path="tasks" element={<ComingSoon title="Task Management" />} />
                <Route path="reports" element={<ComingSoon title="Site Reports" />} />
                <Route path="users" element={<ComingSoon title="User Management" />} />
                <Route path="schedule" element={<ComingSoon title="Project Timeline" />} />

                <Route path="*" element={<ComingSoon title="404" message="Resource not found." />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
