import { json, error } from '@sveltejs/kit';
import {
	doc,
	getDoc,
	updateDoc,
	arrayRemove,
	arrayUnion,
	addDoc,
	collection,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import {
	sendDeployNotificationToThread,
	sendCloseNotificationToThread,
	sendReopenNotificationToThread
} from '$lib/server/discord/api';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id,
			createAt: docSnap.data().createAt.toDate()
		});
	}
	throw error(404, `Proposal #${params.proposalId} not found.`);
};

export const PATCH = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(400, 'User authentication error.');
	}
	try {
		const { action = '', caseId, vote, proposalEditId } = await request.json();
		if (action === 'removeCase') {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				testCases: arrayRemove(caseId)
			});
			await addDoc(
				collection(db, 'guilds', params.guildId, 'proposals', params.proposalId, 'caseHistory'),
				{
					action: action,
					caseId: caseId,
					createAt: serverTimestamp(),
					editor: locals.user.userName,
					editorId: locals.user.userId
				}
			);
		} else if (action === 'addCase') {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				testCases: arrayUnion(caseId)
			});
			await addDoc(
				collection(db, 'guilds', params.guildId, 'proposals', params.proposalId, 'caseHistory'),
				{
					action: action,
					caseId: caseId,
					createAt: serverTimestamp(),
					editor: locals.user.userName,
					editorId: locals.user.userId
				}
			);
		} else if (action === 'voteProposal') {
			const userId = locals.user.userId;
			if (vote === 'upvote') {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayUnion(userId),
						downvotes: arrayRemove(userId)
					}
				);
			} else if (vote === 'downvote') {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayRemove(userId),
						downvotes: arrayUnion(userId)
					}
				);
			} else {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayRemove(userId),
						downvotes: arrayRemove(userId)
					}
				);
			}
		} else if (action === 'closeProposal') {
			const proposalRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
			const proposalSnap = await getDoc(proposalRef);

			if (!proposalSnap.exists()) {
				throw error(404, 'Proposal not found.');
			}

			// check for potential conflict where another person has already closed the proposal
			if (proposalSnap.data().open) {
				await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
					open: false
				});

				const proposalData = proposalSnap.data();
				if (proposalData.threadId) {
					await sendCloseNotificationToThread(
						params.guildId,
						proposalData.threadId,
						locals.user.userId,
						params.proposalId
					);
				}
			}
		} else if (action === 'reopenProposal') {
			const proposalRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
			const proposalSnap = await getDoc(proposalRef);

			if (!proposalSnap.exists()) {
				throw error(404, 'Proposal not found.');
			}

			// check for potential conflict where another person has already opened the proposal
			if (!proposalSnap.data().open) {
				await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
					open: true
				});

				const proposalData = proposalSnap.data();
				if (proposalData.threadId) {
					await sendReopenNotificationToThread(
						params.guildId,
						proposalData.threadId,
						locals.user.userId,
						params.proposalId
					);
				}
			}
		} else if (action === 'deployProposal') {
			const proposalRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
			const proposalSnap = await getDoc(proposalRef);

			if (!proposalSnap.exists()) {
				throw error(404, 'Proposal not found.');
			}

			const editRef = doc(
				db,
				'guilds',
				params.guildId,
				'proposals',
				params.proposalId,
				'edits',
				proposalEditId
			);
			const editSnap = await getDoc(editRef);
			if (!editSnap.exists()) {
				throw error(404, 'Latest edit not found.');
			}

			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				open: false,
				deployed: true
			});

			if (proposalSnap.data().threadId) {
				await sendDeployNotificationToThread(
					params.guildId,
					proposalSnap.data().threadId,
					locals.user.userId,
					params.proposalId,
					editSnap.data().upvotes
				);
			}
		}
		return json({ status: 201 });
	} catch {
		throw error(400, 'Fail to update the test suite');
	}
};
