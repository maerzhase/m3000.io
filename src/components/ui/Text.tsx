import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const textVariants = cva("", {
  variants: {
    size: {
      "1": "text-1 leading-1",
      "2": "text-2 leading-2",
      "3": "text-3 leading-3",
      "4": "text-4 leading-4",
      "5": "text-5 leading-5",
      "6": "text-6 leading-6",
      "7": "text-7 leading-7",
      "8": "text-8 leading-8",
      "9": "text-9 leading-9",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    color: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      tertiary: "text-text-tertiary",
      current: "text-current",
    },
    variant: {
      sans: "font-sans",
      mono: "font-mono",
    },
  },
  defaultVariants: {
    size: "2",
    weight: "regular",
    color: "primary",
    variant: "sans",
  },
});

export interface TextProps
  extends VariantProps<typeof textVariants>,
    Omit<useRender.ComponentProps<"span">, "color"> {}

export type TextElement = React.ElementRef<"span">;

export const Text = React.forwardRef<TextElement, TextProps>(function Text(
  { className, align, size, weight, color, variant, render, ...props },
  forwardedRef,
) {
  const defaultProps: useRender.ElementProps<"span"> = {
    className: cn(textVariants({ align, size, weight, color, variant })),
  };

  const element = useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, { className }, props),
    ref: forwardedRef,
  });

  return element;
});

Text.displayName = "Text";
