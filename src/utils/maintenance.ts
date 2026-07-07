export function isMaintenanceMode(): boolean {
  const clientFlag = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  const serverFlag = process.env.MAINTENANCE_MODE;
  return clientFlag === 'true' || serverFlag === 'true';
}

