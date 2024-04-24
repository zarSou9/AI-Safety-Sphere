import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { uuid, timeElapsed, last_edit } = await request.json();

		const { data, error } = await supabase.from('Problems').select('last_edit').eq('uuid', uuid);
		if (error) throw {};

		if (data[0].last_edit === last_edit) {
			if (timeElapsed > 120000) {
				await supabaseService.from('Problems').update({ active_user: null }).eq('uuid', uuid);
			} else {
				await new Promise((resolve) => setTimeout(resolve, 9000));
				fetch('https://aisafetysphere.com/home/tree/actions/continue_timeout', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ uuid, timeElapsed: timeElapsed + 9200, last_edit })
				});
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
