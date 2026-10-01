import type { ReactNode } from 'react';
import type { AppMeta } from './main';
import { shareText } from './core';

export function AppShell({ meta, children }: { meta: AppMeta; children: ReactNode }) {
  return <main className="app-shell">
    <header className="topbar">
      <div className="brandmark" aria-hidden>{meta.emoji}</div>
      <div className="brandcopy">
        <strong>{meta.name}</strong>
        <span>{meta.tagline}</span>
      </div>
      <button className="iconbtn" onClick={() => shareText(meta.name, meta.tagline)} aria-label="Share app">↗</button>
    </header>
    <section className="content">{children}</section>
    <footer className="footer">LOCAL-FIRST · NO ACCOUNT · PHABLAB ENGINE 1.0</footer>
  </main>;
}
