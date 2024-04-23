import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, timeElapsed, uuid } = await request.json();

		const { data, error } = await supabase.from('Strategies').select('last_edit').eq('id', id);
		if (error) throw {};

		if (data[0].last_edit === uuid) {
			if (timeElapsed > 10000) {
				await supabaseService.from('Strategies').update({ active_user: null }).eq('id', id);
			} else {
				setTimeout(() => {
					fetch('https://aisafetysphere.com/home/tree/actions/continue_timeout_strategy', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ id, timeElapsed: timeElapsed + 9600, uuid })
					});
				}, 9500);
			}
		}

		return json({ status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
