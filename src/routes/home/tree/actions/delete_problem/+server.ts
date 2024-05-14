import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, uuid, userId } = await request.json();

		let tree;
		const userIdValid = Joi.string().validate(userId);
		const idValid = Joi.string().validate(id);
		const uuidValid = Joi.string().validate(uuid);

		if (userIdValid.error || idValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const treeDataPromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');
			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

			const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

			if (treeData?.error) throw { status: 400, message: treeData.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

			if (!treeData.data.length) continue;

			const username = usernameResult.data[0].username;

			tree = createTree();

			tree.setTree(treeData.data[0].data);
			const treeNode = tree.getObjFromId(id, uuid);
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}

			const deleteResult = tree.deleteProblem(id, uuid);
			if (deleteResult?.error) throw { status: 400, message: deleteResult.error };

			const problemsPromise = supabaseService.from('Problems').delete().eq('uuid', uuid);
			const treePostPromise = supabaseService
				.from('Tree')
				.update({ data: tree.getTree(), changing: 0 })
				.eq('id', 1);

			const [problemsResult, treePostResult] = await Promise.all([
				problemsPromise,
				treePostPromise
			]);

			if (problemsResult?.error) throw { status: 400, message: problemsResult.error.message };
			if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };

			break;
		}

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree() } },
			{ status: 200 }
		);
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
