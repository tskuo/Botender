import { underspecifiedPipeline } from '$lib/pipelines/underspecifiedPipeline';
import { overspecifiedPipeline } from '$lib/pipelines/overspecifiedPipeline';
import { consequencePipeline } from '$lib/pipelines/consequencePipeline';
import { generalEvaluator } from '$lib/pipelines/generalEvaluator';
import { json, error } from '@sveltejs/kit';
import _ from 'lodash';
import { isTaskEmpty, trimTaskCustomizer } from '$lib/tasks';

export const POST = async ({ request }) => {
	try {
		const { oldTasks, newTasks } = await request.json();

		const diffTasks: Task[] = [];

		for (const [taskId, task] of Object.entries(newTasks)) {
			if (!isTaskEmpty(newTasks[taskId])) {
				if (taskId in oldTasks) {
					if (
						_.isEqualWith(
							_.pick(oldTasks[taskId], ['trigger', 'action']),
							_.pick(newTasks[taskId], ['trigger', 'action']),
							trimTaskCustomizer
						)
					) {
						continue;
					} else {
						diffTasks.push(task as Task);
					}
				} else {
					diffTasks.push(task as Task);
				}
			}
		}

		const underspecifiedPromise = Promise.all(
			diffTasks.map((diffTask: Task) => underspecifiedPipeline(diffTask, newTasks))
		);

		// const overspecifiedPromise = Promise.all(
		// 	diffTasks.map((diffTask: Task) => overspecifiedPipeline(diffTask, newTasks))
		// );

		// const consequencePromise = Promise.all(
		// 	diffTasks.map((diffTask: Task) => consequencePipeline(diffTask, newTasks))
		// );

		// Await in parallel
		// const [underspecifiedResults, overspecifiedResults, consequenceResults] = await Promise.all([
		// 	underspecifiedPromise,
		// 	overspecifiedPromise,
		// 	consequencePromise
		// ]);

		const underspecifiedResults = await underspecifiedPromise;
		// const overspecifiedResults = await overspecifiedPromise;
		// const consequenceResults = await consequencePromise;

		const underspecifiedCases = underspecifiedResults.flat();
		// const overspecifiedCases = overspecifiedResults.flat();
		// const consequenceCases = consequenceResults.flat();

		// Combine arrays
		// const allRawCases = [...underspecifiedCases, ...overspecifiedCases, ...consequenceCases];
		const allRawCases = underspecifiedCases;
		const evaluatedCases = await generalEvaluator(newTasks, allRawCases);

		const allCases = evaluatedCases.map((c) => ({ ...c, tmpId: crypto.randomUUID() }));

		return json({ cases: _.orderBy(allCases, ['rating'], ['desc']) }, { status: 201 });
	} catch {
		throw error(400, 'Fail to generate cases');
	}
};
