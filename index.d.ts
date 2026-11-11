export type NavId = "projects" | "resume" | "games" | "blog" | "speak" | "contact";

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

export declare const FOOTER_LINKS: ReadonlyArray<Pick<Link, "label" | "href">>;

export type FooterOptions = {
  /** HTML added after the copyright line, such as a license note. Not escaped. */
  note?: string;
  /** Site-specific links placed after the shared ones. */
  links?: Pick<Link, "label" | "href">[];
  /** Copyright year. Defaults to the current year. */
  year?: number;
};

export declare function footerHtml(options?: FooterOptions): string;
export declare const THEME_INIT_SCRIPT: string;
export declare function saveTheme(theme: "light" | "dark"): void;
export declare function initThemeToggle(): void;
