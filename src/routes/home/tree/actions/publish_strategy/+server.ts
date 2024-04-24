import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { probId, probUUID, title, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const probIdValid = Joi.string().validate(probId);
		const titleValid = Joi.string().max(28).validate(title);

		if (userIdValid.error || probIdValid.error || titleValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const username = usernameResult.data[0].username;

		const tree = createTree();

		tree.setTree(treeData.data[0].data);
		const pId = tree.getObjFromId(probId, probUUID)?.id;

		if (!pId) throw { status: 400, message: 'Parent problem of strategy node could not be found' };

		const strat = tree.createStrategy(pId, probUUID, title, undefined, [username]);
		if (!strat) throw { status: 400, message: 'error occured while creating strategy' };

		const strategiesPromise = supabaseService
			.from('Strategies')
			.insert({ id: strat.id, uuid: strat.uuid, title, tldr: { ops: [] } });
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const [strategiesResult, treeResult] = await Promise.all([strategiesPromise, treePromise]);

		if (strategiesResult?.error) throw { status: 400, message: strategiesResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

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
