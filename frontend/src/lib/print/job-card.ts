import type { Job, JobDetail } from "@/types/jobs/job";
import type { Payment } from "@/types/billing/payment";

export type JobCardData = Job | JobDetail;

export interface JobCardOptions {
  /** Used when `job.worker` is only an id (e.g. the create-job response). */
  workerName?: string;
  businessName?: string;
  businessLogo?: string | null;
  branchName?: string;
  branchLocation?: string | null;
  branchPhone?: string | null;
  /** ISO currency code for amounts; defaults to KES. */
  currency?: string | null;
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  refunded: "Refunded",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank transfer",
};

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

function money(value: string | number, currency?: string | null): string {
  return `${currency || "KES"} ${Number(value).toLocaleString()}`;
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

type DocKind = "job_card" | "receipt";

function renderPayments(payments: Payment[], currency?: string | null): string {
  if (payments.length === 0) return "";
  const rows = payments
    .map((p) => {
      const method = PAYMENT_METHOD_LABEL[p.method] ?? p.method;
      const label = p.type === "payment" ? method : `${method} (${p.type})`;
      const amount = p.type === "refund" ? `- ${money(p.amount, currency)}` : money(p.amount, currency);
      return `
        <tr>
          <td>${escapeHtml(label)}<div class="muted">${escapeHtml(fmtDateTime(p.paid_at))}${p.transaction_code ? ` · ${escapeHtml(p.transaction_code)}` : ""}</div></td>
          <td class="num">${escapeHtml(amount)}</td>
        </tr>`;
    })
    .join("");
  return `
  <hr />
  <table>
    <thead><tr><th>Payment</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderDocHtml(job: JobCardData, opts: JobCardOptions, kind: DocKind): string {
  const isReceipt = kind === "receipt";
  const title = isReceipt ? "Receipt" : "Job Card";
  const customer = job.customer;
  const vehicle = job.vehicle;
  const vehicleDesc = vehicle
    ? [vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" · ")
    : "";
  const workerName = resolveWorkerName(job, opts);
  const branchContact = [opts.branchLocation, opts.branchPhone].filter(Boolean).join(" · ");
  const discount = Number(job.discount_amount);
  const balance = Math.max(Number(job.total_amount) - Number(job.amount_paid), 0);
  const payments = "payments" in job ? job.payments ?? [] : [];
  const receiptSummary = `
  ${renderPayments(payments, opts.currency)}
  <hr />
  ${row("Amount paid", money(job.amount_paid, opts.currency))}
  <div class="row total"><span>Balance</span><span>${escapeHtml(money(balance, opts.currency))}</span></div>
  ${row("Payment status", PAYMENT_STATUS_LABEL[job.payment_status] ?? job.payment_status)}`;

  const items = (job.items ?? [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.service?.name ?? item.description ?? "Service")}${isReceipt ? `<div class="muted">@ ${escapeHtml(money(item.unit_price, opts.currency))}</div>` : ""}</td>
          <td class="num">${escapeHtml(item.length && item.width ? `${qty(item.length)} × ${qty(item.width)}` : qty(item.quantity))}</td>
          <td class="num">${escapeHtml(money(item.line_total, opts.currency))}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title} ${escapeHtml(job.job_number)}</title>
<style>
  /* 58mm thermal roll: ~48mm printable width, centred on the paper. */
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { width: 48mm; margin: 0 auto; padding: 2mm 0 4mm; font: 13px/1.35 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #000; overflow-wrap: anywhere; }
  .center { text-align: center; }
  .business { font-size: 16px; font-weight: 700; }
  .branch { font-size: 13px; font-weight: 600; }
  .logo { max-width: 30mm; max-height: 15mm; object-fit: contain; margin-bottom: 3px; }
  .title { font-size: 12px; letter-spacing: 2px; font-weight: 700; margin-top: 2px; }
  .number { font-size: 22px; font-weight: 800; margin: 3px 0 2px; }
  /* Thermal heads print grey as speckles, so keep secondary text black. */
  .muted { color: #000; font-size: 12px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .row .label { flex-shrink: 0; }
  .row span:last-child { text-align: right; font-weight: 600; }
  .plate { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; border-bottom: 1px solid #000; padding: 1px 0; }
  td { padding: 2px 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; padding-left: 4px; }
  .total { font-size: 16px; font-weight: 800; }
  .notes { white-space: pre-wrap; }
</style>
</head>
<body>
  <div class="center">
    ${opts.businessLogo ? `<img class="logo" src="${escapeHtml(opts.businessLogo)}" alt="" />` : ""}
    ${opts.businessName ? `<div class="business">${escapeHtml(opts.businessName)}</div>` : ""}
    ${opts.branchName ? `<div class="branch">${escapeHtml(opts.branchName)}</div>` : ""}
    ${branchContact ? `<div class="muted">${escapeHtml(branchContact)}</div>` : ""}
    <div class="title">${title.toUpperCase()}</div>
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
  ${isReceipt && job.completed_at ? row("Completed", fmtDateTime(job.completed_at)) : ""}
  ${isReceipt && job.collected_at ? row("Collected", fmtDateTime(job.collected_at)) : ""}

  <hr />
  <table>
    <thead><tr><th>Service</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead>
    <tbody>${items}</tbody>
  </table>

  <hr />
  ${discount > 0 ? row("Subtotal", money(job.subtotal, opts.currency)) + row("Discount", `- ${money(discount, opts.currency)}`) : ""}
  <div class="row total"><span>Total</span><span>${escapeHtml(money(job.total_amount, opts.currency))}</span></div>
  ${isReceipt ? receiptSummary : ""}

  ${job.notes ? `<hr /><div class="muted">Notes</div><div class="notes">${escapeHtml(job.notes)}</div>` : ""}

  <hr />
  <div class="center muted">${isReceipt ? "Thank you for your business." : "Present this card when collecting."}</div>

</body>
</html>`;
}

export function renderJobCardHtml(job: JobCardData, opts: JobCardOptions = {}): string {
  return renderDocHtml(job, opts, "job_card");
}

/** Like the job card, but adds unit prices, payments, amount paid and balance. */
export function renderReceiptHtml(job: JobCardData, opts: JobCardOptions = {}): string {
  return renderDocHtml(job, opts, "receipt");
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

export function printReceipt(job: JobCardData, opts?: JobCardOptions): void {
  printHtml(renderReceiptHtml(job, opts));
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
