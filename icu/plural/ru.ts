import { createPlural } from '@artifact-project/i18n';

export const plural = createPlural('ru', {
	name: 'Russian',

	cardinal: {
		one: 'v = 0 and i % 10 = 1 and i % 100 != 11',
		few: 'v = 0 and i % 10 = 2..4 and i % 100 != 12..14',
		many: 'v = 0 and i % 10 = 0 or v = 0 and i % 10 = 5..9 or v = 0 and i % 100 = 11..14',
		other: '',
	},

	ordinal: {
		other: '',
	},

	range: {
		'one+one': 'one',
		'one+few': 'few',
		'one+many': 'many',
		'one+other': 'other',
		'few+one': 'one',
		'few+few': 'few',
		'few+many': 'many',
		'few+other': 'other',
		'many+one': 'one',
		'many+few': 'few',
		'many+many': 'many',
		'many+other': 'other',
		'other+one': 'one',
		'other+few': 'few',
		'other+many': 'many',
		'other+other': 'other',
	},
});
