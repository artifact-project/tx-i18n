import i18n from './i18n';

it('i18n', () => {
	expect(i18n('Hi', [])).toBe('Hi');
	expect(i18n('Hi, <#1>!', ['i18n'])).toBe('Hi, i18n!');
});