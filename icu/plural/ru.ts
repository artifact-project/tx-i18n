import {createPlural, createPluralRules, createPluralCardinalCategorizer} from '@artifact-project/i18n';

/** [ru] Russian: plural rules */
const ruPluralRules = createPluralRules({
	code: 'ru',
	name: 'Russian',
	cardinal: {
		one: 'v = 0 and i % 10 = 1 and i % 100 != 11',
		few: 'v = 0 and i % 10 = 2..4 and i % 100 != 12..14',
		many: 'v = 0 and i % 10 = 0 or v = 0 and i % 10 = 5..9 or v = 0 and i % 100 = 11..14',
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

/** [ru] Russian: plural cardinal categorizer */
const ruPluralCardinalCategorizer = createPluralCardinalCategorizer(
	ruPluralRules,
	(n: string, i: number, f: number, v: number) => {
		if (v == 0 && i % 10 == 1 && i % 100 != 11) {
			return 'one';
		}

		if (v == 0 && (i % 10  >= 2 && i % 10  <= 4) && !(i % 100  >= 12 && i % 100  <= 14)) {
			return 'few';
		}

		if (v == 0 && i % 10 == 0 || v == 0 && (i % 10  >= 5 && i % 10  <= 9) || v == 0 && (i % 100  >= 11 && i % 100  <= 14)) {
			return 'many';
		}

		return 'other';
	},
);

/** [ru] Russian: plural method (cardinal & range) */
export const ruPlural = createPlural(ruPluralRules, ruPluralCardinalCategorizer);
export default ruPlural;
