import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable, ScrollView,
  Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Badge from '../ui/Badge';
import RootCausePanel from './RootCausePanel';
import { Colors, Typography, Spacing, Radius, severityColor } from '../ui/tokens';
import { Alert, useApp } from '../../core/store/AppContext';

const SCREEN_H = Dimensions.get('window').height;

interface InvestigationModalProps {
  alert: Alert;
  onClose: () => void;
}

/**
 * Full-screen bottom sheet for alert investigation.
 * Slides up from bottom. Shows:
 *   - Alert summary (severity, pod, timestamp)
 *   - Full AI root cause + complete evidence matrix
 *   - Resolution info if alert is resolved
 */
export default function InvestigationModal({ alert, onClose }: InvestigationModalProps) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const { dispatch } = useApp();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleClose() {
    Animated.parallel([
      Animated.timing(slideY, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  const color = severityColor(alert.severity);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideY }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.severityBar, { backgroundColor: color }]}>
            <Text style={styles.severityBarText}>{alert.severity}</Text>
          </View>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Alert summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryPod}>{alert.pod_id}{alert.pump_id ? ` / ${alert.pump_id}` : ''}</Text>
            <Text style={styles.summaryTitle}>{alert.title}</Text>
            <Text style={styles.summaryDesc}>{alert.description}</Text>
            <View style={styles.summaryMeta}>
              <Badge severity={alert.resolved ? 'RESOLVED' : alert.severity} />
              <Text style={styles.timestamp}>{new Date(alert.timestamp).toLocaleString()}</Text>
            </View>
          </View>

          {/* Full AI root cause */}
          <RootCausePanel alert={alert} />

          {/* Resolution info */}
          {alert.resolved && alert.resolution_time && (
            <View style={styles.resolvedBox}>
              <View style={styles.resolvedDot} />
              <View>
                <Text style={styles.resolvedTitle}>RESOLVED</Text>
                <Text style={styles.resolvedTime}>
                  {new Date(alert.resolution_time).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.abbBlue }]}
              onPress={() => {
                handleClose();
                router.push('/(tabs)/graph');
              }}
            >
              <Text style={styles.actionBtnText}>View in Graph</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.abbGray1 }]}
              onPress={() => {
                dispatch({
                  type: 'SET_PENDING_QUERY',
                  payload: `Explain root cause for alert ${alert.id}: ${alert.title}. Detail: ${alert.description}`,
                });
                handleClose();
                router.push('/(tabs)/nlp');
              }}
            >
              <Text style={styles.actionBtnText}>Ask AI</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: SCREEN_H * 0.88,
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: Colors.borderPrimary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  severityBar: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  severityBarText: {
    color: '#fff', fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold, letterSpacing: 1.2,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: Colors.textTertiary },
  scroll: { paddingHorizontal: Spacing.base },
  summary: { marginBottom: Spacing.md },
  summaryPod:   { fontSize: Typography.sizes.xs, color: Colors.textTertiary, marginBottom: 4 },
  summaryTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 6 },
  summaryDesc:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  summaryMeta:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timestamp:    { fontSize: Typography.sizes.xs, color: Colors.textTertiary },
  resolvedBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.successTint,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  resolvedDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.successBorder,
    flexShrink: 0,
  },
  resolvedTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.success },
  resolvedTime:  { fontSize: Typography.sizes.xs, color: Colors.textTertiary },
  actions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  actionBtn: {
    flex: 1, borderRadius: Radius.md, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
