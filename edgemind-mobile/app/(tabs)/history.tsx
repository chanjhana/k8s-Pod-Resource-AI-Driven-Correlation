import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlerts, useApp, Alert } from '../../core/store/AppContext';
import AlertCard from '../../components/alerts/AlertCard';
import InvestigationModal from '../../components/alerts/InvestigationModal';
import { Colors, Typography, Spacing } from '../../components/ui/tokens';

export default function HistoryScreen() {
  const alerts = useAlerts();
  const { dispatch } = useApp();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sort: CRITICAL first, then WARNING, then HEALTHY/RESOLVED
  const sorted = [...alerts].sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 };
    const aOrd = (order as any)[a.severity] ?? 3;
    const bOrd = (order as any)[b.severity] ?? 3;
    if (aOrd !== bOrd) return aOrd - bOrd;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const critCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length;
  const warnCount = alerts.filter(a => a.severity === 'WARNING'  && !a.resolved).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryPill, { backgroundColor: Colors.dangerTint, borderColor: Colors.dangerBorder }]}>
          <Text style={[styles.summaryCount, { color: Colors.danger }]}>{critCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.danger }]}>CRITICAL</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: Colors.warningTint, borderColor: Colors.warningBorder }]}>
          <Text style={[styles.summaryCount, { color: Colors.warning }]}>{warnCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.warning }]}>WARNING</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: Colors.successTint, borderColor: Colors.successBorder }]}>
          <Text style={[styles.summaryCount, { color: Colors.success }]}>{alerts.length - critCount - warnCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.success }]}>OK</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
            tintColor={Colors.abbRed}
          />
        }
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => {
              dispatch({ type: 'SET_ACTIVE_ALERT', payload: item });
              setSelectedAlert(item);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <View style={[styles.emptyLine, { width: 60 }]} />
            <Text style={styles.emptyText}>No alerts recorded</Text>
          </View>
        }
      />

      {selectedAlert && (
        <InvestigationModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: Colors.bgSurface },
  summaryBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderCard,
  },
  summaryPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8,
    paddingVertical: 6,
  },
  summaryCount: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  summaryLabel: { fontSize: 10, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
  list:  { padding: Spacing.base, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyLine: {
    width: 120, height: 8, borderRadius: 4,
    backgroundColor: Colors.borderSecondary,
  },
  emptyText: { color: Colors.textTertiary, fontSize: Typography.sizes.sm, marginTop: Spacing.md },
});
