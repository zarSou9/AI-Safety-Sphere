import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import type { LinkingCategory, TreeInterface } from '$lib/types';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const requestSchema = Joi.object({
			uuid: Joi.string(),
			tldr: Joi.string().max(310).allow(''),
			title: Joi.string().max(32),
			vote_message: Joi.string().max(200).allow(''),
			userId: Joi.string()
		});
		const req = await request.json();
		if (requestSchema.validate(req).error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const { uuid, tldr, title, vote_message, userId } = req;

		let tree: TreeInterface;

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
			const treeNode = tree.getObjFromId(uuid);
			if (!treeNode) throw { status: 400, message: 'Node does not exist' };
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}
			treeNode.data.title = title;
			treeNode.data.tldr = tldr;

			const postPromises: any = [
				supabaseService.from('Tree').update({ data: tree.getTree(), changing: 0 }).eq('id', 1),
				supabaseService.from('Threads').update({ vote_message }).eq('uuid', uuid)
			];

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
