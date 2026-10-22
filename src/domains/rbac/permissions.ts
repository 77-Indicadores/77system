export const ROUTE_PERMISSIONS = {
  "/super77": "super77.access",
  "/super77/catworld": "integrations.catworld.view",
  "/super77/data": "system.jobs.view",
  "/super77/acessos": "super77.access",
  "/users": "users.manage",
  "/api/users": "users.manage",
  "/api/catworld": "integrations.catworld.view",
  "/api/jobs": "system.jobs.view",
  "/api/data": "system.jobs.view",
  "/api/data/refresh": "system.jobs.manage",
  "/api/exports": "exports.excel.create",
  "/api/screen-views": "indicators.dashboard.view",
  "/api/user-activity": "indicators.dashboard.view",
  "/api/acessos/json": "super77.access"
} as const;

export type PermissionKey = (typeof ROUTE_PERMISSIONS)[keyof typeof ROUTE_PERMISSIONS] | string;
