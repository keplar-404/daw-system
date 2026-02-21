"use client";

import type React from "react";
import dynamic from "next/dynamic";

const Workspace = dynamic(() => import("@/features/workspace/workspace").then(m => m.Workspace), {
  ssr: false,
});

/**
 * Main Landing / Workspace Page
 * @returns {React.ReactElement} The DAW workspace view
 */
export default function Page(): React.ReactElement {
  return (
    <main className="w-screen h-screen overflow-hidden bg-background text-foreground">
      <Workspace />
    </main>
  );
}
