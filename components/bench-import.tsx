"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@whop/react/components";
import { BENCH_IMPORT_TEMPLATE_CSV, type BenchImportRowError } from "@/lib/bench-import";

type Props = {
	companyId: string;
	empty?: boolean;
};

export function BenchImport({ companyId, empty = false }: Props) {
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [csvText, setCsvText] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [errors, setErrors] = useState<BenchImportRowError[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	const reset = () => {
		setFileName(null);
		setCsvText(null);
		setMessage(null);
		setErrors([]);
		if (inputRef.current) inputRef.current.value = "";
	};

	const onFile = useCallback(async (file: File | null) => {
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
			setMessage("Please upload a .csv file.");
			return;
		}
		if (file.size > 1_500_000) {
			setMessage("File is too large (max about 1.5 MB).");
			return;
		}
		const text = await file.text();
		setFileName(file.name);
		setCsvText(text);
		setMessage(null);
		setErrors([]);
	}, []);

	async function runImport() {
		if (!csvText) {
			setMessage("Choose a CSV file first.");
			return;
		}
		setBusy(true);
		setMessage(null);
		setErrors([]);
		try {
			const response = await fetch("/api/roster/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId, csv: csvText }),
			});
			const data = await response.json();
			if (!response.ok && !data.imported) {
				setMessage(data.error || "Import failed.");
				setErrors(data.parseErrors || []);
				setBusy(false);
				return;
			}
			const imported = data.imported ?? 0;
			const skipped = data.skipped ?? 0;
			setErrors(data.parseErrors || []);
			if (imported > 0) {
				setMessage(
					`Imported ${imported} ${imported === 1 ? "person" : "people"}${skipped ? ` · ${skipped} skipped (already on bench or invalid)` : ""}.`,
				);
				setTimeout(() => window.location.reload(), 900);
			} else {
				setMessage(
					skipped
						? `Nothing new imported. ${skipped} row(s) skipped.`
						: data.error || "Nothing was imported.",
				);
				setBusy(false);
			}
		} catch {
			setMessage("Network error. Try again.");
			setBusy(false);
		}
	}

	function downloadTemplate() {
		const blob = new Blob([BENCH_IMPORT_TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "crewcall-bench-import-template.csv";
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<>
			{empty ? (
				<section className="premium-surface import-empty p-8 sm:p-10">
					<p className="page-kicker">Migrate your roster</p>
					<h2 className="section-title mt-2">Already have a roster?</h2>
					<p className="mt-3 max-w-xl text-3 text-gray-10">
						Bring clippers, mods, and VAs from Google Forms, Sheets, or any spreadsheet into your
						Crewcall bench in one step. Download the template, fill it in, and import.
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
						<Button size="3" onClick={() => { reset(); setOpen(true); }}>
							Import CSV
						</Button>
						<button type="button" className="btn-secondary" onClick={downloadTemplate}>
							Download template
						</button>
					</div>
					<ul className="import-steps mt-8">
						<li>
							<span className="import-step-num">1</span>
							<span>Export your Form or Sheet as CSV (or start from our template).</span>
						</li>
						<li>
							<span className="import-step-num">2</span>
							<span>Map columns to name, email, and role — optional fields are fine.</span>
						</li>
						<li>
							<span className="import-step-num">3</span>
							<span>Import. Duplicates are skipped automatically.</span>
						</li>
					</ul>
				</section>
			) : (
				<Button variant="classic" size="2" onClick={() => { reset(); setOpen(true); }}>
					Import CSV
				</Button>
			)}

			{open && (
				<div className="import-overlay" role="dialog" aria-modal="true" aria-labelledby="import-title">
					<div className="import-modal premium-surface">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="page-kicker">Bench import</p>
								<h2 id="import-title" className="section-title mt-1">
									Import your roster
								</h2>
								<p className="mt-2 text-3 text-gray-10">
									Up to 200 people per upload. Required: <strong>name</strong> and{" "}
									<strong>email</strong>. Role defaults to clipper if omitted.
								</p>
							</div>
							<button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>
								Close
							</button>
						</div>

						<div className="import-columns mt-6">
							<p className="text-2 font-semibold uppercase tracking-wide text-gray-9">Accepted columns</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{[
									"name *",
									"email *",
									"role_tag",
									"handle",
									"platforms",
									"weekly_capacity",
									"timezone",
									"rate",
									"notes",
									"status",
								].map((col) => (
									<span key={col} className="import-col-chip">
										{col}
									</span>
								))}
							</div>
							<p className="mt-3 text-2 text-gray-9">
								Roles: clipper, moderator, editor, va, ops · Status: bench, active, paused
							</p>
						</div>

						<div className="mt-6 flex flex-wrap gap-3">
							<button type="button" className="btn-secondary" onClick={downloadTemplate} disabled={busy}>
								Download template
							</button>
							<label className="btn-secondary cursor-pointer">
								Choose CSV
								<input
									ref={inputRef}
									type="file"
									accept=".csv,text/csv"
									className="sr-only"
									disabled={busy}
									onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
								/>
							</label>
						</div>

						{fileName && (
							<p className="mt-4 rounded-xl border border-gray-a4 bg-gray-a2 px-4 py-3 text-3 text-gray-11">
								Selected: <strong>{fileName}</strong>
							</p>
						)}

						{message && <p className="mt-4 text-3 text-gray-11">{message}</p>}

						{errors.length > 0 && (
							<div className="import-errors mt-4">
								<p className="text-2 font-semibold text-gray-11">
									{errors.length} row issue{errors.length === 1 ? "" : "s"}
								</p>
								<ul>
									{errors.slice(0, 12).map((err) => (
										<li key={`${err.line}-${err.message}`}>
											{err.line > 0 ? `Line ${err.line}: ` : ""}
											{err.message}
										</li>
									))}
									{errors.length > 12 && (
										<li>…and {errors.length - 12} more</li>
									)}
								</ul>
							</div>
						)}

						<div className="mt-8 flex flex-wrap justify-end gap-3">
							<button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>
								Cancel
							</button>
							<Button size="3" disabled={busy || !csvText} onClick={() => void runImport()}>
								{busy ? "Importing…" : "Import to bench"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
