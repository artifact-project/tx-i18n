import * as React from 'react';
import __ from 'tx-i18n';
import { translate, Trans } from 'react-i18next';

type i18nextProps = {
	t: (id: string) => string;
	i18n: {
		changeLanguage: (lang: string) => void;
	};
}

type BenchProps = {
	name: string;
	count: number;
}

class Link extends React.Component<{to: string}> {
	render() {
		return <a href={this.props.to}>{this.props.children}</a>;
	}
}

const Bench = {
	'react-i18next': translate('translations')(({name, count, t}: BenchProps & i18nextProps) => (
		<div>
			<div>{t('simpleContent')}</div>
			<div>
				<Trans i18nKey="userMessagesUnread" count={count}>
					Hello <strong title={t('nameTitle')}>{{name}}</strong>, you have {{count}} unread message.{' '}
					<Link to="/msgs">Go to messages</Link>.
				</Trans>
			</div>
		</div>
	)),

	'react-intl': ({name, count}: BenchProps) => (
		<div>
			<div>
				<FormattedMessage
					id="simpleContent"
					defaultMessage={`Just simple content`}
				/>
			</div>
			<div>
				<FormattedMessage
					id="userMessagesUnread"
					defaultMessage={`Hello {name}, you have {unreadCount, number} {unreadCount, plural,
						one {message}
						other {messages}
					}`}
					values={{
						name: <strong>{name}</strong>,
						unreadCount: count,
					}}
				/>
			</div>
		</div>
	),

	'tx-i18n': ({name, count}: BenchProps) => (
		<div>
			<div>{__('Just simple content')}</div>
			{__.jsx(
				'Hello <1><#2></1>, you have <#3> unread message.<#4><5>Go to messages</5>.',
				{type: 'div', props: null},
				{type: 'strong', props: {title: __('this is your name')}},
				name,
				count,
				' ',
				{type: Link, props: {to: '/msg'}},
			)}
		</div>
	),
};
