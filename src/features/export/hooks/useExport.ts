import { useState } from "react";
import { useDawStore } from "@/features/daw/store/dawStore";
import { exportProjectToWav, type ExportProgress } from "@/lib/audio/export";

export function useExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<ExportProgress | null>(null);

    const startExport = async () => {
        try {
            setIsExporting(true);
            setProgress({ status: "building", progress: 0 });

            // Grab current state dynamically outside of react render lifecycle
            const state = useDawStore.getState();

            const wavBlob = await exportProjectToWav(state, (p) => {
                setProgress(p);
            });

            // Browser download logic via anchor tag
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `daw-ai-export-${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Export failed:", err);
            setProgress({ status: "error", progress: 0, message: String(err) });
        } finally {
            // Keep "done" visible briefly before hiding
            setProgress({ status: "done", progress: 100 });
            setTimeout(() => {
                setIsExporting(false);
                setProgress(null);
            }, 1000);
        }
    };

    return { startExport, isExporting, progress };
}
