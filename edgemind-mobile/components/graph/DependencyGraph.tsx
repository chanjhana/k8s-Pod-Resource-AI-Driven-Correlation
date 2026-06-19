import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, PanResponder, Animated,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Defs, Marker, Path } from 'react-native-svg';
import { Colors, Typography, severityColor } from '../ui/tokens';
import { GraphNode, GraphEdge } from '../../core/store/AppContext';

const { width: SW, height: SH } = Dimensions.get('window');
const CANVAS_W = SW;
const CANVAS_H = SH * 0.65;

// Fixed layout positions for the pump station pipeline
const FIXED_POSITIONS: Record<string, { x: number; y: number }> = {
  'sensor-sim-1':      { x: 70,  y: 80  },
  'sensor-sim-2':      { x: 70,  y: 160 },
  'sensor-sim-3':      { x: 70,  y: 240 },
  'opc-ua-collector':  { x: 210, y: 160 },
  'data-historian':    { x: 330, y: 160 },
  'feature-extractor': { x: 450, y: 160 },
  'health-scorer':     { x: 560, y: 160 },
  'alert-manager':     { x: 660, y: 100 },
  'batch-sync':        { x: 660, y: 220 },
  'mock-upload':       { x: 760, y: 220 },
};

const NODE_R = 28;

interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodePress?: (node: GraphNode) => void;
}

export default function DependencyGraph({ nodes, edges, onNodePress }: DependencyGraphProps) {
  const scale     = useRef(new Animated.Value(1)).current;
  const offsetX   = useRef(new Animated.Value(0)).current;
  const offsetY   = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<string | null>(null);

  // Pan responder for drag-to-pan
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        offsetX.setValue(gs.dx);
        offsetY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        offsetX.extractOffset();
        offsetY.extractOffset();
      },
    })
  ).current;

  function handleNodePress(node: GraphNode) {
    setSelected(node.id === selected ? null : node.id);
    onNodePress?.(node);
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.canvas, { transform: [{ translateX: offsetX }, { translateY: offsetY }] }]}
    >
      <Svg width={CANVAS_W + 200} height={CANVAS_H}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = FIXED_POSITIONS[edge.source];
          const tgt = FIXED_POSITIONS[edge.target];
          if (!src || !tgt) return null;
          const color = edge.type === 'trigger' ? Colors.warning : Colors.borderPrimary;
          return (
            <Line
              key={i}
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              stroke={color}
              strokeWidth={edge.type === 'trigger' ? 2 : 1.5}
              strokeDasharray={edge.type === 'trigger' ? '6,3' : undefined}
              opacity={0.7}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = FIXED_POSITIONS[node.id];
          if (!pos) return null;
          const color = severityColor(node.severity);
          const isSelected = selected === node.id;
          const parts = node.label.split('\n');
          return (
            <React.Fragment key={node.id}>
              {/* Outer ring for selected */}
              {isSelected && (
                <Circle cx={pos.x} cy={pos.y} r={NODE_R + 5}
                  fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
              )}
              {/* Node circle */}
              <Circle
                cx={pos.x} cy={pos.y} r={NODE_R}
                fill={isSelected ? color : '#fff'}
                stroke={color}
                strokeWidth={isSelected ? 0 : 2}
                onPress={() => handleNodePress(node)}
              />
              {/* Label line 1 */}
              <SvgText
                x={pos.x} y={pos.y - (parts[1] ? 5 : 0)}
                textAnchor="middle" fontSize={8}
                fill={isSelected ? '#fff' : Colors.textPrimary}
                fontWeight="600"
                onPress={() => handleNodePress(node)}
              >
                {parts[0]}
              </SvgText>
              {/* Label line 2 (pump_id) */}
              {parts[1] && (
                <SvgText
                  x={pos.x} y={pos.y + 9}
                  textAnchor="middle" fontSize={7}
                  fill={isSelected ? 'rgba(255,255,255,0.8)' : Colors.textTertiary}
                  onPress={() => handleNodePress(node)}
                >
                  {parts[1]}
                </SvgText>
              )}
              {/* Severity dot */}
              <Circle
                cx={pos.x + NODE_R - 6} cy={pos.y - NODE_R + 6}
                r={5} fill={color}
                onPress={() => handleNodePress(node)}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: CANVAS_W, height: CANVAS_H },
});
