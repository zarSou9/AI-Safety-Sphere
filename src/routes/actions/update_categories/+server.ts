import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import type { LinkingCategory, TreeInterface } from '$lib/types';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const LinkingCategoriesSchema = Joi.array().items(
			Joi.object({
				id: Joi.string().required(),
				title: Joi.string().required().max(22),
				description: Joi.string().required().allow('').max(310),
				color: Joi.alternatives().try(
					'#3f3f3f',
					'#46966c',
					'#6d4ba3',
					'#3f8b91',
					'#b04d35',
					'#68497a',
					'#8d8142'
				),
				type: Joi.alternatives().try('Thread', 'Poll', 'Default', 'Collapsed')
			}).required()
		);

		const {
			uuid,
			newCategories,
			userId
		}: { uuid: string; newCategories: LinkingCategory[]; userId: string } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);
		const newCategoriesValid = LinkingCategoriesSchema.validate(newCategories);
		let tree: TreeInterface;
		if (userIdValid.error || uuidValid.error || newCategoriesValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const treeDataPromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');
			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

			const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

			if (treeData?.error) throw { status: 400, message: treeData.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

			if (!treeData.data.length) continue;

			const username = usernameResult.data[0].username;

			tree = createTree();

			tree.setTree(treeData.data[0].data);
			const treeNode = tree.getObjFromId(uuid);
			if (!treeNode) throw { status: 400, message: 'Node does not exist' };
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}
			treeNode?.children.forEach((child) => {
				const deletedCategory = !newCategories.find((cat) => cat.id === child.parent_category);
				if (deletedCategory)
					throw { status: 400, message: 'Cannot delete category with child nodes' };
			});
			const oldCats = treeNode.linking_categories;
			treeNode.linking_categories = newCategories;

			const postPromises: any = [];
			newCategories.forEach((newCat) => {
				if (newCat.type === 'Poll' || newCat.type === 'Thread') {
					const oldFound = oldCats.find((cat) => cat.id === newCat.id);
					if (oldFound) {
						if (oldFound.type !== newCat.type)
							throw {
								status: 400,
								message: `Cannot change category of ${oldFound.type.toLowerCase()} node`
							};
					} else {
						if (newCat.type === 'Thread') {
							const newThread = tree.createThread(treeNode, newCat.id, owners);
							postPromises.push(
								supabaseService.from('Threads').insert([{ uuid: newThread?.uuid }])
							);
						} else if (newCat.type === 'Poll') {
						}
					}
				}
			});

			postPromises.push(
				supabaseService.from('Tree').update({ data: tree.getTree(), changing: 0 }).eq('id', 1)
			);

			const results = await Promise.all(postPromises);

			results.forEach((result) => {
				if (result.error) throw { status: 400, message: result.error.message };
			});

			break;
		}

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree() } },
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
