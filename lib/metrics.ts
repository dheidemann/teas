import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const pagesPrintedTotal = new client.Counter({
  name: "pages_printed_total",
  help: "Total number of pages printed by user",
  labelNames: ["username"],
});
const pagesLastPrintTimestamp = new client.Gauge({
  name: "pages_last_print_timestamp_seconds",
  help: "Unix timestamp of last print by user",
  labelNames: ["username"] 
});
const printJobsTotal = new client.Counter({
  name: "print_jobs_total",
  help: "Total number of print jobs per user and status",
  labelNames: ["username", "status"],
});
const printJobPages = new client.Histogram({
  name: "print_job_pages",
  help: "Distribution of pages per print job",
  labelNames: ["username"],
  buckets: [1, 5, 10, 20, 50, 100],
});

register.registerMetric(pagesPrintedTotal);
register.registerMetric(pagesLastPrintTimestamp);
register.registerMetric(printJobsTotal);
register.registerMetric(printJobPages);

export {
  register,
  pagesPrintedTotal,
  pagesLastPrintTimestamp,
  printJobsTotal,
  printJobPages,
};
