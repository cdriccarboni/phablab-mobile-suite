import React from 'react';
import { createRoot } from 'react-dom/client';
import catalog from '../apps.json';
import { AppShell } from './shell';
import { AppRouter } from './apps';
import './styles.css';

export type AppMeta = (typeof catalog)[number];

const params = new URLSearchParams(location.search);
const requested = import.meta.env.VITE_APP_ID || params.get('app') || 'phablabphone';
const meta = (catalog as AppMeta[]).find((a) => a.id === requested) ?? (catalog as AppMeta[]).find((a) => a.id === 'phablabphone')!;

document.title = meta.name;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell meta={meta}><AppRouter appId={meta.id} /></AppShell>
  </React.StrictMode>
);
