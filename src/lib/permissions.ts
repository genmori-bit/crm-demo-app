// Permission keys: resource.action format
export const PERMISSIONS = {
  // Companies
  COMPANY_VIEW: "company.view",
  COMPANY_CREATE: "company.create",
  COMPANY_EDIT: "company.edit",
  COMPANY_DELETE: "company.delete",
  COMPANY_EXPORT: "company.export",

  // Contacts
  CONTACT_VIEW: "contact.view",
  CONTACT_CREATE: "contact.create",
  CONTACT_EDIT: "contact.edit",
  CONTACT_DELETE: "contact.delete",

  // Deals
  DEAL_VIEW: "deal.view",
  DEAL_CREATE: "deal.create",
  DEAL_EDIT: "deal.edit",
  DEAL_DELETE: "deal.delete",
  DEAL_EXPORT: "deal.export",

  // Activities
  ACTIVITY_VIEW: "activity.view",
  ACTIVITY_CREATE: "activity.create",
  ACTIVITY_EDIT: "activity.edit",
  ACTIVITY_DELETE: "activity.delete",

  // Tasks
  TASK_VIEW: "task.view",
  TASK_CREATE: "task.create",
  TASK_EDIT: "task.edit",
  TASK_DELETE: "task.delete",

  // Reports
  REPORT_VIEW: "report.view",
  REPORT_CREATE: "report.create",
  REPORT_EDIT: "report.edit",
  REPORT_DELETE: "report.delete",

  // Dashboards
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_CREATE: "dashboard.create",
  DASHBOARD_EDIT: "dashboard.edit",
  DASHBOARD_DELETE: "dashboard.delete",

  // Marketing Automation
  MA_VIEW: "ma.view",
  MA_PROSPECT_VIEW: "ma.prospect.view",
  MA_PROSPECT_EDIT: "ma.prospect.edit",
  MA_EMAIL_VIEW: "ma.email.view",
  MA_EMAIL_SEND: "ma.email.send",
  MA_FORM_VIEW: "ma.form.view",
  MA_FORM_EDIT: "ma.form.edit",
  MA_PROGRAM_VIEW: "ma.program.view",
  MA_PROGRAM_EDIT: "ma.program.edit",

  // Settings / Admin
  SETUP_VIEW: "setup.view",
  SETUP_USER_VIEW: "setup.user.view",
  SETUP_USER_CREATE: "setup.user.create",
  SETUP_USER_EDIT: "setup.user.edit",
  SETUP_USER_DISABLE: "setup.user.disable",
  SETUP_ROLE_MANAGE: "setup.role.manage",
  SETUP_PROFILE_MANAGE: "setup.profile.manage",
  SETUP_PERMISSION_SET_MANAGE: "setup.permissionset.manage",
  SETUP_TEAM_MANAGE: "setup.team.manage",
  SETUP_APP_ACCESS_MANAGE: "setup.appaccess.manage",
  SETUP_SECURITY_MANAGE: "setup.security.manage",
  SETUP_AUDIT_VIEW: "setup.audit.view",
  SETUP_ORG_MANAGE: "setup.org.manage",

  // Data Management
  DATA_IMPORT: "data.import",
  DATA_EXPORT: "data.export",
  DATA_TAGS_MANAGE: "data.tags.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Profiles with their base permissions
export const SYSTEM_PROFILE_PERMISSIONS: Record<string, PermissionKey[]> = {
  SYSTEM_ADMIN: Object.values(PERMISSIONS) as PermissionKey[],
  ADMIN: [
    "company.view", "company.create", "company.edit", "company.delete", "company.export",
    "contact.view", "contact.create", "contact.edit", "contact.delete",
    "deal.view", "deal.create", "deal.edit", "deal.delete", "deal.export",
    "activity.view", "activity.create", "activity.edit", "activity.delete",
    "task.view", "task.create", "task.edit", "task.delete",
    "report.view", "report.create", "report.edit", "report.delete",
    "dashboard.view", "dashboard.create", "dashboard.edit", "dashboard.delete",
    "ma.view", "ma.prospect.view", "ma.prospect.edit", "ma.email.view", "ma.email.send",
    "ma.form.view", "ma.form.edit", "ma.program.view", "ma.program.edit",
    "setup.view", "setup.user.view", "setup.user.create", "setup.user.edit", "setup.user.disable",
    "setup.role.manage", "setup.profile.manage", "setup.permissionset.manage",
    "setup.team.manage", "setup.appaccess.manage", "setup.security.manage",
    "setup.audit.view", "setup.org.manage",
    "data.import", "data.export", "data.tags.manage",
  ] as PermissionKey[],
  MANAGER: [
    "company.view", "company.create", "company.edit", "company.export",
    "contact.view", "contact.create", "contact.edit",
    "deal.view", "deal.create", "deal.edit", "deal.export",
    "activity.view", "activity.create", "activity.edit",
    "task.view", "task.create", "task.edit",
    "report.view", "report.create", "report.edit",
    "dashboard.view", "dashboard.create", "dashboard.edit",
    "ma.view", "ma.prospect.view", "ma.prospect.edit", "ma.email.view",
    "ma.form.view", "ma.program.view",
    "setup.view", "setup.user.view", "setup.team.manage", "setup.audit.view",
    "data.import", "data.export", "data.tags.manage",
  ] as PermissionKey[],
  SALES: [
    "company.view", "company.create", "company.edit",
    "contact.view", "contact.create", "contact.edit",
    "deal.view", "deal.create", "deal.edit",
    "activity.view", "activity.create", "activity.edit",
    "task.view", "task.create", "task.edit",
    "report.view",
    "dashboard.view",
    "ma.view", "ma.prospect.view",
  ] as PermissionKey[],
};
