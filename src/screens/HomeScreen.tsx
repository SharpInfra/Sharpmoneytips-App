 import type { FC } from 'react';
 import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { spacing, typography } from '@theme/index';
import { ErrorState } from '@components/index';
import { useTipsStore } from '@store/tipsStore';
import { tipsService } from '@services/tipsService';

type HomeScreenProps = {
  onLogout?: () => void;
};

const COLORS = {
  bg: '#0A0A0A',
  accent: '#2DC5A2',
  textPrimary: '#EEEEEE',
  textMuted: '#555555',
  black: '#333333',
  elite: '#C9A84C',
  royal: '#6B2FA0',
  success: '#22C55E',
  danger: '#EF4444',
  cardBg: '#1A1A1A',
};

const PACKAGE_COLORS: Record<string, string> = {
  Black: COLORS.black,
  Elite: COLORS.elite,
  Royal: COLORS.royal,
  Discarded: '#666666',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.md,
  },
  logoText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: COLORS.accent,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: COLORS.textMuted,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  tipCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  teamName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  packageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  lockIcon: {
    fontSize: 12,
  },
  tipDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontWeight: typography.weights.semibold,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: COLORS.textPrimary,
  },
  evPositive: {
    color: COLORS.success,
  },
  evNegative: {
    color: COLORS.danger,
  },
  league: {
    fontSize: typography.sizes.sm,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.textMuted,
    fontWeight: typography.weights.semibold,
  },
});

const getTodayDate = (): string => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return today.toLocaleDateString('en-US', options);
};

export const HomeScreen: FC<HomeScreenProps> = ({ onLogout }) => {
  const { tips, isLoading, error, setTips, setLoading, setError } = useTipsStore();

  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tipsService.runPipeline('sharpmoney');
      if (response.error) {
        setError(response.error.message);
      } else {
        const data = response.data as any;
        const savedTips = data?.savedTips ?? [];
        const visibleTips = savedTips.filter((t: any) => t.packageName !== 'Discarded');
        setTips(visibleTips);
      }
    } catch (err) {
      setError('Failed to load tips');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTips();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>MR. SHARPMONEY</Text>
        <Text style={styles.subtitle}>QUANTUM SIGNAL ANALYTICS</Text>
        <Text style={styles.dateText}>{getTodayDate()}</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        {error && <ErrorState message={error} onRetry={loadTips} style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.danger, borderWidth: 1 }} />}

        {!isLoading && !error && tips.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No picks today</Text>
            <Text style={styles.emptyMessage}>Check back later for today's picks</Text>
          </View>
        )}

        {tips.map((tip) => {
          const packageName = tip.packageName ?? 'Black';

          return (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.teamName}>{tip.targetTeam}</Text>
                <View style={[styles.packageBadge, { backgroundColor: PACKAGE_COLORS[packageName] }]}>
                  <Text style={styles.packageText}>{packageName}</Text>
                </View>
              </View>

              <View style={styles.tipDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ODDS</Text>
                  <Text style={styles.detailValue}>{tip.odds.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>EV</Text>
                  <Text style={[styles.detailValue, tip.ev >= 0 ? styles.evPositive : styles.evNegative]}>
                    {tip.ev >= 0 ? '+' : ''}{(tip.ev * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>RISK</Text>
                  <Text style={styles.detailValue}>{tip.riskLevel ?? '-'}</Text>
                </View>
              </View>

              <Text style={styles.league}>{(tip.metadata as any)?.league ?? ''}</Text>
            </View>
          );
        })}

        {onLogout && (
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
