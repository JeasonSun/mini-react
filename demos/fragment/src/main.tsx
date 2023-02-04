import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [num, setNumber] = useState(2);
	const onClickHandler = () => {
		setNumber(num + 1);
	}
	const list = num % 2 === 0 ? [
		<p key="A1">A1</p>,
		<p key="A2">A2</p>,
		<p key="A3">A3</p>
	] : [
		<p key="A3">A3</p>,
		<p key="A2">A2</p>
	]
	const single = num % 2 === 1 ? [<><p key="A1">A1</p><p key="A2">A2</p></>] : <p key="A2">A2</p>

	return (
		<div >
			<div onClick={onClickHandler}>
				{single}
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
