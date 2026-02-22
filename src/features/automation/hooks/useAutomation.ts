import { useCallback, useEffect } from "react";
import { useDawStore } from "@/features/daw/store/dawStore";
import { scheduleAutomation, clearAutomation } from "../services/automationScheduler";
import type { AutomationTarget, AutomationNode, AutomationLane } from "../types/automation.types";

export interface UseAutomationReturn {
    lanes: AutomationLane[];
    addAutomationLane: (lane: AutomationLane) => void;
    addAutomationNode: (trackId: string, target: AutomationTarget, node: AutomationNode) => void;
    removeAutomationNode: (trackId: string, target: AutomationTarget, nodeId: string) => void;
    moveAutomationNode: (
        trackId: string,
        target: AutomationTarget,
        nodeId: string,
        patch: { beat?: number; value?: number },
    ) => void;
}

/**
 * Hook to interact with automation state and orchestrate scheduling.
 */
export function useAutomation(): UseAutomationReturn {
    const lanes = useDawStore((s) => s.automationLanes);
    const isPlaying = useDawStore((s) => s.isPlaying);
    const bpm = useDawStore((s) => s.bpm);

    const storeAddAutomationLane = useDawStore((s) => s.addAutomationLane);
    const storeAddAutomationNode = useDawStore((s) => s.addAutomationNode);
    const storeRemoveAutomationNode = useDawStore((s) => s.removeAutomationNode);
    const storeMoveAutomationNode = useDawStore((s) => s.moveAutomationNode);

    // When playback starts, schedule automation. When it stops, clear it.
    useEffect(() => {
        if (isPlaying) {
            scheduleAutomation(lanes, bpm);
        } else {
            clearAutomation(lanes);
        }
    }, [isPlaying, lanes, bpm]);

    return {
        lanes,
        addAutomationLane: useCallback((lane) => storeAddAutomationLane(lane), [storeAddAutomationLane]),
        addAutomationNode: useCallback(
            (trackId, target, node) => storeAddAutomationNode(trackId, target, node),
            [storeAddAutomationNode],
        ),
        removeAutomationNode: useCallback(
            (trackId, target, nodeId) => storeRemoveAutomationNode(trackId, target, nodeId),
            [storeRemoveAutomationNode],
        ),
        moveAutomationNode: useCallback(
            (trackId, target, nodeId, patch) => storeMoveAutomationNode(trackId, target, nodeId, patch),
            [storeMoveAutomationNode],
        ),
    };
}
