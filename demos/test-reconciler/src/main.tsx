import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
function App() {
	const [num, setNumber] = useState(2);

	window.setNumber = setNumber;

	return <div>{num}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
