import type { Job, JobDetail } from "@/types/jobs/job";

export type JobCardData = Job | JobDetail;

export interface JobCardOptions {
  /** Used when `job.worker` is only an id (e.g. the create-job response). */
  workerName?: string;
  businessName?: string;
}

const COLLECTION_LABEL: Record<string, string> = {
  walk_in: "Walk-in",
  pickup: "Pickup",
  delivery: "Delivery",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: string | number): string {
  return `KES ${Number(value).toLocaleString()}`;
}

function qty(value: string): string {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtDateTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolveWorkerName(job: JobCardData, opts: JobCardOptions): string | null {
  if (opts.workerName) return opts.workerName;
  if (job.worker && typeof job.worker === "object") return job.worker.name;
  return null;
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<div class="row"><span class="label">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

export function renderJobCardHtml(job: JobCardData, opts: JobCardOptions = {}): string {
  const customer = job.customer;
  const vehicle = job.vehicle;
  const vehicleDesc = vehicle
    ? [vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" · ")
    : "";
  const workerName = resolveWorkerName(job, opts);
  const discount = Number(job.discount_amount);

  const items = (job.items ?? [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.service?.name ?? item.description ?? "Service")}</td>
          <td class="num">${escapeHtml(qty(item.quantity))}</td>
          <td class="num">${escapeHtml(money(item.line_total))}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Job Card ${escapeHtml(job.job_number)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 4mm; width: 80mm; font: 12px/1.4 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #000; background: #fff; }
  .center { text-align: center; }
  .business { font-size: 14px; font-weight: 700; }
  .title { font-size: 11px; letter-spacing: 2px; font-weight: 600; margin-top: 2px; }
  .number { font-size: 22px; font-weight: 800; margin: 4px 0 2px; }
  .muted { color: #444; font-size: 11px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row .label { color: #444; }
  .row span:last-child { text-align: right; font-weight: 600; }
  .plate { font-size: 16px; font-weight: 800; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; }
  td { padding: 3px 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; padding-left: 6px; }
  .total { font-size: 15px; font-weight: 800; }
  .notes { white-space: pre-wrap; }
</style>
</head>
<body>
  <div class="center">
    ${opts.businessName ? `<div class="business">${escapeHtml(opts.businessName)}</div>` : ""}
    <div class="title">JOB CARD</div>
    <div class="number">${escapeHtml(job.job_number)}</div>
    <div class="muted">${escapeHtml(fmtDateTime(job.created_at))}</div>
  </div>

  ${vehicle ? `<hr /><div class="center"><div class="plate">${escapeHtml(vehicle.plate_number)}</div>${vehicleDesc ? `<div class="muted">${escapeHtml(vehicleDesc)}</div>` : ""}</div>` : ""}

  <hr />
  ${row("Customer", customer?.name ?? null)}
  ${row("Phone", customer?.phone ?? null)}
  ${row("Contact", job.contact_phone)}
  ${row("Collection", COLLECTION_LABEL[job.collection_method] ?? job.collection_method)}
  ${row("Pickup address", job.pickup_address)}
  ${row("Worker", workerName)}

  <hr />
  <table>
    <thead><tr><th>Service</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead>
    <tbody>${items}</tbody>
  </table>

  <hr />
  ${discount > 0 ? row("Subtotal", money(job.subtotal)) + row("Discount", `- ${money(discount)}`) : ""}
  <div class="row total"><span>Total</span><span>${escapeHtml(money(job.total_amount))}</span></div>

  ${job.notes ? `<hr /><div class="muted">Notes</div><div class="notes">${escapeHtml(job.notes)}</div>` : ""}

  <hr />
  <div class="center muted">Present this card when collecting.</div>

</body>
</html>`;
}

/**
 * Prints an HTML document from a hidden iframe on the current page, so no new
 * tab or popup is opened. The iframe is removed once printing finishes.
 */
export function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    win.addEventListener("afterprint", cleanup);
    win.focus();
    win.print();
    // Fallback for browsers that don't fire afterprint
    setTimeout(cleanup, 60_000);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

export function printJobCard(job: JobCardData, opts?: JobCardOptions): void {
  printHtml(renderJobCardHtml(job, opts));
}

/**
 * One-shot hand-off so a job card can be printed after a client-side
 * navigation (e.g. create job → jobs list) instead of mid-route-change.
 */
let pendingJobCard: { job: JobCardData; opts?: JobCardOptions } | null = null;

export function queueJobCardPrint(job: JobCardData, opts?: JobCardOptions): void {
  pendingJobCard = { job, opts };
}

export function printQueuedJobCard(): void {
  const pending = pendingJobCard;
  pendingJobCard = null;
  if (pending) printJobCard(pending.job, pending.opts);
}
