import { fail } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createTree } from '$lib/stores/nodes';

export const load: LayoutServerLoad = async ({
	depends,
	locals: { supabase, supabaseService, getSession }
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
			.select('username, full_name, created_at')
			.eq('user_id', user?.id)
			.single();
		const hierPromise = supabaseService.from('Tree').select('data').eq('id', 1);
		const profilesPromise = supabaseService.from('Profiles').select('username');

		const [profileResult, hierResult, profilesResult] = await Promise.all([
			profilePromise,
			hierPromise,
			profilesPromise
		]);

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
		if (profilesResult?.error) {
			throw fail(400, {
				message: profilesResult.error.message
			});
		}

		const tree = createTree();

		if (hierResult.data[0]?.data?.node) {
			tree.setTree(hierResult.data[0].data);
		} else {
			throw fail(400, {
				message: 'Error loading tree'
			});
		}

		return {
			session,
			props: {
				profile: profileResult.data,
				hier: tree.getTree(profileResult.data.username),
				profiles: profilesResult.data.map((prof) => prof.username) as string[],
				loggedIn
			}
		};
	} else {
		const hierPromise = supabaseService.from('Tree').select('data').eq('id', 1);
		const profilesPromise = supabaseService.from('Profiles').select('username');

		const [hierResult, profilesResult] = await Promise.all([hierPromise, profilesPromise]);
		if (hierResult?.error) {
			throw fail(400, {
				message: hierResult.error.message
			});
		}
		if (profilesResult?.error) {
			throw fail(400, {
				message: profilesResult.error.message
			});
		}

		const tree = createTree();

		if (hierResult.data[0]?.data?.node) {
			tree.setTree(hierResult.data[0].data);
		} else {
			throw fail(400, {
				message: 'Error loading tree'
			});
		}

		return {
			session,
			props: {
				hier: tree.getTree(true),
				profiles: profilesResult.data.map((prof) => prof.username) as string[],
				loggedIn
			}
		};
	}
};
