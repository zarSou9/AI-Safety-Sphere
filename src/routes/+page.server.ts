import { fail } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends, locals: { supabase, getSession } }) => {
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
			.select('username, full_name, created_at')
			.eq('user_id', user?.id)
			.single();

		const hierPromise = supabase.from('Tree').select('data').eq('id', 1);

		const [profileResult, hierResult] = await Promise.all([profilePromise, hierPromise]);

		if (profileResult?.error) {
			throw fail(400, {
				message: profileResult.error.message
			});
		}

		if (hierResult?.error) {
			throw fail(400, {
				message: hierResult.error.message
			});
		}

		return {
			session,
			props: {
				profile: profileResult.data,
				hier: hierResult.data,
				loggedIn
			}
		};
	} else {
		const hierResult = await supabase.from('Tree').select('data').eq('id', 1);

		if (hierResult?.error) {
			throw fail(400, {
				message: hierResult.error.message
			});
		}

		return {
			session,
			props: {
				hier: hierResult.data,
				loggedIn
			}
		};
	}
};
