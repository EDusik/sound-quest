"use client";

type SectionProps = {
  /** Section id (for anchor links and scroll-mt). */
  id?: string;
  /** Id for the heading (aria-labelledby on section). */
  headingId: string;
  /** Heading content (e.g. translated title). */
  title: React.ReactNode;
  /** Optional subtitle below the heading. */
  subtitle?: React.ReactNode;
  /** Center heading and subtitle. */
  centered?: boolean;
  /** Max width of content: default 6xl, narrow 3xl. */
  contentMaxWidth?: "default" | "narrow";
  /** Extra class for the section element. */
  className?: string;
  children: React.ReactNode;
};

const SECTION_BASE = "border-b border-border py-16 md:py-24";
const TITLE_BASE = "font-cinzel text-2xl font-semibold tracking-tight text-foreground sm:text-3xl";
const SUBTITLE_BASE = "mt-3 text-muted md:mt-4 md:text-lg";
const CONTENT_WIDTH = { default: "max-w-6xl", narrow: "max-w-3xl" } as const;

export function Section({
  id,
  headingId,
  title,
  subtitle,
  centered = false,
  contentMaxWidth = "default",
  className = "",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`${id ? "scroll-mt-20" : ""} ${SECTION_BASE} ${className}`}
      aria-labelledby={headingId}
    >
      <div className={`mx-auto ${CONTENT_WIDTH[contentMaxWidth]} px-4`}>
        <h2
          id={headingId}
          className={`${TITLE_BASE} ${centered ? "md:text-center" : ""}`}
        >
          {title}
        </h2>
        {subtitle != null && (
          <p
            className={`${SUBTITLE_BASE} ${centered ? "mx-auto max-w-2xl md:text-center" : ""}`}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
