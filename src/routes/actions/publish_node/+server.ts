import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const requestSchema = Joi.object({
			parentUUID: Joi.string(),
			parentCategory: Joi.string(),
			title: Joi.string().max(32),
			type: Joi.alternatives().try('Thread', 'Poll', 'Default'),
			userId: Joi.string()
		});
		const req = await request.json();
		if (requestSchema.validate(req).error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const { parentUUID, parentCategory, title, type, userId } = req;
		let tree;

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
			if (
				!parent.linking_categories
					.find((lc) => lc.id === parentCategory)
					?.nodesAllowed.includes(type)
			)
				throw { status: 400, message: 'Node type not allowed' };

			const node = tree.createNode(parent, parentCategory, title, type, undefined, [username]);
			if (!node) throw { status: 400, message: 'error occured while creating node' };

			const postPromises: any = [
				supabaseService.from('Tree').update({ data: tree.getTree(), changing: 0 }).eq('id', 1)
			];
			if (type === 'Default')
				postPromises.push(
					supabaseService.from('Nodes').insert({ uuid: node.uuid, title, tldr: { ops: [] } })
				);
			else if (type === 'Thread')
				postPromises.push(supabaseService.from('Threads').insert({ uuid: node.uuid }));

			const results = await Promise.all(postPromises);

			results.forEach((result) => {
				if (result.error) throw { status: 400, message: result.error.message };
			});

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
