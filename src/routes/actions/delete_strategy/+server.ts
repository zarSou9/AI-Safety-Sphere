import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, uuid, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const idValid = Joi.string().validate(id);
		const uuidValid = Joi.string().validate(uuid);

		if ((userIdValid.error || idValid.error, uuidValid.error))
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };
		let tree;

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const treeDataPromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');
			const userPromise = supabase.from('Profiles').select('username').eq('user_id', userId);

			const [treeData, userResult] = await Promise.all([treeDataPromise, userPromise]);

			if (treeData?.error) throw { status: 400, message: treeData.error.message };
			if (userResult?.error) throw { status: 400, message: userResult.error.message };

			if (!treeData.data.length) continue;

			const username = userResult.data[0].username;

			tree = createTree();

			tree.setTree(treeData.data[0].data);
			const treeNode = tree.getObjFromId(id, uuid);
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}

			const deleteResult = tree.deleteStrategy(id, uuid);
			if (deleteResult?.error) throw { status: 400, message: deleteResult.error };

			const strategiesPromise = supabaseService.from('Strategies').delete().eq('uuid', uuid);
			const treePostPromise = supabaseService
				.from('Tree')
				.update({ data: tree.getTree(), changing: 0 })
				.eq('id', 1);
			const profProm = supabaseService
				.from('Profiles')
				.update({ selected_strategies: [] })
				.neq('email', '1');

			const [strategiesResult, treePostResult, profResult] = await Promise.all([
				strategiesPromise,
				treePostPromise,
				profProm
			]);

			if (strategiesResult?.error) throw { status: 400, message: strategiesResult.error.message };
			if (profResult?.error) throw { status: 400, message: profResult.error.message };
			if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };

			break;
		}

		return json(
			{
				message: 'Data submitted successfully',
				data: { tree: tree.getTree(), ss: undefined }
			},
			{ status: 200 }
		);
	} catch (error: any) {
		await supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
