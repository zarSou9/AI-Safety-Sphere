import Joi from 'joi';

const delta = Joi.object({
	ops: Joi.array()
		.items(
			Joi.object({
				insert: Joi.string(),
				delete: Joi.number().positive(),
				retain: Joi.number().positive(),
				attributes: Joi.object({
					bold: true,
					italic: true
				}).min(1)
			}).xor('insert', 'delete', 'retain')
		)
		.min(1)
		.required()
});

const changeSchema = Joi.object({
	d: delta,
	cd: delta,
	pos: Joi.object({ i: Joi.number(), l: Joi.number() }),
	color: Joi.string(),
	owner: Joi.string(),
	attributes: Joi.array(),
	children: Joi.array(),
	deleteChildren: Joi.array()
});

const problemEdit = Joi.object({
	title: Joi.string(),
	tldr: delta,
	prerequisites: delta,
	content: delta,
	measurable_objective: delta,
	skills_needed: delta,
	existing_work: delta,
	references: delta
});

const strategyEdit = Joi.object({
	id: Joi.string(),
	title: Joi.string(),
	tldr: delta,
	prerequisites: delta,
	content: delta,
	references: delta
});

const problems = Joi.array().items(
	Joi.object({
		id: Joi.string().required(),
		title: Joi.string().required(),
		tldr: delta.required(),
		prerequisites: delta,
		content: delta.required(),
		measurable_objective: delta.required(),
		skills_needed: delta.required(),
		existing_work: delta,
		references: delta
	})
);

const strategies = Joi.array().items(
	Joi.object({
		id: Joi.string().required(),
		title: Joi.string().required(),
		tldr: delta.required(),
		prerequisites: delta.required(),
		content: delta.required(),
		references: delta
	})
);

export { problems, strategies, strategyEdit, problemEdit, delta, changeSchema };
