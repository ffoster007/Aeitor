import { Resend } from "resend";
import { differenceInDays, format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Aeitor Alerts <alerts@aeitor.io>";

interface Vendor {
  id: string;
  name: string;
  endDate: Date;
  noticePeriod: number;
  monthlyCost: number | { toNumber: () => number };
}

function toNumber(v: number | { toNumber: () => number }) {
  return typeof v === "number" ? v : v.toNumber();
}

export async function sendRenewalAlert(
  to: string,
  vendor: Vendor,
  daysLeft: number,
) {
  const endFormatted = format(vendor.endDate, "MMM d, yyyy");
  const cost = toNumber(vendor.monthlyCost);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ ${vendor.name} renews in ${daysLeft} days`,
    html: `
      <div style="font-family:sans-serif;color:#111;max-width:560px">
        <h2 style="color:#e53e3e">Contract Renewal Alert</h2>
        <p>Your contract with <strong>${vendor.name}</strong> renews in <strong>${daysLeft} days</strong> on <strong>${endFormatted}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e2e8f0;font-weight:600">Vendor</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${vendor.name}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e2e8f0;font-weight:600">Renewal Date</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${endFormatted}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e2e8f0;font-weight:600">Monthly Cost</td><td style="padding:8px 12px;border:1px solid #e2e8f0">$${cost.toLocaleString()}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e2e8f0;font-weight:600">Notice Period</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${vendor.noticePeriod} days</td></tr>
        </table>
        <p style="color:#718096;font-size:14px">Log in to Aeitor to manage your contract.</p>
      </div>
    `,
  });
}

export async function sendWeeklySummary(
  to: string,
  vendors: Vendor[],
) {
  const today = new Date();
  const expiringSoon = vendors
    .map((v) => ({ ...v, daysLeft: differenceInDays(v.endDate, today) }))
    .filter((v) => v.daysLeft >= 0 && v.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (expiringSoon.length === 0) return;

  const rows = expiringSoon
    .map(
      (v) =>
        `<tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0">${v.name}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0">${format(v.endDate, "MMM d, yyyy")}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0">${v.daysLeft} days</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0">$${toNumber(v.monthlyCost).toLocaleString()}/mo</td>
        </tr>`,
    )
    .join("");

  await resend.emails.send({
    from: FROM,
    to,
    subject: `📋 Weekly: ${expiringSoon.length} contract${expiringSoon.length > 1 ? "s" : ""} renewing within 30 days`,
    html: `
      <div style="font-family:sans-serif;color:#111;max-width:600px">
        <h2>Weekly Contract Summary</h2>
        <p>You have <strong>${expiringSoon.length} contract${expiringSoon.length > 1 ? "s" : ""}</strong> renewing within the next 30 days.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Vendor</th>
              <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Renewal Date</th>
              <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Days Left</th>
              <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Cost</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#718096;font-size:14px">Log in to Aeitor to take action.</p>
      </div>
    `,
  });
}
