---
name: nextjs-tailwind-ts
description: >
  Best practices for using Tailwind CSS in Next.js projects with TypeScript.
  Use this skill whenever the user mentions Tailwind, Next.js, styles, className,
  reusable components, dark mode, CVA, cn, clsx, tailwind-merge, design system,
  responsiveness, or any styling task in a Next.js + TypeScript project.
  Also use when the user asks how to organize styles, create component variants,
  avoid class conflicts, or how to configure Tailwind v4 with the App Router.
---

# Tailwind CSS — Best Practices for Next.js + TypeScript

## Initial Setup (Tailwind v4 + Next.js 15 + App Router)

```bash
npx create-next-app@latest my-app --typescript --eslint --app
cd my-app
npm install tailwindcss @tailwindcss/postcss postcss
```

`postcss.config.mjs`:

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`app/globals.css`:

```css
@import "tailwindcss";
```

> For Tailwind v3 (broader support for older browsers), use the installation with `tailwind.config.ts` and the `@tailwind base/components/utilities` directives.

---

## 1. The `cn` Utility — Safe Class Merging

**Always** create and use a `cn` function instead of manual string concatenation:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```bash
npm install clsx tailwind-merge
```

**Why?**

- `clsx` handles conditionals, objects, and arrays of class names
- `twMerge` resolves Tailwind class conflicts (e.g. `p-2` + `p-4` → only `p-4`)
- Without it, conflicting classes produce unpredictable results

**Usage:**

```tsx
<div className={cn("rounded-lg p-4", isActive && "bg-blue-500", className)} />
```

---

## 2. Component Variants with CVA

For components with multiple variants (buttons, badges, inputs), use `class-variance-authority`:

```bash
npm install class-variance-authority
```

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        danger: "bg-red-500 text-white hover:bg-red-600",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

**Usage with TypeScript:**

```tsx
<Button variant="danger" size="lg">Delete</Button>
<Button variant="ghost" className="w-full">Cancel</Button>
```

TypeScript will infer valid variants automatically — no manual string literals needed.

---

## 3. Component Encapsulation — Avoid `@apply`

❌ **Avoid `@apply`** (it inflates the CSS bundle and loses the benefit of on-demand generation):

```css
/* ❌ Bad */
.btn-primary {
  @apply bg-blue-500 text-white px-4 py-2 rounded;
}
```

✅ **Prefer encapsulated React components:**

```tsx
// ✅ Good — styles written once, reused via component
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
```

> Exception: `@apply` is acceptable for small global styles (e.g. base `body` styling) and for integrating with third-party libraries that don't accept `className`.

---

## 4. Dark Mode

**Configuration (Tailwind v4):**

```css
/* globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Configuration (Tailwind v3):**

```ts
// tailwind.config.ts
module.exports = { darkMode: "class", ... }
```

**Theme Provider (Client Component):**

```tsx
// components/theme-provider.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(
  null,
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme used outside ThemeProvider");
  return ctx;
};
```

**Usage in components:**

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
```

> Always add `"use client"` to components that toggle the theme — Server Components cannot manage interaction state.

---

## 5. Responsiveness — Mobile-First

Tailwind is **mobile-first**: breakpoints apply from a given size **and up**.

```tsx
// ❌ Thinking "desktop-first" and trying to override on mobile
<div className="grid-cols-3 sm:grid-cols-1" /> // doesn't work as expected

// ✅ Start from mobile and scale up
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
```

Default breakpoints: `sm` (640px) · `md` (768px) · `lg` (1024px) · `xl` (1280px) · `2xl` (1536px)

---

## 6. Dynamic CSS — Runtime Values

❌ **Never build class names dynamically** (Tailwind won't detect them during content scanning):

```tsx
// ❌ This class will never be included in the bundle
<div className={`text-${color}-500`} />
```

✅ **Use full class names and CSS Variables for truly dynamic values:**

```tsx
// ✅ Option 1: map to full class names
const colorMap = { red: "text-red-500", blue: "text-blue-500" };
<div className={colorMap[color]} />

// ✅ Option 2: CSS Variable for truly dynamic values
<div
  className="bg-[var(--dynamic-color)]"
  style={{ "--dynamic-color": dynamicColor } as React.CSSProperties}
/>
```

---

## 7. Server Components + Tailwind

React Server Components are fully compatible with Tailwind — class names are static:

```tsx
// app/page.tsx — Server Component (no "use client")
export default async function Page() {
  const data = await fetchData();
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        {data.title}
      </h1>
    </main>
  );
}
```

Only add `"use client"` when you need: state (`useState`), effects (`useEffect`), event handlers, or browser APIs.

---

## 8. Class Organization — Consistent Order

Keep a logical order in class names for readability:

```
Layout → Flexbox/Grid → Spacing → Sizing → Typography → Colors → Border → Shadow → State
```

```tsx
<div className="flex items-center gap-4 p-6 w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none" />
```

Use the official Prettier plugin to sort automatically:

```bash
npm install -D prettier-plugin-tailwindcss
```

`prettier.config.js`:

```js
module.exports = { plugins: ["prettier-plugin-tailwindcss"] };
```

---

## 9. Custom Design Tokens

Extend the theme in `tailwind.config.ts` (v3) or via CSS (v4) instead of arbitrary values:

**Tailwind v4 (CSS):**

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-brand-500: #6366f1;
  --font-sans: "Inter", sans-serif;
  --spacing-section: 5rem;
}
```

**Tailwind v3 (`tailwind.config.ts`):**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: { brand: { 500: "#6366f1", 600: "#4f46e5" } },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
};
export default config;
```

---

## 10. Performance & General Best Practices

| Practice                                                | Why                               |
| ------------------------------------------------------- | --------------------------------- |
| Define `buttonVariants` (CVA) **outside** the component | Avoids recreation on every render |
| Use `useMemo` for complex class logic                   | Avoids unnecessary recalculation  |
| Import `globals.css` **once** in the root layout        | Avoids style duplication          |
| Prefer encapsulated components over repeated classes    | DRY + centralized maintenance     |
| Avoid `!important` / excessive arbitrary values         | Signals a missing design token    |

---

## References

- See `references/setup-guide.md` for detailed installation commands per version
- See `references/component-patterns.md` for additional examples (Card, Input, Badge)
