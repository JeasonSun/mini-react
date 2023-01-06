import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [num, setNumber] = useState(2);
	return (
		<div onClickCapture={() => { console.log('click div') }}>
			<button onClickCapture={() => setNumber(num + 1)}>{num}</button>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
