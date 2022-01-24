import {createPlural, createPluralRules, createPluralCardinalCategorizer} from '@artifact-project/i18n';

/** [en] English: plural rules */
const enPluralRules = createPluralRules({
	code: 'en',
	name: 'English',
	cardinal: {
		one: 'i = 1 and v = 0',
		other: '',
	},
	range: {
		'one+other': 'other',
		'other+one': 'other',
		'other+other': 'other',
	},
});

/** [en] English: plural cardinal categorizer */
const enPluralCardinalCategorizer = createPluralCardinalCategorizer(
	enPluralRules,
	(n: string, i: number, f: number, v: number) => {
		if (i == 1 && v == 0) {
			return 'one';
		}

		return 'other';
	},
);

/** [en] English: plural method (cardinal & range) */
export const enPlural = createPlural(enPluralRules, enPluralCardinalCategorizer);
export default enPlural;
