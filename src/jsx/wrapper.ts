import * as React from 'react';
import { addLangObserver } from '../i18n/locale';

export class Wrapper extends React.Component<{value: Function}> {
	private unsubscribe: () => void;

	componentDidMount() {
		this.unsubscribe = addLangObserver(() => {
			this.forceUpdate();
		});
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return this.props.value();
	}
}
