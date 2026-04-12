import { cn } from "@/lib/cn";

interface InlineImageProps {
  width: number;
  height: number;
  float?: "left" | "right";
  className?: string;
}

export function InlineImage({
  width,
  height,
  float,
  className,
}: InlineImageProps) {
  return (
    <span
      className={cn(
        "dither inline-block shrink-0 rounded-sm bg-gray-800",
        float === "right" && "float-right ml-4 mb-2",
        float === "left" && "float-left mr-4 mb-2",
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
