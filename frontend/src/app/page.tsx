import { FoundationForm } from "@/components/forms/foundation-form";
import { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">CONSTRUCTION-V1 · Phase 1</p>
        <h1 id="page-title">建設業向け案件管理SaaS</h1>
        <p>
          frontendとbackendの責務を追跡するための学習用基盤です。業務機能は後続Phaseで実装します。
        </p>
      </section>

      <section className="panel" aria-labelledby="state-title">
        <h2 id="state-title">共通状態の基礎</h2>
        <div className="state-grid">
          <AsyncState kind="loading" />
          <AsyncState kind="error" message="サンプルの取得エラーです。" />
          <AsyncState kind="empty" />
        </div>
        <Button disabled>保存できません</Button>
      </section>

      <section className="panel" aria-labelledby="form-title">
        <h2 id="form-title">React Hook Formの最小例</h2>
        <FoundationForm />
      </section>
    </main>
  );
}
