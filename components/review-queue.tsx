"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@whop/react/components";
import { rejectReasons, reviewStatuses, type ReviewStatus } from "@/lib/hiring";
import { answerLabel } from "@/lib/application-fields";

type Application = {
	id: string;
	applicant_email: string;
	applicant_whop_id: string | null;
	answers: Record<string, unknown>;
	sample_links: string[] | null;
	weekly_capacity: number | null;
	timezone: string | null;
	rate_requested: number | null;
	score: number | null;
	notes: string | null;
	status: ReviewStatus;
	roles?: { workspace_id: string; type: string; title: string; rate_offered: number | null };
	tests?: { id: string; brief: string; paid: boolean; pay_amount: number | null; due_at: string | null; outcome: string }[];
};

const labels: Record<ReviewStatus, string> = {
	applied: "Applied",
	needs_info: "Needs info",
	sample_requested: "Sample requested",
	test_sent: "Test sent",
	test_submitted: "Test submitted",
	bench: "Bench",
};

export function ReviewQueue({ applications }: { applications: Application[] }) {
	const [selected, setSelected] = useState<Application | null>(null);
	const grouped = useMemo(
		() => Object.fromEntries(reviewStatuses.map((status) => [status, applications.filter((application) => application.status === status)])) as Record<ReviewStatus, Application[]>,
		[applications],
	);

	return (
		<>
			<div className="grid min-w-[1100px] grid-cols-6 gap-3 overflow-x-auto">
				{reviewStatuses.map((status) => (
					<section key={status} className="min-h-96 rounded-2xl border border-gray-a5 bg-gray-a2 p-3">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-3 font-semibold text-gray-12">{labels[status]}</h2>
							<span className="rounded-full bg-gray-a4 px-2 py-1 text-2 text-gray-10">{grouped[status].length}</span>
						</div>
						<div className="grid gap-2">
							{grouped[status].map((application) => (
								<button key={application.id} type="button" onClick={() => setSelected(application)} className="rounded-xl border border-gray-a4 bg-gray-a1 p-3 text-left hover:border-accent-8">
									<p className="truncate text-3 font-semibold text-gray-12">{application.applicant_email}</p>
									{(application.weekly_capacity !== null || application.timezone) && <p className="mt-1 text-2 text-gray-9">{[application.weekly_capacity !== null ? `${application.weekly_capacity} / week` : null, application.timezone || null].filter(Boolean).join(" · ")}</p>}
									<div className="mt-2 flex flex-wrap gap-1 text-2">
										{application.rate_requested !== null && <span className={application.roles?.rate_offered !== null && application.roles?.rate_offered !== undefined && application.rate_requested > application.roles.rate_offered ? "rounded bg-red-a3 px-2 py-1 text-red-11" : "rounded bg-gray-a4 px-2 py-1 text-gray-10"}>${application.rate_requested} requested</span>}
										{application.roles?.rate_offered !== null && application.roles?.rate_offered !== undefined && <span className="rounded bg-gray-a4 px-2 py-1 text-gray-10">${application.roles.rate_offered} offered</span>}
									</div>
								</button>
							))}
							{!grouped[status].length && <p className="py-8 text-center text-2 text-gray-9">{applications.length ? "No applicants in this stage" : "No applicants yet"}</p>}
						</div>
					</section>
				))}
			</div>
			{selected && <ApplicantDrawer application={selected} onClose={() => setSelected(null)} />}
		</>
	);
}

