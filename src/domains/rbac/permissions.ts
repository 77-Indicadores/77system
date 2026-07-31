export const ROUTE_PERMISSIONS = {
  "/super77": "super77.access",
  "/super77/catworld": "integrations.catworld.view",
  "/super77/data": "system.jobs.view",
  "/users": "super77.access",
  "/api/catworld": "integrations.catworld.view",
  "/api/jobs": "system.jobs.view",
  "/api/data": "system.jobs.view",
  "/api/data/refresh": "system.jobs.manage",
  "/api/exports": "exports.excel.create"
} as const;

export type PermissionKey = (typeof ROUTE_PERMISSIONS)[keyof typeof ROUTE_PERMISSIONS] | string;
