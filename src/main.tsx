import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Bootstrap CSS import
import './styles/css/bootstrap/bootstrap.min.css';

// CSS 파일들 import
import './styles/css/app.css'
import './styles/css/chat-sidebar.css'
import './styles/css/chat-input.css'
import './styles/css/usage-info.css'
import './styles/css/index.css'
import './styles/css/message-display.css'
import './styles/css/settings-panel.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)