import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals: { supabase, getSession } }) => {
	try {
		const session = await getSession();
		if (session) {
			await supabase.auth.signOut();
		}
		return json({ message: 'User signed out!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
