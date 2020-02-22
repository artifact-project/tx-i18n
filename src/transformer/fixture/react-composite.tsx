import * as React from 'react';
import { Hello } from './react';

type ButtonProps = {
	name: string;
	text: string;
	hint?: string;
	primary?: boolean;
}

export const DeepHello = (props) => {
	return <div>
		<Hello {...props}/> или Нет!
	</div>
};

export const Button = ({name, text, hint, primary}: ButtonProps) => {
	return <button name={name} value={text} title={hint} type={primary ? 'submit' : 'button'}/>
}

export const Form = (props) => {
	return (
		<form>
			{props.children}
			<div>
				{props.controls}
			</div>
		</form>
	)
}

export class Dialog extends React.Component<any> {
	innerRender(props) {
	}


	render() {
		const {props} = this;
		const text = "Тест \"фу\" бар";

		return (
			<div className="host">
				<h1>
					Заголовок <i/> да её и
					мультилайн, да-да.
				</h1>
				<h3>{text}</h3>

				<Form controls={
					<div title="Подвал">
						<Button
							name="submit"
							text="Хорошо"
							hint={`Подсказка: ${123}!`}
						/>
						<button value="Отмена" data-id={`рав-текст`}/>
					</div>
				}>
					<h2>{`
						Ох, а вот ещё один
						мультилайн заголовок.
					`}</h2>
					{/** @tx-i18n context: form */}
					<fieldset>
						<div data-key="props" className="row">
							<div className="col">Ширина:</div>
							<div className="col">123px</div>
						</div>
						<div data-key="cbx" className="row">
							<div className="col">
								Да{' '}
								<input type="checked" checked/>
							</div>
						</div>
						<div data-key="inner">
							{this.innerRender({...props, value: 'Тест'})}
							Окей
						</div>
						<p data-key="footer">
							<button value="Отмена" />
							или
							<Button
								name="save"
								text="Сохранить"
								primary
							/>
						</p>
					</fieldset>
				</Form>
			</div>
		);
	}
}
