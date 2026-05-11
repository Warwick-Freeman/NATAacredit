import React from 'react';
import ReactDOM from 'react-dom/client';
import './app.css';
import App from './App';
import { NexusDataProvider } from './NexusDataContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <NexusDataProvider>
    <App />
  </NexusDataProvider>
);
