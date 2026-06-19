import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, severityColor } from '../ui/tokens';
import { Alert } from '../../core/store/AppContext';

interface TimelineEvent {
  alert: Alert;
  x: number;  // pixel offset on strip
}

interface TimelineStripProps {
  alerts: Alert[];
  onEventPress?: (alert: Alert) => void;
}

const DOT_R  = 8;
const ROW_H  = 80;
const LABEL_H = 20;
const STRIP_W = Math.max(Dimensions.get('window').width - 32, 600);

/**
 * Horizontal scrollable anomaly timeline strip.
 * Shows events as coloured dots on a time axis.
 * Each dot is tappable.
 */
export default function TimelineStrip({ alerts, onEventPress }: TimelineStripProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Place events on time axis over last 2 hours
  const now = Date.now();
  const windowMs = 2 * 60 * 60 * 1000;
  const startMs  = now - windowMs;

  const events: TimelineEvent[] = alerts
    .filter(a => new Date(a.timestamp).getTime() >= startMs)
    .map(a => {
      const tMs = new Date(a.timestamp).getTime();
      const x   = ((tMs - startMs) / windowMs) * (STRIP_W - 64) + 32;
      return { alert: a, x };
    });

  // Time labels every 30 min
  const timeLabels = [0, 30, 60, 90, 120].map(minutesAgo => {
    const t = now - minutesAgo * 60_000;
    const x = ((t - startMs) / windowMs) * (STRIP_W - 64) + 32;
    const label = minutesAgo === 0 ? 'Now' : `${minutesAgo}m ago`;
    return { x, label };
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <Svg width={STRIP_W} height={ROW_H + LABEL_H}>
        {/* Axis line */}
        <Line x1={16} y1={ROW_H / 2} x2={STRIP_W - 16} y2={ROW_H / 2}
          stroke={Colors.borderPrimary} strokeWidth={1.5} />

        {/* Time labels */}
        {timeLabels.map(({ x, label }, i) => (
          <React.Fragment key={i}>
            <Line x1={x} y1={ROW_H / 2 - 4} x2={x} y2={ROW_H / 2 + 4}
              stroke={Colors.borderPrimary} strokeWidth={1} />
            <SvgText
              x={x} y={ROW_H + LABEL_H - 2}
              textAnchor="middle"
              fontSize={9}
              fill={Colors.textTertiary}
            >
              {label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Event dots */}
        {events.map(({ alert, x }) => {
          const color     = severityColor(alert.severity);
          const isSelected = selected === alert.id;
          return (
            <React.Fragment key={alert.id}>
              {/* Stem */}
              <Line
                x1={x} y1={ROW_H / 2 - DOT_R}
                x2={x} y2={ROW_H / 2 - 24}
                stroke={color} strokeWidth={1} strokeDasharray="2,2"
              />
              {/* Dot */}
              <Circle
                cx={x} cy={ROW_H / 2 - 28}
                r={isSelected ? DOT_R + 2 : DOT_R}
                fill={color}
                opacity={isSelected ? 1 : 0.85}
                onPress={() => {
                  setSelected(alert.id);
                  onEventPress?.(alert);
                }}
              />
              {/* Pump label below axis */}
              <SvgText
                x={x} y={ROW_H / 2 + 18}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                fontWeight="600"
              >
                {alert.pump_id || alert.pod_id.slice(-5)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.bgCard },
});
