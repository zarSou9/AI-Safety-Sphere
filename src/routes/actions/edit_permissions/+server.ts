import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const requestSchema = Joi.alternatives().try(
			Joi.object({
				uuid: Joi.string(),
				userId: Joi.string(),
				members: Joi.array().items(Joi.string()),
				owners: Joi.array().items(Joi.string()),
				type: 'Default',
				anyonePermissions: Joi.alternatives().try('Can view', 'Cannot view'),
				memberPermissions: Joi.alternatives().try('Can edit', 'Can view')
			}),
			Joi.object({
				uuid: Joi.string(),
				userId: Joi.string(),
				members: Joi.array().items(Joi.string()),
				owners: Joi.array().items(Joi.string()),
				type: 'Thread',
				anyonePermissions: Joi.alternatives().try(
					'Can post & reply',
					'Can post',
					'Can reply',
					'Can view',
					'Cannot view'
				),
				memberPermissions: Joi.alternatives().try(
					'Can delete posts',
					'Can post & reply',
					'Can post',
					'Can reply',
					'Can view'
				)
			})
		);
		const req = await request.json();
		if (requestSchema.validate(req).error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const { uuid, userId, type, anyonePermissions, memberPermissions, members, owners } = req;
		let tree;
		let username: string;

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const treeDataPromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');
			const usernamePromise = supabase.from('Profiles').select('username, user_id');

			const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

			if (treeData?.error) throw { status: 400, message: treeData.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

			if (!treeData.data.length) continue;

			username = usernameResult.data.find((prof) => prof.user_id === userId)?.username;
			if (!username) throw { status: 400, message: 'User not found' };

			tree = createTree();

			tree.setTree(treeData.data[0].data);

			const treeNode = tree.getObjFromId(uuid);
			if (!treeNode) throw { status: 400, message: 'Parent node could not be found' };
			if (!treeNode.owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}

			const newMembers = members.filter(
				(m: string) => !!usernameResult.data.find((prof) => prof.username === m)
			);
			const newOwners = owners.filter(
				(m: string) => !!usernameResult.data.find((prof) => prof.username === m)
			);
			if (!newOwners.length) throw { status: 400, message: 'At least 1 owner required' };
			treeNode.owners = newOwners;
			treeNode.members = newMembers;

			if (treeNode.type !== type) throw { status: 400, message: 'Conflicting node type' };
			treeNode.memberPermissions = memberPermissions;
			treeNode.anyonePermissions = anyonePermissions;

			const postPromises: any = [
				supabaseService.from('Tree').update({ data: tree.getTree(), changing: 0 }).eq('id', 1)
			];

			const results = await Promise.all(postPromises);

			results.forEach((result) => {
				if (result.error) throw { status: 400, message: result.error.message };
			});

			break;
		}

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree(username) } },
			{ status: 200 }
		);
	} catch (error: any) {
		await supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
