import { fail, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	depends,
	locals: { supabase, getSession, supabaseService }
}) => {
	depends('supabase:auth');

	const session = await getSession();

	if (!session) {
		return redirect(303, '/');
	}
	const {
		data: { user }
	} = await supabase.auth.getUser();

	const profilePromise = supabase
		.from('Profiles')
		.select('username, full_name, changes, selected_strategies')
		.eq('user_id', user?.id)
		.single();

	const hierPromise = supabase.from('Tree').select('data').eq('id', 1);

	const [profileResult, hierResult] = await Promise.all([profilePromise, hierPromise]);

	if (profileResult?.error) {
		return fail(400, {
			message: profileResult.error.message
		});
	}

	if (hierResult?.error) {
		return fail(400, {
			message: hierResult.error.message
		});
	}

	return {
		session,
		props: {
			profile: profileResult.data,
			hier: hierResult.data
		}
	};
};
