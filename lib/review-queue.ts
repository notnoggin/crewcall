import type { SupabaseClient } from "@supabase/supabase-js";

export async function expireOverdueTests(
	supabase: SupabaseClient,
	roleId: string,
) {
	const { data: overdueTests, error } = await supabase
		.from("tests")
		.select("id, application_id")
		.eq("outcome", "pending")
		.lt("due_at", new Date().toISOString())
		.in(
			"application_id",
			(
				await supabase
					.from("applications")
					.select("id")
					.eq("role_id", roleId)
					.in("status", ["test_sent", "test_submitted"])
			).data?.map((application) => application.id) || [],
		);

	if (error || !overdueTests?.length) return;

	await Promise.all(
		overdueTests.map(async (test) => {
			await supabase.from("tests").update({ outcome: "ghosted" }).eq("id", test.id);
			await supabase
				.from("applications")
				.update({ status: "dismissed" })
				.eq("id", test.application_id);
			await supabase.from("application_events").insert({
				application_id: test.application_id,
				action: "test_auto_ghosted",
				note: "Test deadline passed without a submission.",
			});
		}),
	);
}
