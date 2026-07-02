import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Keep the index warm: re-crawl the stalest registered accounts periodically so
// new mints/receives show up without anyone opening a gallery first.
crons.interval('crawl stale accounts', { minutes: 5 }, internal.crawler.crawlStale, {});

export default crons;
