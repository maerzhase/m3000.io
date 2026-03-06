import { ReactNode } from "react";
import { Text } from "./ui/Text";

interface StationProps {
  year: ReactNode;
  name: ReactNode;
  title: ReactNode;
  children: ReactNode;
}

export function Station({ year, title, name, children }: StationProps) {
  return (
    <div>
      <div className="flex gap-2 items-baseline mb-2 w-full">
        <Text weight="semibold" size="3">
          {title}
        </Text>
        <Text>{name}</Text>
        <Text size="1" color="dim" className="ml-auto">
          {year}
        </Text>
      </div>
      {children}
    </div>
  );
}
