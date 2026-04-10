import { IconExternalLink } from "@tabler/icons-react";
import * as React from "react";
import { ShaderHighlight } from "@/components/ShaderHighlight";
import { cn } from "@/lib/cn";
import { Text, type TextProps } from "./Text";

export type LinkElement = React.ElementRef<"a">;

interface OwnProps {
  active?: boolean;
  external?: boolean;
  shaderHighlight?: boolean;
}

export type LinkProps = OwnProps &
  TextProps &
  Omit<React.ComponentPropsWithoutRef<"a">, keyof TextProps>;

export const Link = React.forwardRef<LinkElement, LinkProps>(function Link(
  {
    className,
    active,
    color = "secondary",
    variant = "mono",
    render,
    children,
    external,
    shaderHighlight = true,
    ...props
  },
  ref,
) {
  const element = (
    <Text
      // biome-ignore lint: using render
      render={render ?? <a />}
      ref={ref}
      color={color}
      variant={variant}
      className={cn(
        "inline px-1 text-1 align-middle",
        "hover:text-secondary data-active:text-secondary",
        "focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none",
        "[&_svg]:inline-block [&_svg]:align-[-0.125em] [&_svg]:shrink-0",
        className,
      )}
      data-state={active ? "active" : undefined}
      {...props}
    >
      {children}
    </Text>
  );

  if (!shaderHighlight) {
    return element;
  }

  return <ShaderHighlight>{element}</ShaderHighlight>;
});

Link.displayName = "Link";

type ExternalLinkProps = LinkProps & { noIcon?: boolean };

export const ExternalLink = React.forwardRef<LinkElement, ExternalLinkProps>(
  function _Link({ children, noIcon = false, ...props }, ref) {
    return (
      <Link {...props} target="_blank" rel="noopener noreferrer" ref={ref}>
        {children}
        {!noIcon && (
          <IconExternalLink size="14" className="ml-1 align-middle" />
        )}
      </Link>
    );
  },
);
