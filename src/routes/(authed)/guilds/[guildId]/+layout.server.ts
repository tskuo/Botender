import type { LayoutServerLoad } from './$types';
import { requireGuildAccess } from '$lib/server/guildAuth';

export const load: LayoutServerLoad = async (event) => {
	const { params } = event;
	const guildId = params.guildId;

	// This will redirect to login or throw 403 if no access
	const user = requireGuildAccess(event, guildId);

	return {
		user,
		guildId
	};
};
