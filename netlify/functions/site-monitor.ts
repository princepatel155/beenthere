import { runHealthChecks } from '../../app/monitoring/checks';
export default async()=>{await runHealthChecks('scheduled');};
export const config={schedule:'*/30 * * * *'};
