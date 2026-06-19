import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlerts, useApp, Alert } from '../../core/store/AppContext';
import TimelineStrip from '../../components/timeline/TimelineStrip';
import AlertCard from '../../components/alerts/AlertCard';
import InvestigationModal from '../../components/alerts/InvestigationModal';
import Card from '../../components/ui/Card';
import { Colors, Typography, Spacing } from '../../components/ui/tokens';

export default function TimelineScreen() {
  const alerts = useAlerts();
  const { dispatch } = useApp();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // All alerts in chronological order for the list below the strip
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Timeline strip */}
        <Text style={styles.sectionLabel}>ANOMALY TIMELINE · LAST 2 HOURS</Text>
        <Card style={styles.stripCard}>
          <TimelineStrip
            alerts={alerts}
            onEventPress={(alert) => {
              dispatch({ type: 'SET_ACTIVE_ALERT', payload: alert });
              setSelectedAlert(alert);
            }}
          />
          <Text style={styles.stripHint}>← Scroll · Tap dot to view alert</Text>
        </Card>

        {/* Chronological event list */}
        <Text style={styles.sectionLabel}>EVENT LOG</Text>
        {sorted.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onPress={() => {
              dispatch({ type: 'SET_ACTIVE_ALERT', payload: alert });
              setSelectedAlert(alert);
            }}
          />
        ))}

        {sorted.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyBars}>
              <View style={[styles.emptyBar, { height: 20 }]} />
              <View style={[styles.emptyBar, { height: 32 }]} />
              <View style={[styles.emptyBar, { height: 16 }]} />
              <View style={[styles.emptyBar, { height: 28 }]} />
              <View style={[styles.emptyBar, { height: 12 }]} />
            </View>
            <Text style={styles.emptyText}>No events in the last 2 hours</Text>
          </View>
        )}
      </ScrollView>

      {selectedAlert && (
        <InvestigationModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgSurface },
  content:  { padding: Spacing.base, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 10, fontWeight: Typography.weights.bold,
    color: Colors.textTertiary, letterSpacing: 1.4,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  stripCard: { padding: Spacing.sm, overflow: 'hidden', marginBottom: Spacing.md },
  stripHint: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyBars: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 6, marginBottom: Spacing.md,
  },
  emptyBar: {
    width: 10, borderRadius: 3,
    backgroundColor: Colors.borderSecondary,
  },
  emptyText: { color: Colors.textTertiary, fontSize: Typography.sizes.sm },
});
