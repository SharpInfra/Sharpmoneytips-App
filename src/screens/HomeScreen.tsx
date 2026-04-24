import type { FC } from 'react';
import { useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { spacing, typography } from '@theme/index';
import { Card, EmptyState, ErrorState } from '@components/index';
import { useTipsStore } from '@store/tipsStore';
import { tipsService } from '@services/tipsService';

type HomeScreenProps = {
  onLogout?: () => void;
};

const PACKAGE_COLORS: Record<string, string> = {
  Black: '#1A1A1A',
  Elite: '#C9A84C',
  Royal: '#6B2FA0',
  Discarded: '#999999',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  title: { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.base, color: '#666666' },
  content: { padding: spacing.lg },
  tipCard: { marginBottom: spacing.md, padding: spacing.md },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  teamName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, flex: 1 },
  packageBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  packageText: { color: '#FFFFFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  tipDetails: { flexDirection: 'row', gap: spacing.md },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: typography.sizes.xs, color: '#999999', marginBottom: 2 },
  detailValue: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  league: { fontSize: typography.sizes.sm, color: '#666666', marginTop: spacing.sm },
  logoutButton: { marginTop: spacing.xl, padding: spacing.md, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, alignItems: 'center' },
  logoutButtonText: { color: '#666666', fontWeight: typography.weights.semibold },
  evPositive: { color: '#22C55E' },
  evNegative: { color: '#EF4444' },
});

export const HomeScreen: FC<HomeScreenProps> = ({ onLogout }) => {
  const { tips, isLoading, error, setTips, setLoading, setError } = useTipsStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tips</Text>
        <Text style={styles.subtitle}>SharpMoney AI picks</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && <ActivityIndicator size="large" color="#6B2FA0" />}

        {error && <ErrorState message={error} onRetry={loadTips} />}

        {!isLoading && !error && tips.length === 0 && (
          <Card>
            <EmptyState title="No Tips Today" message="Check back later for today's picks." />
          </Card>
        )}

        {tips.map((tip) => (
          <Card key={tip.id} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.teamName}>{tip.targetTeam}</Text>
              <View style={[styles.packageBadge, { backgroundColor: PACKAGE_COLORS[tip.packageName ?? 'Discarded'] }]}>
                <Text style={styles.packageText}>{tip.packageName}</Text>
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
          </Card>
        ))}
        {onLogout && (
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
