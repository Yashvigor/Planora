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

// Design & Finish
import AuctionHouse from '../pages/marketplace/AuctionHouse';

// Site
import ContractorDashboard from '../pages/dashboard/Contractor/ContractorDashboard';
import WorkerDashboard from '../pages/dashboard/Site/WorkerDashboard';

// Admin
import AdminOverview from '../pages/dashboard/Admin/AdminDashboard';
import DocumentVerification from '../pages/dashboard/Admin/DocumentVerification';

// Common
import Settings from '../pages/dashboard/Common/Settings';
import ProjectWorkspace from '../pages/dashboard/Common/ProjectWorkspace';
import Tasks from '../pages/dashboard/Common/Tasks';
import Documents from '../pages/dashboard/Common/Documents';
import Verifications from '../pages/dashboard/Common/Verifications';
import Payments from '../pages/dashboard/Common/Payments';
import Notifications from '../pages/dashboard/Common/Notifications';
import AccountDisabled from '../pages/dashboard/Common/AccountDisabled';
import PendingApproval from '../pages/dashboard/Common/PendingApproval';

// Design Pages
import Materials from '../pages/dashboard/Design/Materials';
import Designs from '../pages/dashboard/Design/Designs';
import Quotations from '../pages/dashboard/Design/Quotations';

const AppRoutes = () => {
    const { currentUser } = useMockApp();

    const cat = (currentUser?.category || '').toLowerCase();
    const subCat = (currentUser?.sub_category || '').toLowerCase();
    const rawRole = currentUser?.role ? currentUser.role.toLowerCase().replace(/ /g, '_') : '';
    const effectiveRole = rawRole || (subCat ? subCat.replace(/ /g, '_') : (cat ? cat.replace(/ /g, '_') : ''));

    const renderDashboardByRole = () => {
        if (!currentUser) return <Navigate to="/login" replace />;
        const userStatus = (currentUser.status || '').toLowerCase();
        if (userStatus === 'disabled') return <AccountDisabled />;

        const isExempt = ['land_owner', 'contractor', 'admin'].includes(effectiveRole);
        if (!isExempt && userStatus !== 'approved') {
            return <PendingApproval />;
        }

        switch (effectiveRole) {
            case 'land_owner': return <ClientDashboard />;
            case 'contractor': return <ContractorDashboard />;

            // All Professionals (Common Work Board)
            case 'architect':
            case 'civil_engineer':
            case 'interior_designer':
            case 'false_ceiling':
            case 'fabrication':
            case 'tile_fixer':
            case 'painter':
            case 'site_supervisor':
            case 'mason':
            case 'electrician':
            case 'plumber':
            case 'carpenter':
                return <WorkerDashboard roleType={effectiveRole} />;

            // Admin
            case 'admin': return <AdminOverview />;

            default:
                return <ComingSoon title="Workspace Setup" message={`Configuring environment for ${effectiveRole}...`} />;
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
                <Route path="payments" element={<Payments />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="project/:id" element={<ProjectWorkspace />} />

                {/* Role Specific Routes */}
                {(effectiveRole === 'land_owner' || effectiveRole === 'contractor') && (
                    <>
                        <Route path="lands" element={<MyLands />} />
                        <Route path="projects" element={<MyProjects />} />
                        <Route path="find-pros" element={<FindProfessionals />} />
                    </>
                )}

                {effectiveRole === 'admin' && (
                    <>
                        <Route path="verify-land" element={<AdminOverview initialSection="verify_land" />} />
                        <Route path="auction-requests" element={<AdminOverview initialSection="verify_auctions" />} />
                        <Route path="verify-accounts" element={<AdminOverview initialSection="verify_accounts" />} />
                        <Route path="professionals" element={<AdminOverview initialSection="professionals" />} />
                        <Route path="land-owners" element={<AdminOverview initialSection="land_owners" />} />
                        <Route path="projects" element={<AdminOverview initialSection="projects" />} />
                    </>
                )}

                {/* Placeholders for Future Modules */}
                <Route path="design-status" element={<ComingSoon title="Design Status" />} />
                <Route path="approvals" element={<ComingSoon title="Regulatory Approvals" />} />
                <Route path="materials" element={<Materials />} />
                <Route path="designs" element={<Designs />} />
                <Route path="quotations" element={<Quotations />} />
                <Route path="workboard" element={<ComingSoon title="Work Board" />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="reports" element={<ComingSoon title="Site Reports" />} />
                <Route path="users" element={<ComingSoon title="User Management" />} />
                <Route path="schedule" element={<ComingSoon title="Project Timeline" />} />
                <Route path="bidding" element={<AuctionHouse />} />

                <Route path="*" element={<ComingSoon title="404" message="Resource not found." />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
