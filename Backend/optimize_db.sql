CREATE INDEX IF NOT EXISTS idx_projects_land_owner_id ON projects(land_owner_id);
CREATE INDEX IF NOT EXISTS idx_projectassignments_project_id ON projectassignments(project_id);
CREATE INDEX IF NOT EXISTS idx_projectassignments_user_id ON projectassignments(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
