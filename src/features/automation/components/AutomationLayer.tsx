import { Layer, Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useDawStore } from "@/features/daw/store/dawStore";
import { useAutomation } from "../hooks/useAutomation";
import type { AutomationLane, AutomationTarget } from "../types/automation.types";

export interface AutomationLayerProps {
    width: number;
    height: number;
    pxPerBeat: number;
    scrollLeft: number;
}

const VOL_MIN = -60;
const VOL_MAX = 6;
const VOL_RANGE = VOL_MAX - VOL_MIN;

const PAN_MIN = -1;
const PAN_MAX = 1;
const PAN_RANGE = PAN_MAX - PAN_MIN;

export function AutomationLayer({ width: _width, height, pxPerBeat, scrollLeft }: AutomationLayerProps) {
    const { lanes, addAutomationNode, moveAutomationNode } = useAutomation();
    const tracks = useDawStore((s) => s.tracks);

    // Math helpers
    const valToY = (val: number, target: AutomationTarget) => {
        if (target === "volume") {
            const clamped = Math.max(VOL_MIN, Math.min(VOL_MAX, val));
            return height - ((clamped - VOL_MIN) / VOL_RANGE) * height;
        } else {
            const clamped = Math.max(PAN_MIN, Math.min(PAN_MAX, val));
            return height - ((clamped - PAN_MIN) / PAN_RANGE) * height;
        }
    };

    const yToVal = (y: number, target: AutomationTarget) => {
        const norm = (height - Math.max(0, Math.min(height, y))) / height;
        if (target === "volume") return VOL_MIN + norm * VOL_RANGE;
        return PAN_MIN + norm * PAN_RANGE;
    };

    const beatToX = (beat: number) => beat * pxPerBeat - scrollLeft;
    const xToBeat = (x: number) => (x + scrollLeft) / pxPerBeat;

    // Background click to add node
    const handleBgClick = (e: KonvaEventObject<MouseEvent>) => {
        // Only trigger if we clicked the background layer/line, not a node circle
        if (e.target.name() === "auto-node") return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // For MVP, we default to the first track and "volume" target if none active.
        // In a full implementation, the user would select a track/target from a UI dropdown.
        const trackId = tracks[0]?.id ?? "track-1";
        const target: AutomationTarget = "volume";

        // Snap to nearest 0.5 beat
        const rawBeat = xToBeat(pos.x);
        const beat = Math.max(0, Math.round(rawBeat * 2) / 2);
        const value = yToVal(pos.y, target);

        addAutomationNode(trackId, target, {
            id: crypto.randomUUID(),
            beat,
            value,
        });
    };

    return (
        <Layer onClick={handleBgClick}>
            {/* Invisible background rect to catch clicks if Stage doesn't */}
            {/* 
      We don't strictly need a Rect if Stage catches it, but Konva events 
      on Layers sometimes fall through without a fill. We rely on Stage 
      or TimelineCanvas background for clicks, but attaching onClick to Layer 
      works if child elements are hit. Actually, let's just let it be on Layer. 
      */}

            {lanes.map((lane) => {
                // Build flat array of x,y for the Line
                const points = lane.nodes.flatMap((node) => [
                    beatToX(node.beat),
                    valToY(node.value, lane.target),
                ]);

                const color = lane.target === "volume" ? "rgba(34, 197, 94, 0.8)" : "rgba(56, 189, 248, 0.8)"; // green/blue

                return (
                    <Group key={`${lane.trackId}-${lane.target}`}>
                        <Line
                            points={points}
                            stroke={color}
                            strokeWidth={2}
                            tension={0} // sharp lines
                            listening={false} // clicks pass through to layer
                        />

                        {lane.nodes.map((node) => {
                            const x = beatToX(node.beat);
                            const y = valToY(node.value, lane.target);

                            // Don't render if it's way off screen
                            if (x < -50 || x > _width + 50) return null;

                            return (
                                <Circle
                                    key={node.id}
                                    name="auto-node"
                                    x={x}
                                    y={y}
                                    radius={5}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={1.5}
                                    draggable
                                    dragBoundFunc={(pos) => {
                                        // Lock X to its beat position, only allow Y dragging
                                        return { x: x, y: Math.max(0, Math.min(height, pos.y)) };
                                    }}
                                    onDragMove={(e) => {
                                        const newY = e.target.y();
                                        const newVal = yToVal(newY, lane.target);
                                        // Update state live
                                        moveAutomationNode(lane.trackId, lane.target, node.id, { value: newVal });
                                    }}
                                    onMouseEnter={(e) => {
                                        const container = e.target.getStage()?.container();
                                        if (container) container.style.cursor = "ns-resize";
                                    }}
                                    onMouseLeave={(e) => {
                                        const container = e.target.getStage()?.container();
                                        if (container) container.style.cursor = "default";
                                    }}
                                />
                            );
                        })}
                    </Group>
                );
            })}
        </Layer>
    );
}

// Needed since we use Group
import { Group } from "react-konva";
