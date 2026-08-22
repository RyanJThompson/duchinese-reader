import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App';
import { DuChineseAdapter } from './adapters/duchinese/adapter';
import { DataProvider } from './context/DataContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { LearnedProvider } from './context/LearnedContext';
import { RecentsProvider } from './context/RecentsContext';

const adapter = new DuChineseAdapter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider adapter={adapter}>
      <PreferencesProvider>
        <LearnedProvider>
          <RecentsProvider>
            <App />
          </RecentsProvider>
        </LearnedProvider>
      </PreferencesProvider>
    </DataProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
