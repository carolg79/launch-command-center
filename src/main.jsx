import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Demo from './Demo.jsx'

// /         → Main app
// /#demo    → Animated demo
const isDemo = window.location.hash === '#demo'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDemo ? <Demo /> : <App />}
  </React.StrictMode>,
)
