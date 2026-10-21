import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import StoreProvider from './store/StoreProvider.jsx'
import PreferencesProvider from './preferences/PreferencesProvider.jsx'
import './member.css'
import './classroom.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PreferencesProvider><StoreProvider>
      <App />
    </StoreProvider></PreferencesProvider>
  </StrictMode>,
)
