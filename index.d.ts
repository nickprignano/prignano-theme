export type NavId = "projects" | "resume" | "blog" | "github" | "speak" | "contact";

/** `cta` draws the link as a bold pill. */
export type Link = { id?: string; label: string; href: string; cta?: boolean };

export declare const OWNER: { name: string; avatar: string; email: string };
export declare const NAV: ReadonlyArray<Link & { id: NavId }>;

export type HeaderOptions = {
  /** NAV id, or the id of one of `links`, for the page being shown. */
  current?: string;
  /** Short line under the name. */
  bio?: string | null;
  /** Where the name and avatar link to. Defaults to https://prignano.ai/. */
  home?: string;
  /** Site-specific links placed before the shared ones. */
  links?: Link[];
  /** Relative paths for NAV links that live on the current site. */
  local?: Partial<Record<NavId, string>>;
};

export declare function headerHtml(options?: HeaderOptions): string;
export declare const THEME_INIT_SCRIPT: string;
export declare function saveTheme(theme: "light" | "dark"): void;
export declare function initThemeToggle(): void;
