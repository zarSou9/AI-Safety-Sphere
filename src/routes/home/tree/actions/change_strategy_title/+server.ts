import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, uuid, newTitle, userId } = await request.json();

		const uuidValid = Joi.string().validate(uuid);
		const newTitleValid = Joi.string().max(28).validate(newTitle);

		if (newTitleValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
			const treePromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');

			const [usernameResult, treeResult] = await Promise.all([usernamePromise, treePromise]);

			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
			if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

			if (!treeResult.data.length) continue;

			const username = usernameResult.data[0].username;
			const tree = createTree();

			tree.setTree(treeResult.data[0].data);
			const treeNode = tree.getObjFromId(id, uuid);
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}

			treeNode.data.title = newTitle;

			const treePostPromise = supabaseService
				.from('Tree')
				.update({ data: tree.getTree(), changing: 0 })
				.eq('changing', now)
				.select('id');
			const strategyPostPromise = supabaseService
				.from('Strategies')
				.update({ title: newTitle })
				.eq('uuid', uuid);

			const [strategyPostResult, treePostResult] = await Promise.all([
				strategyPostPromise,
				treePostPromise
			]);

			if (strategyPostResult?.error)
				throw { status: 400, message: strategyPostResult.error.message };
			if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };

			if (treePostResult.data.length) break;
		}

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		await supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
