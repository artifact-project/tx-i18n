import { plural } from '../../icu/plural/en';
import { i18n } from './i18n';
import { SubMessages } from '@artifact-project/i18n';

describe('i18n', () => {
	it('ICU simple message', () => {
		expect(i18n('Hi', [])).toBe('Hi');
		expect(i18n('Hi, {v1}!', ['i18n'])).toBe('Hi, i18n!');
	});

	it('ICU quote', () => {
		expect(i18n(`Hi '{username}'!`, [])).toBe('Hi {username}!');
	});

	it('ICU plural', () => {
		const msg = `You have {v1, plural,
			one {# message}
			other {# messages}
			=0 {zero messages}
		}.`;

		expect(i18n(msg, [{ $: plural, _: 5 }])).toBe('You have 5 messages.');
		expect(i18n(msg, [{ $: plural, _: 0 }])).toBe('You have zero messages.');
	});

	it('ICU select', () => {
		const msg = `{v1, select,
			male {His inbox}
			female {Her inbox}
			other {Their inbox}
		}`;

		expect(i18n(msg, [{ $: select, _: 'male' }])).toBe('His inbox');
		expect(i18n(msg, [{ $: select, _: 'xxx' }])).toBe('Their inbox');
	});

	it('ICU nested: select and plural', () => {
		const have = `have {v2, plural, one {# message} other {# messages}}.`
		const msg = `{v1, select,
			male {His ${have}}
			female {Her ${have}}
			other {Their ${have}}
		}`;

		expect(i18n(msg, [{ $: select, _: 'male' }, { $: plural, _: 1 }])).toBe('His have 1 message.');
		expect(i18n(msg, [{ $: select, _: 'xxx' }, { $: plural, _: 2 }])).toBe('Their have 2 messages.');
	});
});

function select<
	V extends string,
	SM extends SubMessages<V>
>(value: V, sub: SM) {
	return sub.hasOwnProperty(value) ? sub[value] : sub.other;
}
