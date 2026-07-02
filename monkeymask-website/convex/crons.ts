import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Refresh explore site previews weekly (og:image / favicon).
crons.interval('refresh explore icons', { hours: 168 }, internal.exploreSites.refreshAllIcons, {});

export default crons;
