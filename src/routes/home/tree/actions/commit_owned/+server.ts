import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Delta from 'quill-delta';
import { problems, strategies } from '$lib/server/schemas';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const data: { type: string; nodeChanges: any } = await request.json();

		if (!data?.type || !data?.nodeChanges) {
			throw { status: 400, message: 'Bad Request: Missing required fields' };
		}

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const ownersPromise = supabaseService
			.from('Node_Ownership')
			.select('owners')
			.eq('id', data.nodeChanges.id);
		const userPromise = supabase.auth.getUser();
		let nodePromise;
		if (data.type === 's') {
			nodePromise = supabaseService
				.from('Strategies')
				.select('id,title,tldr,prerequisites,content,references')
				.eq('id', data.nodeChanges.id);
		} else if (data.type === 'p' || data.type === 'r') {
			nodePromise = supabaseService
				.from('Problems')
				.select(
					'id,title,tldr,prerequisites,content,measurable_objective,skills_needed,existing_work,references'
				)
				.eq('id', data.nodeChanges.id);
		} else {
			throw { status: 400, message: 'invalid node id' };
		}

		const [treeResult, ownersResult, userResult, nodeResult] = await Promise.all([
			treeDataPromise,
			ownersPromise,
			userPromise,
			nodePromise
		]);

		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };
		if (ownersResult?.error) throw { status: 400, message: ownersResult.error.message };
		if (userResult?.error) throw { status: 400, message: userResult.error.message };
		if (nodeResult?.error) throw { status: 400, message: nodeResult.error.message };

		const owners = ownersResult.data[0].owners;
		const user = userResult.data.user;
		let node: any = nodeResult.data[0];
		const tree = createTree();
		tree.setTree(treeResult.data[0].data);

		if (!owners.includes(user.id)) throw { status: 400, message: 'Permission denied' };

		if (data.type === 's') {
			let quillKeys = ['tldr', 'prerequisites', 'content', 'references'];

			if (data.nodeChanges?.title && data.nodeChanges?.title?.length)
				node.title = data.nodeChanges.title;

			quillKeys.forEach((key) => {
				if (key in node) {
					node[key] = new Delta(node[key]);
					if (key in data.nodeChanges) node[key] = node[key].compose(data.nodeChanges[key]);
					else node[key] = data.nodeChanges[key];
				} else if (data.nodeChanges && key in data.nodeChanges) node[key] = data.nodeChanges[key];
			});
			const { error } = strategies.validate([node]);
			if (error) throw { status: 400, message: error.message };
		} else {
			const quillKeys = [
				'tldr',
				'prerequisites',
				'content',
				'measurable_objective',
				'skills_needed',
				'existing_work',
				'references'
			];

			if (data.nodeChanges?.title && data.nodeChanges?.title?.length)
				node.title = data.nodeChanges.title;

			quillKeys.forEach((key) => {
				if (key in node) {
					node[key] = new Delta(node[key]);
					if (key in data.nodeChanges) node[key] = node[key].compose(data.nodeChanges[key]);
				} else if (data.nodeChanges && key in data.nodeChanges) node[key] = data.nodeChanges[key];
			});
			const { error } = problems.validate([node]);
			if (error) throw { status: 400, message: error.message };
		}

		const obj = tree.getObjFromId(node.id);
		obj.data.title = node.title;
		obj.data.tldr = node.tldr;

		let nodeUpdatePromise;
		if (data.type === 's') {
			nodeUpdatePromise = supabaseService.from('Strategies').update(node).eq('id', node.id);
		} else {
			nodeUpdatePromise = supabaseService.from('Problems').update(node).eq('id', node.id);
		}
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);

		const [nodeUpdateResult, treeUpdateResult] = await Promise.all([
			nodeUpdatePromise,
			treePromise
		]);

		if (nodeUpdateResult?.error) throw { status: 400, message: nodeUpdateResult.error.message };
		if (treeUpdateResult?.error) throw { status: 400, message: treeUpdateResult.error.message };

		return json({ message: 'Data submitted successfully', newNode: node }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
