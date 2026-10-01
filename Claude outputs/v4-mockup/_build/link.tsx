import type { AnchorHTMLAttributes, ReactNode } from "react";
import { navigate } from "./nav";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname: string }; children?: ReactNode; prefetch?: boolean; replace?: boolean; scroll?: boolean };
export default function Link({ href, children, onClick, prefetch: _p, replace: _r, scroll: _s, ...rest }: Props) {
  const h = typeof href === "string" ? href : href.pathname;
  const external = /^(https?:|mailto:)/.test(h);
  return (
    <a href={external ? h : `#${h}`} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (external || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(h);
      }}>{children}</a>
  );
}
