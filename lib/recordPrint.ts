import {
  pagesPrintedTotal,
  pagesLastPrintTimestamp,
  printJobsTotal,
  printJobPages,
} from "./metrics";

export function recordPrintEvent({
  username,
  pages,
  success,
}: {
  username: string;
  pages: number;
  success: boolean;
}) {
  pagesPrintedTotal.labels(username).inc(pages);
  pagesLastPrintTimestamp.labels(username).set(new Date().getTime());
  printJobsTotal.labels(username, success ? "success" : "fail").inc(1);
  printJobPages.labels(username).observe(pages);
}