function ApplicantDrawer({ application, onClose }: { application: Application; onClose: () => void }) {
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [note, setNote] = useState(application.notes || "");
	const [score, setScore] = useState(application.score?.toString() || "");
	const [brief, setBrief] = useState("");
	const [dueAt, setDueAt] = useState("");
	const [outcome, setOutcome] = useState<"passed" | "failed" | "ghosted">("passed");
	const [reason, setReason] = useState<(typeof rejectReasons)[number]>(rejectReasons[0]);
	const hasTest = Boolean(application.tests?.length);
	const showSampleAction = application.status === "applied";
	const showSampleWaiting = application.status === "sample_requested";
	const showSendTest = application.status === "sample_requested";
	const showTestResult = application.status === "test_sent" && hasTest;
	const showHire = !["bench", "rejected", "dismissed"].includes(application.status);

	async function action(actionName: string, body: Record<string, unknown> = {}) {
		setBusy(true);
		setMessage("");
		const response = await fetch(`/api/applications/${application.id}/actions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: actionName, ...body }),
		});
		const data = await response.json();
		setBusy(false);
		if (!response.ok) {
			setMessage(data.error || "Action failed.");
			return;
		}
		setMessage("Saved.");
		window.location.reload();
	}

	return (
		<div className="fixed inset-0 z-20 flex justify-end bg-black-a6" role="dialog" aria-modal="true">
			<div className="h-full w-full max-w-xl overflow-y-auto border-l border-gray-a5 bg-gray-1 p-6 shadow-2xl">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<p className="text-3 text-gray-9">{application.roles?.type}</p>
						<h2 className="text-7 font-bold text-gray-12">{application.applicant_email}</h2>
						<p className="text-3 text-gray-10">{application.status}</p>
					</div>
					<Button variant="classic" size="2" onClick={onClose}>Close</Button>
				</div>
				<div className="grid gap-6">
					<section>
						<h3 className="mb-2 text-4 font-semibold text-gray-12">Application</h3>
						<div className="grid gap-2 rounded-xl border border-gray-a4 bg-gray-a2 p-4 text-3 text-gray-10">
							{Object.entries(application.answers || {}).map(([key, value]) => {
								if (key === "clipSamples" && Array.isArray(value)) {
									return <div key={key} className="grid gap-1"><strong className="text-gray-12">Clip samples</strong>{value.map((sample: { url?: string; views?: string }, index: number) => sample.url ? <Link key={sample.url} href={sample.url} target="_blank" rel="noreferrer" className="text-accent-11 underline">Sample {index + 1}{sample.views ? ` · ${sample.views} views` : ""}</Link> : null)}</div>;
								}
								if (value === "" || value === null || typeof value === "undefined" || value === false) return null;
								return <p key={key}><strong className="text-gray-12">{answerLabel(key)}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value)}</p>;
							})}
							{!Object.hasOwn(application.answers || {}, "clipSamples") && application.sample_links?.map((link) => <Link key={link} href={link} target="_blank" rel="noreferrer" className="text-accent-11 underline">{link}</Link>)}
						</div>
					</section>
					<section className="grid gap-3">
						<h3 className="text-4 font-semibold text-gray-12">Reviewer actions</h3>
						<div className="flex flex-wrap gap-2">
							{showSampleAction && <Button size="2" variant="classic" disabled={busy} onClick={() => action("request_sample")}>Request sample</Button>}
							{showHire && <Button size="2" variant="classic" disabled={busy} onClick={() => action("hire")}>Hire to bench</Button>}
						</div>
						<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note or question to applicant" rows={3} className="rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" />
						<div className="flex gap-2">
							<input value={score} onChange={(event) => setScore(event.target.value)} type="number" min="1" max="5" placeholder="Score 1-5" className="w-28 rounded-xl border border-gray-a5 bg-gray-a2 p-3 text-3 text-gray-12" />
							<Button size="2" variant="classic" disabled={busy} onClick={() => action("save_review", { note, score: score ? Number(score) : undefined })}>Save review</Button>
							<Button size="2" variant="classic" disabled={busy} onClick={() => action("needs_info", { note })}>Ask applicant</Button>
						</div>
					</section>
					{showSampleWaiting && <section className="grid gap-3 rounded-xl border border-gray-a4 bg-gray-a2 p-4"><h3 className="text-4 font-semibold text-gray-12">Waiting for samples</h3><p className="text-3 text-gray-10">The applicant has been asked for samples. Review submitted links above, or send the test when ready.</p></section>}
					{showSendTest && <section className="grid gap-3 rounded-xl border border-gray-a4 bg-gray-a2 p-4">
						<h3 className="text-4 font-semibold text-gray-12">Send test</h3>
						<textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={3} placeholder="Test brief" className="rounded-xl border border-gray-a5 bg-gray-a1 p-3 text-3 text-gray-12" />
						<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="rounded-xl border border-gray-a5 bg-gray-a1 p-3 text-3 text-gray-12" />
						<Button size="2" variant="classic" disabled={busy} onClick={() => action("send_test", { brief, dueAt: dueAt || null, paid: false })}>Send test brief</Button>
					</section>}
					{showTestResult && <section className="grid gap-3 rounded-xl border border-gray-a4 bg-gray-a2 p-4">
						<h3 className="text-4 font-semibold text-gray-12">Test result</h3>
						<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)} className="rounded-xl border border-gray-a5 bg-gray-a1 p-3 text-3 text-gray-12"><option value="passed">Passed</option><option value="failed">Failed</option><option value="ghosted">Ghosted</option></select>
						<Button size="2" variant="classic" disabled={busy} onClick={() => action("test_result", { outcome })}>Save test result</Button>
					</section>}
					{(application.status === "applied" || application.status === "sample_requested" || application.status === "test_sent" || application.status === "test_submitted") && <section className="grid gap-3 rounded-xl border border-red-a5 bg-red-a2 p-4">
						<h3 className="text-4 font-semibold text-gray-12">Reject</h3>
						<select value={reason} onChange={(event) => setReason(event.target.value as (typeof rejectReasons)[number])} className="rounded-xl border border-gray-a5 bg-gray-a1 p-3 text-3 text-gray-12">{rejectReasons.map((item) => <option key={item}>{item}</option>)}</select>
						<Button size="2" variant="classic" disabled={busy} onClick={() => action("reject", { reason, note })}>Reject applicant</Button>
					</section>}
					{message && <p className="text-3 text-gray-10">{message}</p>}
				</div>
			</div>
		</div>
	);
}
