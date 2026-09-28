import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@whop/react/components";
import { DashboardNav } from "@/components/dashboard-nav";
import { RoleCard } from "@/components/role-card";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getWhopSdk } from "@/lib/whop-sdk";

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const { userId } = await getWhopSdk().verifyUserToken(await headers());
	let greeting = "Welcome back";
	try {
		const user = await getWhopSdk().users.retrieve(userId);
		if (user.name || user.username) greeting = `Welcome back, ${user.name || user.username}`;
	} catch (error) {
		console.error("Could not load Whop display name:", error);
	}

	const supabase = getSupabaseAdmin();
	const { data: workspace } = await supabase.from("workspaces").select("id, hiring_type").eq("whop_company_id", companyId).maybeSingle();
	if (!workspace) return <main className="min-h-screen px-5 py-16"><OnboardingForm companyId={companyId} /></main>;

	const [{ data: roles }, { count: benchSize }, { count: availableNow }] = await Promise.all([
		supabase.from("roles").select("id, title, type, description, status, capacity, intake_mode, seat_cap, platforms, pay_model, rate_offered, creator_name, niche, rules, start_date, deadline, applications(id, status)").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
		supabase.from("roster_entries").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "bench"),
		supabase.from("roster_entries").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).eq("status", "bench"),
	]);
	const mapped = (roles || []).map((role) => ({ ...role, applicantCount: role.applications?.length || 0, seatsFilled: role.applications?.filter((item) => ["bench", "active", "paused"].includes(item.status)).length || 0 }));
	const openRoles = mapped.filter((role) => role.status === "open").length;
	const applicantsInReview = mapped.reduce((total, role) => total + (role.applications?.filter((item) => ["applied", "needs_info", "sample_requested", "test_sent", "test_submitted"].includes(item.status)).length || 0), 0);
	const attentionRoles = mapped.filter((role) => role.status === "open" && role.intake_mode === "limited_seats" && role.seat_cap && role.seatsFilled >= Math.max(role.seat_cap - 1, 1));

	return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-6xl"><DashboardNav companyId={companyId} /><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-3 text-gray-10">{greeting}</p><h1 className="text-9 font-bold text-gray-12">Crewcall home</h1><p className="mt-2 text-4 text-gray-10">Your hiring desk for building a ready bench.</p></div><Link href={`/dashboard/${companyId}/roles/new`}><Button size="3">Create role</Button></Link></header>
		{!mapped.length ? <section className="rounded-3xl border border-gray-a5 bg-gray-a2 p-8"><h2 className="text-6 font-bold text-gray-12">Get your first roster moving</h2><div className="mt-6 grid gap-3 md:grid-cols-3"><ChecklistStep number="1" title="Create your first role" href={`/dashboard/${companyId}/roles/new`} /><ChecklistStep number="2" title="Share the link" /><ChecklistStep number="3" title="Review your first applicant" /></div></section> : <><section className="mb-8"><h2 className="mb-4 text-6 font-bold text-gray-12">Needs your attention</h2><div className="grid gap-3 md:grid-cols-2"><Attention title="New applications waiting for review" value={applicantsInReview} href={`/dashboard/${companyId}/roles`} /><Attention title="Tests overdue or awaiting review" value="Review queues" href={`/dashboard/${companyId}/roles`} /><Attention title="Applicants waiting on a reply" value="Needs info" href={`/dashboard/${companyId}/roles`} /><Attention title="Roles closing soon or nearly full" value={attentionRoles.length} href={`/dashboard/${companyId}/roles`} /></div></section><section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Open roles" value={openRoles} /><Summary label="Applicants in review" value={applicantsInReview} /><Summary label="Bench size" value={benchSize || 0} /><Summary label="Available now" value={availableNow || 0} /></section><section><div className="mb-4 flex items-center justify-between"><h2 className="text-6 font-bold text-gray-12">Roles</h2><Link href={`/dashboard/${companyId}/roles`} className="text-3 font-semibold text-accent-11 underline">View all roles</Link></div>		<div className="grid gap-3">{mapped.map((role) => <RoleCard key={role.id} role={role as never} companyId={companyId} />)}</div></section></>}</div></main>;
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-gray-a5 bg-gray-a2 p-5"><p className="text-3 text-gray-9">{label}</p><p className="mt-2 text-8 font-bold text-gray-12">{value}</p></div>; }
function Attention({ title, value, href }: { title: string; value: string | number; href: string }) { return <Link href={href} className="rounded-2xl border border-gray-a5 bg-gray-a2 p-4 hover:border-accent-8"><p className="text-3 font-semibold text-gray-12">{title}</p><p className="mt-2 text-4 text-accent-11">{value} →</p></Link>; }
function ChecklistStep({ number, title, href }: { number: string; title: string; href?: string }) { const content = <div className="rounded-2xl border border-gray-a5 bg-gray-a1 p-5"><span className="text-3 font-bold text-accent-11">{number}</span><p className="mt-3 text-4 font-semibold text-gray-12">{title}</p></div>; return href ? <Link href={href}>{content}</Link> : content; }
