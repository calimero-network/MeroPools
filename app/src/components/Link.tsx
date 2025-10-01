import { Link as RouterLink } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import type { ReactNode } from "react";

interface CustomLinkProps extends Omit<LinkProps, "to"> {
  href: string;
  children: ReactNode;
}

// Custom Link component to replace Next.js Link
export default function Link({ href, children, ...props }: CustomLinkProps) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
