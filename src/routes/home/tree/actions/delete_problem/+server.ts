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
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const username = usernameResult.data[0].username;

		const tree = createTree();

		tree.setTree(treeData.data[0].data);
		const treeNode = tree.getObjFromId(id);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const deleteResult = tree.deleteProblem(id);
		if (deleteResult?.error) throw { status: 400, message: deleteResult.error };

		const postPromises = [];

		await supabaseService.from('Problems').delete().eq('id', id);

		for (let updateProbId of deleteResult.data.newProbIds) {
			await supabaseService
				.from('Problems')
				.update({ id: updateProbId.new })
				.eq('id', updateProbId.old);
		}
		postPromises.push(supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1));

		await Promise.all(postPromises);

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
