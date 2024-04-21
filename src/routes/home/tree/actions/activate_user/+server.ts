import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';
import type { RequestContext } from '@sveltejs/adapter-vercel';

export const config = {
	runtime: 'edge'
};

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const POST: any = async (
	{ request, locals: { supabase, supabaseService } }: any,
	context: RequestContext
) => {
	console.log(context);
	// context.waitUntil(
	// 	wait(11000).then(() => {
	// 		console.log('hi');
	// 	})
	// );
	try {
		const { id, color, username, userColors } = await request.json();

		const idValid = Joi.string().validate(id);
		const usernameValid = Joi.string().validate(username);
		const colorValid = Joi.string().validate(color);

		if (idValid.error || usernameValid.error || colorValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

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
