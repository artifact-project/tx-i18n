import { transform, reactLoad, reactRender } from './test-utils';
import { setDefaultLocale, setLocale, setLang } from '../i18n/locale';
import { getPhrases, resetPhrases } from './transformer';
import { plural } from '../../icu/plural/en';
import { plural as ruPlural } from '../../icu/plural/ru';


beforeEach(() => {
	setLang('default')
	resetPhrases();
	setDefaultLocale({}, plural as any);
})

describe('react-icu', () => {
	describe('transform', () => {
		it('Info', () => {
			expect(transform('react-icu')).toMatchSnapshot();
			expect(getPhrases().default.map(v => v.value)).toEqual([
				'You have <a1>{v2, plural, one {# unread message} other {# unread messages}}</a1>.',
				'Total:',
				'{v1, plural, one {# message} other {# messages}}',
			]);
		});
	});

	describe('render', () => {
		const blocks = reactLoad('react-icu');

		it('Info', () => {
			expect(reactRender(blocks.Info, {unread: 1, total: 13})).toMatchSnapshot();
		});

		it('Info: ru', () => {
			setLang('ru');
			setLocale('ru', {
				default: {
					'You have <a1>{v2, plural, one {# unread message} other {# unread messages}}</a1>.': `У вас <a1>{v2, plural,
						one {# непрочитанное сообщение}
						few {# непрочитанных сообщения}
						many {# непрочитанных сообщений}
						other {# непрочитанных сообщений}
					}</a1>.`,
					'Total:': 'Всего:',
					'{v1, plural, one {# message} other {# messages}}': `{v1, plural,
						one {# сообщение}
						few {# сообщения}
						many {# сообщений}
						other {# сообщений}
					}`,
				},
			}, ruPlural);
			expect(reactRender(blocks.Info, {unread: 1, total: 13})).toMatchSnapshot();
		});

		it('Info: ru (partial)', () => {
			setLang('ru');
			setLocale('ru', {
				default: {
					'{v1, plural, one {# message} other {# messages}}': `{v1, plural,
						one {# сообщение}
						few {# сообщения}
						many {# сообщений}
						other {# сообщений}
					}`,
				},
			}, ruPlural);
			expect(reactRender(blocks.Info, {unread: 1, total: 13})).toMatchSnapshot();
		});
	});
});