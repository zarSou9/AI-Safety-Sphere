import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type { ThreadPost } from '$lib/types';
import { createTree } from '$lib/stores/nodes';

import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const requestSchema = Joi.object({
			uuid: Joi.string(),
			postID: Joi.string(),
			userId: Joi.string()
		});
		const req = await request.json();
		if (requestSchema.validate(req).error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const { uuid, userId, postID }: { uuid: string; userId: string; postID: string } = req;

		let posts: ThreadPost[] = [];

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const threadeDataPromise = supabaseService
				.from('Threads')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.eq('uuid', uuid)
				.select('posts');
			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
			const treePromise = supabase.from('Tree').select('data').eq('id', 1);

			const [threadData, usernameResult, treeResult] = await Promise.all([
				threadeDataPromise,
				usernamePromise,
				treePromise
			]);

			if (threadData?.error) throw { status: 400, message: threadData.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
			if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

			if (!threadData.data.length) continue;

			const username = usernameResult.data[0].username;
			posts = threadData.data[0].posts;

			const tree = createTree();

			tree.setTree(treeResult.data[0].data);
			const treeNode = tree.getObjFromId(uuid);
			const owners = treeNode?.owners;

			const post = posts.find((p) => p.id === postID);
			if (!post) throw { status: 400, message: 'Could not find post' };
			if (post.owner !== username && !owners?.includes(username))
				throw { status: 400, message: 'Unauthorized' };

			posts.splice(
				posts.findIndex((p) => p.id === postID),
				1
			);

			const { data, error } = await supabaseService
				.from('Threads')
				.update({ posts, changing: 0 })
				.eq('uuid', uuid)
				.select('posts');
			if (error) throw { status: 400, message: error.message };
			posts = data[0].posts;
			break;
		}

		return json({ message: 'Data submitted successfully', data: posts }, { status: 200 });
	} catch (error: any) {
		await supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
