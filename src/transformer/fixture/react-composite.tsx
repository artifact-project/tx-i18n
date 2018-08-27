import * as React from 'react';
import { Hello } from './react';

export const DeepHello = (props) => {
	return <div>
		<Hello {...props}/> или Нет!
	</div>
};

export const Dialog = (props) => (
	<div className="host">
		<h1>Alert</h1>
		<form>
			<h2>Бла-бла-бла</h2>
			<fieldset>
				<div className="row">
					<div className="col">Ширина:</div>
					<div className="col">123px</div>
				</div>
				<div className="row">
					<div className="col">
						Да{' '}
						<input type="checked"/>
					</div>
				</div>
			</fieldset>
		</form>
	</div>
);
