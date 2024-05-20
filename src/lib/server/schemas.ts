import Joi from 'joi';

const delta = Joi.object({
	ops: Joi.array()
		.items(
			Joi.object({
				insert: Joi.alternatives().try(
					Joi.string(),
					Joi.object({
						image: Joi.string()
					}),
					Joi.object({
						video: Joi.string()
					}),
					Joi.object({
						formula: Joi.string()
					})
				),
				delete: Joi.number().positive(),
				retain: Joi.number().positive(),
				attributes: Joi.object({
					bold: Joi.alternatives().try(true, null, false),
					italic: Joi.alternatives().try(true, null, false),
					underline: Joi.alternatives().try(true, null, false),
					strike: Joi.alternatives().try(true, null, false),
					script: Joi.alternatives().try('super', 'sub', null, false),
					blockquote: Joi.alternatives().try(true, null, false),
					link: Joi.alternatives().try(Joi.string().max(10000), null, false),
					align: Joi.alternatives().try('justify', 'right', 'left', 'center', null, false),
					color: Joi.alternatives().try(Joi.string().max(20), null, false),
					font: Joi.alternatives().try(Joi.string().max(100), null, false),
					height: Joi.string().max(20),
					width: Joi.string().max(20),
					code: Joi.alternatives().try(true, null, false),
					list: Joi.alternatives().try('bullet', 'ordered', null, false),
					indent: Joi.alternatives().try(Joi.number().max(100), null, false)
				}).min(1)
			}).xor('insert', 'delete', 'retain')
		)
		.required()
});

const tldrDelta = Joi.object({
	ops: Joi.array()
		.items(
			Joi.object({
				insert: Joi.alternatives().try(
					Joi.string(),
					Joi.object({
						formula: Joi.string()
					})
				),
				delete: Joi.number().positive(),
				retain: Joi.number().positive(),
				attributes: Joi.object({
					bold: Joi.alternatives().try(true, null, false),
					italic: Joi.alternatives().try(true, null, false),
					underline: Joi.alternatives().try(true, null, false),
					strike: Joi.alternatives().try(true, null, false),
					script: Joi.alternatives().try('super', 'sub', null, false),
					blockquote: Joi.alternatives().try(true, null, false),
					link: Joi.alternatives().try(Joi.string().max(10000), null, false),
					align: Joi.alternatives().try('justify', 'right', 'left', 'center', null, false),
					color: Joi.alternatives().try(Joi.string().max(20), null, false),
					font: Joi.alternatives().try(Joi.string().max(100), null, false),
					code: Joi.alternatives().try(true, null, false),
					list: Joi.alternatives().try('bullet', 'ordered', null, false),
					indent: Joi.alternatives().try(Joi.number().max(100), null, false)
				}).min(1)
			}).xor('insert', 'delete', 'retain')
		)
		.required()
});

const strategySchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required()
});

export { strategySchema, tldrDelta, delta };
