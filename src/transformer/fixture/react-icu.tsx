import * as React from 'react';
import { enPlural as plural } from '../../../icu/plural/en';

export type InfoProps = {
	unread: number;
	total: number;
}

export const Info = ({unread, total}: InfoProps) => <>
	<div data-id="unread">
		You have <a href="#">{plural(unread, {one: '# unread message', other: '# unread messages'})}</a>.
	</div>
	<div data-id="total">
		<label>Total:</label>
		<b>{plural(total, {one: '# message', other: '# messages'})}</b>
	</div>
</>;