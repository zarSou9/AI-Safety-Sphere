import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { parentUUID, title, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const parentUUIDValid = Joi.string().validate(parentUUID);
		const titleValid = Joi.string().max(32).validate(title);
		let tree;

		if (userIdValid.error || parentUUIDValid.error || titleValid.error)
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
			const treeNode = tree.getObjFromId(parentUUID);
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}

			const parent = tree.getObjFromId(parentUUID);

			if (!parent) throw { status: 400, message: 'Parent node could not be found' };

			const node = tree.createNode(parent, title, undefined, [username]);
			if (!node) throw { status: 400, message: 'error occured while creating node' };

			const nodesPromise = supabaseService
				.from('Nodes')
				.insert({ uuid: node.uuid, title, tldr: { ops: [] } });
			const treePromise = supabaseService
				.from('Tree')
				.update({ data: tree.getTree(), changing: 0 })
				.eq('id', 1);

			const [nodesResult, treeResult] = await Promise.all([nodesPromise, treePromise]);

			if (nodesResult?.error) throw { status: 400, message: nodesResult.error.message };
			if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

			break;
		}

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree() } },
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
