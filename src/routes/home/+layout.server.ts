import { fail } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	depends,
	locals: { supabase, getSession, supabaseService }
}) => {
	depends('supabase:auth');

	const session = await getSession();

	let loggedIn = true;

	if (!session) {
		loggedIn = false;
	}
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (user) {
		const profilePromise = supabase
			.from('Profiles')
			.select('username, full_name, changes, selected_strategies, created_at')
			.eq('user_id', user?.id)
			.single();

		const hierPromise = supabase.from('Tree').select('data').eq('id', 1);
		const questionsPromise = supabase.from('Questions').select('*');

		const [profileResult, hierResult, questionsResult] = await Promise.all([
			profilePromise,
			hierPromise,
			questionsPromise
		]);

		if (profileResult?.error) {
			throw fail(400, {
				message: profileResult.error.message
			});
		}

		if (questionsResult?.error) {
			throw fail(400, {
				message: questionsResult.error.message
			});
		}

		if (hierResult?.error) {
			throw fail(400, {
				message: hierResult.error.message
			});
		}
		let newUser = true;

		const createdAt = new Date(profileResult.data.created_at);
		createdAt.setHours(0, 0, 0, 0);
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		if (createdAt.getTime() < now.getTime()) {
			newUser = false;
		}
		return {
			session,
			props: {
				profile: profileResult.data,
				hier: hierResult.data,
				newUser,
				questions: questionsResult.data,
				loggedIn
			}
		};
	} else {
		const hierPromise = await supabase.from('Tree').select('data').eq('id', 1);
		const questionsPromise = supabase.from('Questions').select('*');

		const [hierResult, questionsResult] = await Promise.all([hierPromise, questionsPromise]);

		if (hierResult?.error) {
			throw fail(400, {
				message: hierResult.error.message
			});
		}
		if (questionsResult?.error) {
			throw fail(400, {
				message: questionsResult.error.message
			});
		}

		let newUser = true;

		return {
			session,
			props: {
				hier: hierResult.data,
				newUser,
				questions: questionsResult.data,
				loggedIn
			}
		};
	}
};
