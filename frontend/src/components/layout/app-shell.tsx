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
        </div>
      </header>
      <div className="app-content">{children}</div>
    </>
  );
}
