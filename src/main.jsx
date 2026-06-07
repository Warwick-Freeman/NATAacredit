import React from 'react';
import ReactDOM from 'react-dom/client';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import './app.css';
import App from './App';
import { NexusDataProvider } from './NexusDataContext';
import { AuthProvider } from './AuthContext';
import { TaskProvider } from './TaskContext';
import { LocationProvider } from './LocationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <TaskProvider>
      <LocationProvider>
        <NexusDataProvider>
          <App />
        </NexusDataProvider>
      </LocationProvider>
    </TaskProvider>
  </AuthProvider>
);
