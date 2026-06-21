import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import { Colors, Typography, Spacing, Radius } from '../ui/tokens';
import { Alert } from '../../core/store/AppContext';

interface RootCausePanelProps {
  alert: Alert;
  compact?: boolean;
}

/**
 * AI Root Cause panel — shown beneath the active alert card.
 * Shows the AI-generated root cause text and evidence metrics table.
 */
export default function RootCausePanel({ alert, compact }: RootCausePanelProps) {
  const hasEvidence = (alert.evidence?.length ?? 0) > 0;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiTag}>
          <Text style={styles.aiTagText}>AI</Text>
        </View>
        <Text style={styles.headerTitle}>Root Cause Analysis</Text>
      </View>

      {/* Root cause text */}
      {alert.root_cause ? (
        <Text style={styles.rootCauseText} numberOfLines={compact ? 3 : undefined}>
          {alert.root_cause}
        </Text>
      ) : (
        <Text style={styles.noData}>No root cause analysis available yet.</Text>
      )}

      {/* Evidence table */}
      {hasEvidence && !compact && (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>EVIDENCE</Text>
          {alert.evidence!.map((item, i) => (
            <View key={i} style={[styles.evidenceRow, i % 2 === 0 && styles.evidenceRowAlt]}>
              <Text style={styles.evidenceMetric}>{item.metric}</Text>
              <View style={styles.evidenceRight}>
                <Text style={styles.evidenceValue}>{item.value}</Text>
                <Text style={[
                  styles.evidenceDeviation,
                  { color: item.deviation.startsWith('+') ? Colors.danger : Colors.success },
                ]}>
                  {item.deviation}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {compact && hasEvidence && (
        <Text style={styles.evidenceHint}>
          {alert.evidence!.length} evidence metrics — tap card to expand
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  aiTag: {
    backgroundColor: Colors.abbBlue,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rootCauseText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  noData: {
    fontSize: Typography.sizes.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  evidenceSection: { borderTopWidth: 1, borderTopColor: Colors.borderSecondary, paddingTop: Spacing.md },
  evidenceTitle: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  evidenceRowAlt: { backgroundColor: Colors.bgSurface },
  evidenceMetric: { fontSize: Typography.sizes.xs, color: Colors.textTertiary, flex: 1 },
  evidenceRight: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  evidenceValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  evidenceDeviation: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, minWidth: 44, textAlign: 'right' },
  evidenceHint: { fontSize: Typography.sizes.xs, color: Colors.textTertiary, fontStyle: 'italic' },
});
