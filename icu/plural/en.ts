import { createPlural } from '@artifact-project/i18n';

export const plural = createPlural('en', {
	name: 'English',

	cardinal: {
		one: 'i = 1 and v = 0',
		other: '',
	},

	ordinal: {
		one: 'n % 10 = 1 and n % 100 != 11',
		two: 'n % 10 = 2 and n % 100 != 12',
		few: 'n % 10 = 3 and n % 100 != 13',
		other: '',
	},

	range: {
		'one+other': 'other',
		'other+one': 'other',
		'other+other': 'other',
	},
});
