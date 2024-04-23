import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const idValid = Joi.string().validate(id);

		if (userIdValid.error || idValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const userPromise = supabase
			.from('Profiles')
			.select('username, selected_strategies')
			.eq('user_id', userId);

		const [treeData, userResult] = await Promise.all([treeDataPromise, userPromise]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (userResult?.error) throw { status: 400, message: userResult.error.message };

		const username = userResult.data[0].username;
		const selected_strategies = userResult.data[0].selected_strategies;

		const tree = createTree();

		tree.setTree(treeData.data[0].data);
		const treeNode = tree.getObjFromId(id);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const selectedFound = selected_strategies.findIndex((ss: any) => ss.id === tree.getParent(id));
		if (selectedFound >= 0) selected_strategies.splice(selectedFound, 1);

		const deleteResult = tree.deleteStrategy(id);
		if (deleteResult?.error) throw { status: 400, message: deleteResult.error };

		const strategiesPromise = supabaseService.from('Strategies').delete().eq('id', id);
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const userPostPromise = supabase
			.from('Profiles')
			.update({ selected_strategies })
			.eq('user_id', userId);

		const [strategiesResult, treeResult, userPostResult] = await Promise.all([
			strategiesPromise,
			treePromise,
			userPostPromise
		]);

		if (strategiesResult?.error) throw { status: 400, message: strategiesResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };
		if (userPostResult?.error) throw { status: 400, message: userPostResult.error.message };

		return json({ message: 'Data submitted successfully' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
