import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { severityColor } from './tokens';

interface SeverityDotProps {
  severity: string;
  size?: number;
  style?: ViewStyle;
  pulse?: boolean;
}

/**
 * Pulsing animated dot — mirrors `.animate-pulse-border` CSS animation.
 * Red for CRITICAL, amber for WARNING, green for HEALTHY.
 */
export default function SeverityDot({
  severity,
  size = 10,
  style,
  pulse = true,
}: SeverityDotProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const color = severityColor(severity);

  useEffect(() => {
    if (!pulse || severity?.toUpperCase() === 'HEALTHY' || severity?.toUpperCase() === 'RESOLVED') {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [severity, pulse]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
});
