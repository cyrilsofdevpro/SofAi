import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

try {
	const rootEl = document.getElementById('root')
	if (!rootEl) throw new Error('Root element not found')
	const root = createRoot(rootEl)
	root.render(<App />)
} catch (err) {
	// Write error to page so it's visible instead of a white screen
	console.error('Runtime render error', err)
	document.body.style.background = '#fff'
	document.body.style.color = '#000'
	document.body.innerText = 'Runtime error: ' + (err && err.message ? err.message : String(err))
}
