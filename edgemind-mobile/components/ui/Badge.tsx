import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius, severityColor, severityTint } from './tokens';

interface BadgeProps {
  severity: string;
  style?: ViewStyle;
  small?: boolean;
}

/**
 * Severity pill badge — CRITICAL / WARNING / HEALTHY / RESOLVED.
 * Matches the pill badges in the web dashboard alert cards.
 */
export default function Badge({ severity, style, small }: BadgeProps) {
  const color = severityColor(severity);
  const tint  = severityTint(severity);
  const label = severity?.toUpperCase() || 'UNKNOWN';

  return (
    <View style={[styles.badge, { backgroundColor: tint, borderColor: color }, style]}>
      <Text style={[
        styles.text,
        { color },
        small && styles.textSmall,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 9,
  },
});
