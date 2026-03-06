export function Footer() {
  return (
    <footer className="mt-auto border-t border-(--foreground)/10 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 text-center text-sm text-(--foreground)/70">
        <span>If you enjoy SoundTable, consider supporting the project</span>
        <span className="text-(--foreground)/40">·</span>
        <a
          href={`${process.env.PIX_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-(--foreground)/30 underline-offset-2 transition hover:decoration-foreground"
          title="Buy Me a Coffee"
        >
          Buy Me a Coffee ☕
        </a>
      </div>
    </footer>
  );
}
