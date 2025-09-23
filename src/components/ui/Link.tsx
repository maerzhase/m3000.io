import * as React from "react";
import type { PropsWithoutRefOrColor } from "./helpers";
import { Text, type TextProps } from "./Text";
import { cn } from "@/lib/cn";
import { IconExternalLink } from "@tabler/icons-react";

type LinkElement = React.ElementRef<"a">;
type LinkOwnProps = {
  asChild?: boolean;
  active?: boolean;
  external?: boolean;
} & Pick<TextProps, "color">;
interface LinkProps extends PropsWithoutRefOrColor<"a">, LinkOwnProps {}

export const Link = React.forwardRef<LinkElement, LinkProps>(
  (
    { children, className, asChild, active, external = true, href, ...props },
    forwardedRef,
  ) => {
    return (
      <Text
        size="1"
        ref={forwardedRef}
        asChild
        variant="mono"
        className={cn(
          "hover:underline data-active:underline text-primary inline-flex gap-1 items-center",
          className,
        )}
        data-state={active ? "active" : undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <a href={href}>
            {children} {external && <IconExternalLink size={14} />}
          </a>
        )}
      </Text>
    );
  },
);
Link.displayName = "Link";
