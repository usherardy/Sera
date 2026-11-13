// Runs the Acme demo conversations through the real analysis pipeline and checks
// the product rules. Needs OPENAI_API_KEY. Run: npm run eval
import { analyzeConversation, ANALYSIS_MODEL } from "@/lib/projects/analyze";
import { toFindingRows, type FindingRow } from "@/lib/projects/process";
import { ACME_CONVERSATIONS, ACME_PROJECT } from "@/lib/sample/acme";

const AMOUNT = /(?:[€$£]\s?\d|\b\d[\d.,]*\s?(?:€|eur|euros?|usd|dollars?)\b)/i;
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${ok ? "" : detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

async function run(key: string) {
  const c = ACME_CONVERSATIONS.find((x) => x.key === key)!;
  const date = c.recorded_at.slice(0, 10);
  const analysis = await analyzeConversation({ project: ACME_PROJECT, transcript: c.transcript, conversationDate: date, timezone: "Europe/Vilnius" });
  const { rows, dropped } = toFindingRows(analysis.findings, c.transcript, `${c.transcript}\n${ACME_PROJECT.fixed_price} ${ACME_PROJECT.currency}`);
  console.log(`\n[${key}] ${rows.length} findings (${dropped} dropped): ${rows.map((r) => `${r.category}:"${r.title}"`).join(" | ")}`);
  return { c, rows };
}

const has = (rows: FindingRow[], cat: FindingRow["category"], word: RegExp) =>
  rows.some((r) => r.category === cat && word.test(`${r.title} ${r.source_quote}`));

async function main() {
  console.log(`Model: ${ANALYSIS_MODEL()}`);
  const results = await Promise.all(ACME_CONVERSATIONS.map((c) => run(c.key)));
  const by = Object.fromEntries(results.map((r) => [r.c.key, r]));

  console.log("\nStripe conversation");
  check("Stripe flagged as a possible scope addition", has(by.stripe.rows, "potential_scope_addition", /stripe|payment/i));
  check("No finding claims you approved it", !by.stripe.rows.some((r) => /\b(approved|agreed to|accepted)\b/i.test(r.description) && r.category === "potential_scope_addition" && /stripe/i.test(r.title) && /\b(you|freelancer) (approved|agreed to|accepted)\b/i.test(r.description)));
  check("Responsive request is not extra work", !has(by.stripe.rows, "potential_scope_addition", /phone|responsive|mobile/i));

  console.log("\nLogin conversation");
  check("Customer accounts flagged as a possible addition", has(by.login.rows, "potential_scope_addition", /account|log ?in/i));
  check("Updated proposal captured as a commitment", has(by.login.rows, "commitment", /proposal/i));
  check("Proposal commitment has no invented deadline", by.login.rows.filter((r) => r.category === "commitment" && /proposal/i.test(r.title)).every((r) => r.due_date === null));

  console.log("\nBlog conversation");
  check("Blog is an idea", has(by.blog.rows, "idea", /blog/i));
  check("Blog is not an addition or commitment", !has(by.blog.rows, "potential_scope_addition", /blog/i) && !has(by.blog.rows, "commitment", /blog/i));
  check("Idea has no owner or deadline", by.blog.rows.filter((r) => r.category === "idea").every((r) => r.due_date === null && r.owner_label === null && r.suggested_follow_up === null));

  console.log("\nDeadline conversation");
  check("Deadline change flagged as a scope modification", has(by.deadline.rows, "scope_modification", /deadline|deliver|monday|23/i));
  check("Latest date (2026-11-23) is surfaced", by.deadline.rows.some((r) => r.category === "scope_modification" && r.due_date === "2026-11-23"));
  check("Only one deadline modification (correction, not duplicate)", by.deadline.rows.filter((r) => r.category === "scope_modification").length === 1);

  console.log("\nAll conversations");
  const all = results.flatMap((r) => r.rows.map((row) => ({ key: r.c.key, row, transcript: r.c.transcript })));
  check("Every quote is a verbatim transcript substring", all.every((x) => x.transcript.includes(x.row.source_quote)));
  check("No invented price in any text field", all.every((x) => !AMOUNT.test(`${x.row.title} ${x.row.description} ${x.row.explanation} ${x.row.suggested_follow_up ?? ""}`)));
  check("No finding states legal verification", all.every((x) => !/legally (verified|binding)/i.test(`${x.row.description} ${x.row.explanation}`)));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Eval crashed:", e instanceof Error ? e.message : e);
  process.exit(2);
});
