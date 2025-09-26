import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import { IconLoader2 } from "@tabler/icons-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  cn(
    "rounded-xs px-4 py-3 text-2 leading-none",
    "inline-flex flex-wrap items-center gap-1.5",
    "border-1 border-solid",
    "disabled:border-grey-900 disabled:bg-grey-900 disabled:text-grey-500",
    "focus-visible:ring focus-visible:outline-none",
  ),
  {
    variants: {
      color: {
        primary: cn(
          "border-white bg-white text-black",
          "hover:border-grey-100 hover:bg-grey-100",
          "active:border-grey-100 active:bg-grey-100",
          "focus-visible:inset-ring-2",
        ),
        secondary: cn(
          "border-grey-700 bg-black text-text-secondary",
          "hover:bg-grey-900 hover:text-text-primary",
          "active:bg-grey-900 active:text-text-primary",
        ),
        tertiary: cn(
          "border-grey-800 bg-grey-800 text-text-primary",
          "hover:bg-grey-900",
          "active:bg-grey-900",
        ),
      },
    },
    defaultVariants: {
      color: "primary",
    },
  },
);

export interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<useRender.ComponentProps<"button">, "color"> {
  loading?: boolean;
}

export type ButtonElement = React.ElementRef<"button">;

export const Button = React.forwardRef<ButtonElement, ButtonProps>(
  function Button(
    {
      className,
      color,
      render,
      disabled,
      loading,
      children,
      ...props
    }: ButtonProps,
    forwardRef,
  ) {
    const defaultProps: useRender.ElementProps<"button"> = {
      className: cn(buttonVariants({ color }), { relative: loading }),
      type: "button",
    };

    const _disabled = disabled || loading;

    // Keep the button size the same, while the spinner is shown
    const _children = loading ? (
      <>
        <span className="invisible contents">{children}</span>
        <span className="absolute inset-0 flex items-center justify-center">
          <IconLoader2 className="animate-spin" size="16" />
        </span>
      </>
    ) : (
      children
    );

    const element = useRender({
      defaultTagName: "button",
      render,
      props: mergeProps<"button">(
        defaultProps,
        { className, disabled: _disabled, children: _children },
        props,
      ),
      ref: forwardRef,
    });

    return element;
  },
);

Button.displayName = "Button";
