import _ from 'lodash';

export function checkEmptyTask(tasks: Tasks) {
	const hasEmptyString = Object.values(tasks).some((obj) =>
		Object.values(obj).some((value) => value.trim() === '')
	);
	return hasEmptyString;
}

export function isTaskMissingField(task: Task) {
	if (
		(task.name.trim() === '' || task.trigger.trim() === '' || task.action.trim() === '') &&
		!isTaskEmpty(task)
	)
		return true;
	else return false;
}

export function isTaskEmpty(task: Task) {
	if (task.name.trim() === '' && task.trigger.trim() === '' && task.action.trim() === '')
		return true;
	else return false;
}

export function trimTaskCustomizer(objValue: string, othValue: string) {
	// If both values are strings, compare their trimmed versions
	if (_.isString(objValue) && _.isString(othValue)) {
		return _.trim(objValue) === _.trim(othValue);
	}
	// Let lodash handle all other types (including objects)
	// by returning undefined
}

export function trimWhiteSpaceInTasks(tasks: Tasks): Tasks {
	return Object.fromEntries(
		Object.entries(tasks).map(([taskId, task]) => [
			taskId,
			{
				name: typeof task.name === 'string' ? task.name.trim() : '',
				trigger: typeof task.trigger === 'string' ? task.trigger.trim() : '',
				action: typeof task.action === 'string' ? task.action.trim() : ''
			}
		])
	) as Tasks;
}
