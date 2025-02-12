import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const requestSchema = Joi.object({
			uuid: Joi.string(),
			userId: Joi.string(),
			pin: Joi.boolean()
		});
		const req = await request.json();
		if (requestSchema.validate(req).error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const { uuid, userId, pin } = req;
		let tree;
		let username;

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

			username = usernameResult.data[0].username;

			tree = createTree();

			tree.setTree(treeData.data[0].data);

			const parent = tree.getParent(uuid);
			if (!parent) throw { status: 400, message: 'Parent node could not be found' };
			const treeNode = tree.getObjFromId(uuid);
			if (!treeNode) throw { status: 400, message: 'Parent node could not be found' };

			const owners = parent.node?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}
			if (pin) {
				const i = parent.node.children.findIndex(
					(child) => child.parent_category === treeNode.parent_category
				);
				parent.node.children.splice(parent.i, 1);
				parent.node.children.splice(i, 0, treeNode);
				treeNode.pinned = true;
			} else treeNode.pinned = false;

			const postPromises: any = [
				supabaseService.from('Tree').update({ data: tree.getTree(), changing: 0 }).eq('id', 1)
			];

			const results = await Promise.all(postPromises);

			results.forEach((result) => {
				if (result.error) throw { status: 400, message: result.error.message };
			});

			break;
		}

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree(username) } },
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
