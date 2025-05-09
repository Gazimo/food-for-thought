import { ReactNode } from "react";

interface PhaseContainerProps {
  children: ReactNode;
}

export function PhaseContainer({ children }: PhaseContainerProps) {
  return <section className="mt-6">{children}</section>;
}
