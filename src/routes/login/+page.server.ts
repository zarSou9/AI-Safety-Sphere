import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.getSession();

	if (session) {
		throw redirect(303, '/');
	}

	return {
		session
	};
};

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			if (error.status === 400) {
				return fail(400, {
					error: 'Invalid credentials.',
					invalid: true,
					values: {
						email
					}
				});
			}
			return fail(400, {
				error: 'Server error. Try again later.',
				serverErr: true,
				values: {
					email
				}
			});
		}
		throw redirect(303, '/');
	}
};
