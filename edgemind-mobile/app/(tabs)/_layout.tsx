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
        <Text 
          numberOfLines={1} 
          style={[styles.label, focused && styles.labelActive, danger && styles.labelDanger]}
        >
          {label}
        </Text>
      </View>
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
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
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
        },
        tabBarItemStyle: {
          height: 58,
          justifyContent: 'center',
          alignItems: 'center',
        },
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
    width: '100%',
    paddingHorizontal: 1,
    position: 'relative',
  },
  activeBar: {
    width: '80%',
    height: 3,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  activeBarOn: {
    backgroundColor: Colors.abbRed,
  },
  labelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    width: '100%',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.abbGray2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.abbWhite,
  },
  labelDanger: {
    color: Colors.danger,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 2,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.5,
    borderWidth: 1.5,
    borderColor: Colors.abbBlack,
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
