import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [num, setNumber] = useState(2);
	const onClickHandler = () => {
		setNumber((num) => (num + 1));
		setNumber((num) => (num + 1));
		setNumber((num) => (num + 1));
	}

	return (
		<div >
			<div onClick={onClickHandler}>
				{num}
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
