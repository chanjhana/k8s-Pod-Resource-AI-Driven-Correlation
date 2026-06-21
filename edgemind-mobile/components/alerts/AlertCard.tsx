import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable, ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, severityColor, severityTint } from '../ui/tokens';
import Badge from '../ui/Badge';
import SeverityDot from '../ui/SeverityDot';
import { Alert } from '../../core/store/AppContext';

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
  isActive?: boolean;
}

/**
 * AlertCard — main card for displaying a pump alert.
 * Large version (isActive=true) for the Current Alert screen.
 * Compact version for the Alert History list.
 */
export default function AlertCard({ alert, onPress, isActive }: AlertCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const color = severityColor(alert.severity);
  const tint  = severityTint(alert.severity);

  // Subtle pulse ring for CRITICAL active alert
  useEffect(() => {
    if (isActive && alert.severity === 'CRITICAL') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.015, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [isActive, alert.severity]);

  const timeAgo = formatTimeAgo(alert.timestamp);

  if (isActive) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={onPress}
          style={[styles.activeCard, { borderColor: color, backgroundColor: tint }]}
        >
          {/* Severity header strip */}
          <View style={[styles.severityStrip, { backgroundColor: color }]}>
            <SeverityDot severity={alert.severity} size={8} style={{ marginRight: 6 }} />
            <Text style={styles.severityLabel}>{alert.severity}</Text>
            <Text style={styles.timeLabel}>{timeAgo}</Text>
          </View>

          {/* Main content */}
          <View style={styles.cardBody}>
            <View style={styles.podRow}>
              <Text style={styles.podId}>{alert.pod_id}</Text>
              {alert.pump_id && (
                <Text style={styles.pumpId}> / {alert.pump_id}</Text>
              )}
            </View>
            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{alert.description}</Text>

            <View style={styles.footerRow}>
              <Badge severity={alert.severity} />
              <Text style={[styles.viewDetail, { color }]}>View Details</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Compact list view
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        { borderLeftColor: color },
        pressed && styles.compactPressed,
        alert.resolved && styles.resolvedCard,
      ]}
    >
      <View style={styles.compactLeft}>
        <SeverityDot severity={alert.severity} size={8} pulse={!alert.resolved} />
      </View>
      <View style={styles.compactCenter}>
        <Text style={styles.compactTitle} numberOfLines={1}>{alert.title}</Text>
        <Text style={styles.compactSub}>{alert.pod_id}  {timeAgo}</Text>
      </View>
      <Badge severity={alert.resolved ? 'RESOLVED' : alert.severity} small />
    </Pressable>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  // ── Active (large) card ───────────────────────────────────────────────
  activeCard: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  severityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
  },
  severityLabel: {
    color: '#fff', fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold, letterSpacing: 1.5,
    flex: 1,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.8)', fontSize: Typography.sizes.xs,
  },
  cardBody: {
    padding: Spacing.base,
    backgroundColor: '#fff',
  },
  podRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  podId:  { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary },
  pumpId: { fontSize: Typography.sizes.sm, color: Colors.textTertiary },
  title:  { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 6 },
  description: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewDetail: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // ── Compact (list) card ───────────────────────────────────────────────
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderLeftWidth: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  compactPressed: { backgroundColor: Colors.bgCardHover },
  resolvedCard:   { opacity: 0.65 },
  compactLeft:    { width: 16, alignItems: 'center' },
  compactCenter:  { flex: 1 },
  compactTitle:   { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  compactSub:     { fontSize: Typography.sizes.xs, color: Colors.textTertiary, marginTop: 2 },
});
