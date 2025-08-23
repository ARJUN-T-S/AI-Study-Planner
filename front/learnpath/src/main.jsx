import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { store } from "./Store/store"; // lowercase folder
import { Provider } from "react-redux";
import './index.css';
import App from './App.jsx';

// Font Awesome
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(link);

// Render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
