import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { problemEdit } from '$lib/server/schemas';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const data: { problemChange: any } = await request.json();

		const { data: userData } = await supabase.auth.getUser();

		const userId = userData.user?.id;

		const editsPromise = supabase.from('Problems').select('edits').eq('id', data.problemChange.id);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [editsResult, usernameResult] = await Promise.all([editsPromise, usernamePromise]);

		if (editsResult?.error) throw { status: 400, message: editsResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const edits = editsResult.data[0].edits;
		const username = usernameResult.data[0].username;

		const pe = problemEdit.validate(data.problemChange.quills);

		if (pe?.error) throw { status: 400, message: pe.error.message };

		edits.push({ owner: username, sections: pe.value });

		const { error } = await supabaseService
			.from('Problems')
			.update({ edits })
			.eq('id', data.problemChange.id);

		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
