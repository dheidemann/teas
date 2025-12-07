import {
  pagesPrintedTotal,
  pagesLastPrintTimestamp,
  printJobsTotal,
  printJobPages,
} from "./metrics";

export function recordPrintEvent({
  username,
  pages,
  jobid,
  success,
}: {
  username: string;
  pages: number;
  jobid: string;
  success: boolean;
}) {
  pagesPrintedTotal.labels(username, jobid).inc(pages);
  pagesLastPrintTimestamp.labels(username, jobid).set(new Date().getTime());
  printJobsTotal.labels(username, jobid, success ? "success" : "fail").inc(1);
  printJobPages.labels(username, jobid).observe(pages);
}
