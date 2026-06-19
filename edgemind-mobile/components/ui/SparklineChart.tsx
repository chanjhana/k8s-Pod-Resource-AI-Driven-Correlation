import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, Radius } from './tokens';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';

interface DataPoint { x: string; y: number }

interface SparklineChartProps {
  data: DataPoint[];
  label: string;
  color?: string;
  dangerThreshold?: number;
}

const W = Dimensions.get('window').width - Spacing.base * 2 - 32; // full width minus padding
const H = 56;

/**
 * Lightweight SVG sparkline chart — used in the Current Alert live metrics section.
 * Shows last N readings as a line, with a danger threshold indicator.
 */
export default function SparklineChart({ data, label, color = Colors.abbBlue, dangerThreshold }: SparklineChartProps) {
  if (!data.length) return null;

  const values = data.map(d => d.y);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range  = maxVal - minVal || 1;
  const latest = values[values.length - 1];
  const isDanger = dangerThreshold !== undefined && latest >= dangerThreshold;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.y - minVal) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  // Threshold line Y position
  const thresholdY = dangerThreshold
    ? H - ((dangerThreshold - minVal) / range) * H
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isDanger && { color: Colors.danger }]}>
          {latest.toFixed(2)}
        </Text>
      </View>
      <Svg width={W} height={H} style={styles.svg}>
        {/* Threshold line */}
        {thresholdY !== null && (
          <Line
            x1={0} y1={thresholdY}
            x2={W} y2={thresholdY}
            stroke={Colors.danger}
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.5}
          />
        )}
        {/* Sparkline */}
        <Polyline
          points={points}
          fill="none"
          stroke={isDanger ? Colors.danger : color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Latest value dot */}
        {data.length > 0 && (() => {
          const lastX = W;
          const lastY = H - ((latest - minVal) / range) * H;
          return (
            <Circle
              cx={lastX}
              cy={lastY}
              r={3}
              fill={isDanger ? Colors.danger : color}
            />
          );
        })()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: { fontSize: Typography.sizes.xs, color: Colors.textTertiary },
  value: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  svg:   { alignSelf: 'flex-start' },
});
