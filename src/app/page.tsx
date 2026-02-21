import type React from "react";
import { Workspace } from "@/features/workspace/Workspace";

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
