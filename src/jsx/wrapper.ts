import * as React from 'react';
import { addLangObserver } from '../i18n/locale';

export class Wrapper extends React.Component<{value: Function}, {lang: string}> {
	private unsubscribe: () => void;
	state = {lang: ''};

	componentDidMount() {
		this.unsubscribe = addLangObserver((lang) => {
			this.setState({lang});
		});
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	shouldComponentUpdate(_, nextState) {
		return nextState.lang !== this.state.lang;
	}

	render() {
		return this.props.value();
	}
}
