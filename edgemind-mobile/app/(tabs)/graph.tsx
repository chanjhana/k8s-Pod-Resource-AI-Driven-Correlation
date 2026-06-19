import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGraph, useAlerts } from '../../core/store/AppContext';
import DependencyGraph from '../../components/graph/DependencyGraph';
import { Colors, Typography, Spacing, Radius } from '../../components/ui/tokens';
import { GraphNode } from '../../core/store/AppContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SeverityDot from '../../components/ui/SeverityDot';

export default function GraphScreen() {
  const { nodes, edges } = useGraph();
  const alerts = useAlerts();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Find alert for selected node
  const nodeAlert = selectedNode
    ? alerts.find(a => a.pod_id === selectedNode.id)
    : null;

  // Legend items
  const LEGEND = [
    { color: Colors.danger,  label: 'CRITICAL' },
    { color: Colors.warning, label: 'WARNING'  },
    { color: Colors.success, label: 'HEALTHY'  },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Legend */}
        <View style={styles.legend}>
          {LEGEND.map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{label}</Text>
            </View>
          ))}
          <Text style={styles.legendHint}>Pan to explore</Text>
        </View>

        {/* Graph canvas */}
        <View style={styles.graphContainer}>
          <DependencyGraph
            nodes={nodes}
            edges={edges}
            onNodePress={setSelectedNode}
          />
        </View>

        {/* Selected node detail */}
        {selectedNode && (
          <Card>
            <View style={styles.nodeDetailHeader}>
              <SeverityDot severity={selectedNode.severity} />
              <Text style={styles.nodeId}>{selectedNode.id}</Text>
              <Badge severity={selectedNode.severity} small />
            </View>
            <Text style={styles.nodeType}>{selectedNode.type?.toUpperCase()}</Text>
            {nodeAlert ? (
              <>
                <Text style={styles.nodeAlertTitle}>{nodeAlert.title}</Text>
                {nodeAlert.root_cause ? (
                  <Text style={styles.nodeRootCause} numberOfLines={3}>
                    {nodeAlert.root_cause}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.nodeHealthy}>No active alerts for this service.</Text>
            )}
          </Card>
        )}

        {/* Edge legend */}
        <Card>
          <Text style={styles.edgeLegendTitle}>EDGE TYPES</Text>
          <View style={styles.edgeLegendRow}>
            <View style={styles.solidLine} />
            <Text style={styles.edgeLegendLabel}>Data flow</Text>
          </View>
          <View style={styles.edgeLegendRow}>
            <View style={styles.dashedLine} />
            <Text style={styles.edgeLegendLabel}>Trigger / alert</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: Colors.bgSurface },
  content:     { paddingBottom: 32 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: '600' },
  legendHint:  { flex: 1, textAlign: 'right', fontSize: 9, color: Colors.textTertiary, fontStyle: 'italic' },
  graphContainer: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
    overflow: 'hidden',
  },
  nodeDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  nodeId:           { flex: 1, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  nodeType:         { fontSize: 10, color: Colors.textTertiary, letterSpacing: 1, marginBottom: 6 },
  nodeAlertTitle:   { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: 4 },
  nodeRootCause:    { fontSize: Typography.sizes.xs, color: Colors.textSecondary, lineHeight: 16 },
  nodeHealthy:      { fontSize: Typography.sizes.sm, color: Colors.success },
  edgeLegendTitle: { fontSize: 10, color: Colors.textTertiary, letterSpacing: 1, marginBottom: Spacing.sm, fontWeight: Typography.weights.bold },
  edgeLegendRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: 6 },
  solidLine:  { width: 32, height: 2, backgroundColor: Colors.borderPrimary },
  dashedLine: { width: 32, height: 2, backgroundColor: Colors.warning, borderStyle: 'dashed' },
  edgeLegendLabel: { fontSize: Typography.sizes.xs, color: Colors.textTertiary },
});
