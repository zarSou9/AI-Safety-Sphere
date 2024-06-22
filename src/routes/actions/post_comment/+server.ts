import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type { ThreadPost } from '$lib/types';

import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { uuid, comment, userId }: { uuid: string; comment: string; userId: string } =
			await request.json();

		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);
		const commentValid = Joi.string().validate(comment);

		if (userIdValid.error || uuidValid.error || commentValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

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

			const [threadData, usernameResult] = await Promise.all([threadeDataPromise, usernamePromise]);

			if (threadData?.error) throw { status: 400, message: threadData.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

			if (!threadData.data.length) continue;

			const user = usernameResult.data[0].username;
			posts = threadData.data[0].posts;

			posts.push({ owner: user, post: comment, vote: 0, created_at: now });

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
