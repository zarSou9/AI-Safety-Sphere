import Joi from 'joi';

const delta = Joi.object({
	ops: Joi.array()
		.items(
			Joi.object({
				insert: Joi.alternatives().try(
					Joi.string(),
					Joi.object({ image: Joi.string().required() })
				),
				delete: Joi.number().positive(),
				retain: Joi.number().positive(),
				attributes: Joi.object({
					link: Joi.string(),
					header: Joi.number().min(1).max(3),
					'code-block': Joi.string(),
					bold: true,
					underline: true,
					list: Joi.string().valid('bullet', 'ordered'),
					align: Joi.string()
				}).min(1)
			}).xor('insert', 'delete', 'retain')
		)
		.min(1)
		.required()
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

export { problems, strategies, strategyEdit, problemEdit };
