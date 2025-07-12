"use client";

import { useEffect, useState } from "react";

/**
 * A wrapper component that ensures its children are only rendered on the client side,
 * after the component has successfully mounted. This is useful for preventing
 * hydration errors with components that are not SSR-compatible or rely on browser APIs.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
