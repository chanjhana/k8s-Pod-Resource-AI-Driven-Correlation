import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../components/ui/tokens';
import { useWsConnected, useAlerts } from '../../core/store/AppContext';

/**
 * Professional tab icon — uses a short text label with a coloured
 * active bar indicator instead of emojis.
 */
function TabIcon({ label, focused, badgeCount = 0, danger = false }: {
  label: string; focused: boolean; badgeCount?: number; danger?: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      {/* Active indicator bar */}
      <View style={[styles.activeBar, focused && styles.activeBarOn]} />

      <View style={styles.labelWrapper}>
        <Text style={[styles.label, focused && styles.labelActive, danger && styles.labelDanger]}>
          {label}
        </Text>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const wsConnected   = useWsConnected();
  const alerts        = useAlerts();
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.abbBlack },
        headerTintColor: Colors.abbWhite,
        headerTitleStyle: { fontWeight: '700', fontSize: Typography.sizes.md, letterSpacing: 0.5 },
        tabBarStyle: {
          backgroundColor: Colors.abbBlack,
          borderTopColor: '#2a2a2a',
          height: 58,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'EdgeMind',
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={[styles.liveDot, { backgroundColor: wsConnected ? Colors.success : Colors.abbGray2 }]} />
              <Text style={[styles.liveLabel, !wsConnected && styles.liveLabelOff]}>
                {wsConnected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon label="ALERTS" focused={focused} badgeCount={criticalCount} danger={criticalCount > 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Alert History',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="HISTORY" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nlp"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="AI" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="TIMELINE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="graph"
        options={{
          title: 'Dependency Graph',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="GRAPH" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: 58,
  },
  activeBar: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  activeBarOn: {
    backgroundColor: Colors.abbRed,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.abbGray2,
    letterSpacing: 0.8,
  },
  labelActive: {
    color: Colors.abbWhite,
  },
  labelDanger: {
    color: Colors.danger,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveLabel: {
    color: Colors.abbWhite,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveLabelOff: { color: Colors.abbGray2 },
});
