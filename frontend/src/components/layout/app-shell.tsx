import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="brand" href="/">
            Construction SaaS
          </Link>
          <nav className="app-navigation" aria-label="主要画面">
            <Link href="/projects">案件</Link>
            <Link href="/schedule">ガント</Link>
          </nav>
        </div>
      </header>
      <div className="app-content">{children}</div>
    </>
  );
}
