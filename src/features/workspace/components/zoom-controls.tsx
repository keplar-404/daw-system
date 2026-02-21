"use client";

import React from "react";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export const ZoomControls = React.memo(function ZoomControls(): React.ReactElement {
    const zoomXAt = useUIStore((s) => s.zoomXAt);
    const resetCamera = useUIStore((s) => s.resetCamera);

    return (
        <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Zoom out"
                onClick={() => zoomXAt(-0.2, 0)}
            >
                <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Reset zoom"
                onClick={resetCamera}
            >
                <Maximize className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Zoom in"
                onClick={() => zoomXAt(0.2, 0)}
            >
                <ZoomIn className="h-4 w-4" />
            </Button>
        </div>
    );
});
