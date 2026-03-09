export function Footer() {
  return (
    <footer className="mt-auto border-t border-(--foreground)/10 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 text-center text-sm text-(--foreground)/70">
        <span className="sm:inline">
          If you enjoy{" "}
          <span className="font-cinzel font-bold tracking-wide">
            SoundTable
          </span>
          , consider supporting the project
        </span>
        <span className="sm:inline text-(--foreground)/40">·</span>
        <a
          href={`${process.env.PIX_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline decoration-primary/60 underline-offset-2 transition hover:text-primary hover:decoration-primary dark:text-foreground dark:decoration-(--foreground)/30 dark:hover:decoration-foreground"
          title="Buy Me a Coffee"
          aria-label="Support the project on Buy Me a Coffee (opens in new tab)"
        >
          Buy Me a Coffee ☕
        </a>
      </div>
    </footer>
  );
}
