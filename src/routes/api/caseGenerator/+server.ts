import { underspecifiedPipeline } from '$lib/pipelines/underspecifiedPipeline';
import { overspecifiedPipeline } from '$lib/pipelines/overspecifiedPipeline';
import { generalEvaluator } from '$lib/pipelines/generalEvaluator';
import { json, error } from '@sveltejs/kit';
import _ from 'lodash';

export const POST = async ({ request }) => {
	try {
		const { oldTasks, newTasks } = await request.json();

		const underspecifiedCases = await underspecifiedPipeline(oldTasks, newTasks);
		// const overspecifiedCases = await overspecifiedPipeline(oldTasks, newTasks);

		let prompt: Task | undefined = undefined;

		// ALERT: THIS SHOULD BE UPDATED LATER
		for (const [taskId, task] of Object.entries(newTasks)) {
			if (taskId in oldTasks) {
				if (
					_.isEqual(
						_.pick(oldTasks[taskId], ['trigger', 'action']),
						_.pick(newTasks[taskId], ['trigger', 'action'])
					)
				) {
					continue;
				} else {
					prompt = task;
					break;
				}
			} else {
				prompt = task;
				break;
			}
		}
		const evaluatedCases = await generalEvaluator(prompt, newTasks, underspecifiedCases);
		const allCases = evaluatedCases.map((c) => ({ ...c, tmpId: crypto.randomUUID() }));

		return json({ cases: _.orderBy(allCases, ['rating'], ['desc']) }, { status: 201 });
	} catch {
		throw error(400, 'Fail to generate cases');
	}
};
