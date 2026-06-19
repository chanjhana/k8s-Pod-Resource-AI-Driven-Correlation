import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from './tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  danger?: boolean;
  warning?: boolean;
}

/**
 * Base white card — mirrors `.panel` class from the web dashboard.
 * Elevation 2 shadow, ABB-brand border, optional danger/warning tint.
 */
export default function Card({ children, style, elevated, danger, warning }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        danger  && styles.danger,
        warning && styles.warning,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  danger: {
    borderColor: Colors.dangerBorder,
    backgroundColor: 'rgba(255, 0, 15, 0.02)',
  },
  warning: {
    borderColor: Colors.warningBorder,
    backgroundColor: 'rgba(184, 148, 0, 0.04)',
  },
});
