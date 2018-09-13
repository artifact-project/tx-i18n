import * as i18next from 'i18next';
import { reactI18nextModule } from 'react-i18next';
import { setLocale } from '../index';

import { addLocaleData } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as ru from 'react-intl/locale-data/ru';

addLocaleData([...en, ...ru]);

i18next
	.use(reactI18nextModule)
	.init({
		fallbackLng: 'en',
		ns: ['translations'],
		defaultNS: 'translations',
		interpolation: {
			escapeValue: false,
		},
		react: {
			wait: true,
		},
		resources: {
			en: {
				translations: {
					simpleContent: 'Just simple content',
					nameTitle: 'this is your name',
					userMessagesUnread: 'Hello <1><0>{{name}}</0></1>, you have unread messages: <3>{{count}}</3>. <5>Go to messages</5>.',
				},
			},
			ru: {
				translations: {
					simpleContent: 'Просто текст',
					nameTitle: 'это ваше имя',
					userMessagesUnread: 'Привет <1><0>{{name}}</0></1>, у вас непрочитанных сообщений: <3>{{count}}</3>. <5>Перейти к сообщениям</5>.'
				},
			},
		},
	})
;

setLocale('ru', {
	'Just simple content': 'Просто текст',
	'this is your name': 'это ваше имя',
	'Hello <1><#2></1>, you have unread messages: <#3>. <4>Go to messages</4>.': 'Привет <1><#2></1>, у вас непрочитанных сообщений: <#3>. <4>Перейти к сообщениям</4>.'
});

export const langDicts = {
	ru: {
		simpleContent: 'Просто текст',
		nameTitle: 'это ваше имя',
		userMessagesUnread: `Привет {name}, у вас непрочитанных сообщений: {unreadCount, number}.`,
		goTo: 'Перейти к сообщениям',
	},
	en: {
		nameTitle: `this is your name`,
	},
};

export {
	i18next,
};
