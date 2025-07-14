import { underspecifiedPipeline } from '$lib/pipelines/underspecifiedPipeline';
import { json, error } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { oldTasks, newTasks } = await request.json();

		const underspecifiedCases = await underspecifiedPipeline(oldTasks, newTasks);

		return json({ cases: underspecifiedCases }, { status: 201 });
	} catch {
		throw error(400, 'Fail to generate cases');
	}
};
