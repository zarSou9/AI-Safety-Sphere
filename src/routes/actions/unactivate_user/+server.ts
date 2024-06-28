import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabaseService, supabase } }) => {
	try {
		const { userId, uuid } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);

		if (userIdValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const nodePromise = await supabase
			.from('Nodes')
			.select('last_edit, active_user')
			.eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treeDataPromise = supabaseService.from('Tree').select('data').eq('id', 1);

		const [nodeResult, usernameResult, treeData] = await Promise.all([
			nodePromise,
			usernamePromise,
			treeDataPromise
		]);

		if (nodeResult.error) throw { status: 400, message: nodeResult.error.message };
		if (usernameResult.error) throw { status: 400, message: usernameResult.error.message };
		if (treeData?.error) throw { status: 400, message: treeData.error.message };

		let username = usernameResult.data[0].username;

		const tree = createTree();
		tree.setTree(treeData.data[0].data);
		const treeNode = tree.getObjFromId(uuid);
		if (!treeNode) throw { status: 400, message: 'Parent node could not be found' };

		if (nodeResult.data[0].active_user !== username && !treeNode.owners.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const { error } = await supabaseService.from('Nodes').update({ last_edit: 0 }).eq('uuid', uuid);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'User unactivated' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
