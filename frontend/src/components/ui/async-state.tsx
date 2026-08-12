type AsyncStateProps = {
  kind: "loading" | "error" | "empty";
  message?: string;
};

const defaultMessages = {
  loading: "読み込み中です。",
  error: "データを取得できませんでした。",
  empty: "表示できるデータはありません。",
} as const;

export function AsyncState({ kind, message }: AsyncStateProps) {
  const text = message ?? defaultMessages[kind];

  if (kind === "loading") {
    return (
      <div className="state-message" role="status" aria-live="polite">
        {text}
      </div>
    );
  }

  if (kind === "error") {
    return (
      <div className="state-message state-message--error" role="alert">
        {text}
      </div>
    );
  }

  return <div className="state-message">{text}</div>;
}
