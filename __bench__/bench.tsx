import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as PropTypes from 'prop-types';
import __, { setLang } from '../index';
import { translate, Trans } from 'react-i18next';
import { IntlProvider, FormattedMessage } from 'react-intl';
import { i18next, langDicts } from './i18n.config';
import { Suite } from 'benchmark';

type i18nextProps = {
	t: (id: string) => string;
	i18n: {
		changeLanguage: (lang: string) => void;
	};
}

type BenchProps = {
	name: string;
	count: number;
	lang: string;
	langDict: any;
}

class Link extends React.Component<{to: string}> {
	render() {
		return <a href={this.props.to}>{this.props.children}</a>;
	}
}

const Bench = {
	'react-i18next': {
		setLang: (lang) => i18next.changeLanguage(lang),
		Block: translate('translations')((props: BenchProps & i18nextProps) => (
			<ReactI18Next data={props}/>
		)),
	},

	'react-intl': {
		setLang: (lang, render) => render(lang),
		Block: (props: BenchProps) => (
			<IntlProvider locale={props.lang} messages={props.langDict}>
				<ReactIntl data={props}/>
			</IntlProvider>
		),
	},

	'tx-i18n': {
		setLang: (lang, render) => {
			setLang(lang);
			render(lang)
		},
		Block: (props: BenchProps) => (
			<TxI18n data={props}/>
		),
	},
};

class ReactI18Next extends React.Component<{data: BenchProps & i18nextProps}> {
	render() {
		const {name, count, t} = this.props.data;

		return <div>
			<h1>{t('simpleContent')}</h1>
			<div>
				<Trans i18nKey="userMessagesUnread" count={count}>
					Hello <strong title={t('nameTitle')}>{{name}}</strong>, you have unread messages: {{count}}. <Link to="#msgs">Go to messages</Link>.
				</Trans>
			</div>
		</div>;
	}
}

class ReactIntl extends React.Component<{data: BenchProps}> {
	static contextTypes = {
		intl: PropTypes.object.isRequired,
	};

	render() {
		const {
			name,
			count,
		} = this.props.data;
		const {intl} = this.context;

		return <div>
				<h1>
					<FormattedMessage
						id="simpleContent"
						defaultMessage={`Just simple content`}
					/>
				</h1>
				<div>
					<FormattedMessage
						id="userMessagesUnread"
						defaultMessage={`Hello {name}, you have unread messages: {unreadCount, number}.`}
						values={{
							name: <strong title={intl.messages.nameTitle}>{name}</strong>,
							unreadCount: count,
						}}
					/>
					{' '}
					<Link to="#msgs">
						<FormattedMessage
							id="goTo"
							defaultMessage={`Go to messages`}
						/>
					</Link>.
				</div>
			</div>
	}
}

const TxI18n = ({data:{name, count}}: {data:BenchProps}) => (
	<div>
		<h1>{__('Just simple content')}</h1>
		{__.jsx(
			'Hello <1><#2></1>, you have unread messages: <#3>. <4>Go to messages</4>.',
			[
				{type: 'div', props: null},
				{type: 'strong', props: {title: __('this is your name')}},
				name,
				count,
				{type: Link, props: {to: '#msg'}},
			]
		)}
	</div>
);

const root = document.getElementById('root');
const report = document.getElementById('report');
const print = (v: string) => report.appendChild(document.createTextNode(v + '\n'));

function renderTest(name: string, Target: any) {
	const container = document.createElement('div');
	const render = (lang: keyof typeof langDicts) => ReactDOM.render(
		<Target.Block
			name="RubaXa"
			count={Math.random()}
			lang={lang}
			langDict={langDicts[lang]}
		/>,
		container,
	);

	root.insertBefore(container, root.firstChild);
	root.insertBefore(document.createTextNode(`>>>> ${name} <<<<`), root.firstChild);

	return {
		setLang: Target.setLang,
		render,
	};
}

let curLang = 'en' as keyof typeof langDicts;


window['define'] = {
	amd: {},
};


[
	{
		name: 'render(en)',
		test: (box) => {
			box.render('en');
		},
	},
	{
		name: 'render(ru)',
		before: (box) => box.setLang('ru', box.render),
		test: (box) => {
			box.render('ru');
		},
	},
	{
		name: 'switchLang()',
		before: (box) => box.render(curLang),
		test: (box) => {
			curLang = curLang === 'ru' ? 'en' : 'ru';
			box.setLang(curLang, box.render);
		},
	},
].reduce((queue, spec) => {
	return queue.then(() => new Promise<void>(resolve => {
		const suite = new Suite();

		Object.keys(Bench).forEach(key => {
			const item = renderTest(key, Bench[key]);

			if (spec.before) {
				spec.before(item);
			}

			suite.add(key, () => {
				spec.test(item);
			});
		});

		suite.on('cycle', (evt) => {
			print(` - ${evt.target}`);
		});

		suite.on('complete', function () {
			print('-----------------');
			print(`Fastest is ${this.filter('fastest').map('name')}`);
			print('\n\n');
			resolve();
		});

		print(`Start: ${spec.name}`);
		print('-----------------');
		suite.run({ async: true });
	}));
}, Promise.resolve());