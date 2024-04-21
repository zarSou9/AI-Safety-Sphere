import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
//import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';
import type { RequestContext } from '@sveltejs/adapter-vercel';

export const config = {
	runtime: 'edge'
};

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, color, username, userColors } = await request.json();

		// const idValid = Joi.string().validate(id);
		// const usernameValid = Joi.string().validate(username);
		// const colorValid = Joi.string().validate(color);

		// if (idValid.error || usernameValid.error || colorValid.error)
		// 	throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		setTimeout(() => {
			supabaseService.from('Problems').update({ testing: true }).eq('id', id);
		}, 15000);

		if (color) userColors.push({ color, user: username });

		const { error } = await supabaseService
			.from('Problems')
			.update({ active_user: username, userColors })
			.eq('id', id);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'User now active!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
