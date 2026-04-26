import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, typography } from '@theme/index';
import { ErrorState } from '@components/index';
import { useTipsStore } from '@store/tipsStore';
import { useUIConfigStore } from '@store/uiConfigStore';
import { useFeatureFlagsStore } from '@store/featureFlagsStore';
import { useAuthStore } from '@store/authStore';
import { runtimeEngine } from '@services/runtimeEngine';
import { uiFeedbackService } from '@services/uiFeedbackService';
import type { HomeSectionDecision, HomeSectionKey } from '@services/uiConfigService';

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
  vipText: {
    color: '#FFD166',
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
  ctaBanner: {
    backgroundColor: '#11251F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E473D',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  ctaTitle: {
    color: COLORS.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  ctaDescription: {
    color: COLORS.textPrimary,
    fontSize: typography.sizes.sm,
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
  const { tips, isLoading, isRefreshing, error, refreshTips } = useTipsStore();
  const { session } = useAuthStore();
  const uiConfig = useUIConfigStore((state) => state.config);
  const homeDecisions = useUIConfigStore((state) => state.getResolvedHomeDecisions());
  const strategy = useUIConfigStore((state) => state.getResolvedStrategy());
  useFeatureFlagsStore((state) => state.config);
  const isFeatureEnabled = useFeatureFlagsStore((state) => state.isEnabled);
  const screenVisibleAtRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);

  const refreshFromMount = useCallback(() => {
    void runtimeEngine.refreshDataOnMount();
  }, []);

  const refreshFromFocus = useCallback(() => {
    void runtimeEngine.refreshDataOnFocus();
  }, []);

  const refreshManually = useCallback(() => {
    void refreshTips({ trigger: 'manual', force: true });
  }, [refreshTips]);

  useEffect(() => {
    refreshFromMount();
  }, [refreshFromMount]);

  useFocusEffect(
    useCallback(() => {
      refreshFromFocus();
      return undefined;
    }, [refreshFromFocus]),
  );

  useEffect(() => {
    screenVisibleAtRef.current = Date.now();

    return () => {
      const durationMs = Date.now() - screenVisibleAtRef.current;

      uiFeedbackService.track({
        screen: 'home',
        sectionType: 'home_scroll_depth',
        eventType: 'interaction',
        strategy,
        scrollDepth: maxScrollDepthRef.current,
        userSegment: uiConfig.userSegment,
        timestamp: Date.now(),
      });

      uiFeedbackService.track({
        screen: 'home',
        sectionType: 'home_screen',
        eventType: 'view_duration',
        strategy,
        durationMs,
        scrollDepth: maxScrollDepthRef.current,
        userSegment: uiConfig.userSegment,
        timestamp: Date.now(),
      });

      void uiFeedbackService.flush();
    };
  }, [strategy, uiConfig.userSegment]);

  const effectiveFeatures = useMemo(() => {
    if (strategy === 'minimize_risk') {
      return {
        ...uiConfig.home.features,
        showOdds: false,
      };
    }

    return uiConfig.home.features;
  }, [strategy, uiConfig.home.features]);

  const strategyAwareTips = useMemo(() => {
    if (strategy === 'minimize_risk') {
      return tips.filter((tip) => tip.ev >= 0).slice(0, 3);
    }

    if (strategy === 'maximize_conversion') {
      return tips.slice(0, 4);
    }

    return tips;
  }, [strategy, tips]);

  const decisionTypes = useMemo(() => new Set(homeDecisions.map((decision) => decision.type)), [homeDecisions]);

  const shouldShowSection = useCallback((decision: HomeSectionDecision): boolean => {
    if (decision.score < 0 || decision.score > 1) {
      return false;
    }

    const flagKey = uiConfig.home.sectionFlags?.[decision.type];
    if (!flagKey) {
      return true;
    }

    return isFeatureEnabled(flagKey, session?.userId ?? null);
  }, [isFeatureEnabled, session?.userId, uiConfig.home.sectionFlags]);

  const trackInteraction = useCallback((eventType: 'click' | 'interaction' | 'conversion', decision: HomeSectionDecision): void => {
    uiFeedbackService.track({
      screen: 'home',
      sectionType: decision.type,
      eventType,
      strategy,
      reason: decision.reason,
      score: decision.score,
      userSegment: uiConfig.userSegment,
      timestamp: Date.now(),
    });
  }, [strategy, uiConfig.userSegment]);

  const renderTipCard = useCallback((tip: (typeof tips)[number], decision: HomeSectionDecision) => {
    const packageName = tip.packageName ?? 'Black';

    return (
      <Pressable
        key={`${decision.type}-${tip.id}`}
        style={styles.tipCard}
        onPress={() => {
          trackInteraction('click', decision);
        }}
      >
        <View style={styles.tipHeader}>
          <Text style={styles.teamName}>{tip.targetTeam}</Text>
          <View style={[styles.packageBadge, { backgroundColor: PACKAGE_COLORS[packageName] }]}> 
            <Text style={styles.packageText}>{packageName}</Text>
          </View>
        </View>

        {effectiveFeatures.highlightVIP && (packageName === 'Elite' || packageName === 'Royal') && (
          <Text style={styles.vipText}>VIP SIGNAL</Text>
        )}

        <View style={styles.tipDetails}>
          {effectiveFeatures.showOdds && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ODDS</Text>
              <Text style={styles.detailValue}>{tip.odds.toFixed(2)}</Text>
            </View>
          )}

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
      </Pressable>
    );
  }, [effectiveFeatures.highlightVIP, effectiveFeatures.showOdds, trackInteraction]);

  const renderHeroTip = useCallback((decision: HomeSectionDecision) => {
    const heroTip = strategyAwareTips[0];
    if (!heroTip) {
      return null;
    }

    return renderTipCard(heroTip, decision);
  }, [renderTipCard, strategyAwareTips]);

  const renderTopTips = useCallback((decision: HomeSectionDecision) => {
    const hasHeroEnabled = decisionTypes.has('heroTip');
    const items = hasHeroEnabled ? strategyAwareTips.slice(1) : strategyAwareTips;

    return items.map((tip) => renderTipCard(tip, decision));
  }, [decisionTypes, renderTipCard, strategyAwareTips]);

  const renderCtaBanner = useCallback((decision: HomeSectionDecision) => {
    const isHighValue = uiConfig.userSegment === 'high_value';
    const title = strategy === 'maximize_conversion'
      ? 'Upgrade Conversion Path'
      : isHighValue
        ? 'VIP Momentum Active'
        : 'Upgrade Your Edge';

    const description = strategy === 'minimize_risk'
      ? 'Risk-aware mode is active. Safer, lower-volatility opportunities are prioritized.'
      : isHighValue
        ? 'Your segment receives accelerated signal windows and premium risk filters.'
        : 'Unlock premium segmentation and higher-priority signals in real time.';

    return (
      <Pressable
        style={styles.ctaBanner}
        onPress={() => {
          trackInteraction('conversion', decision);
        }}
      >
        <Text style={styles.ctaTitle}>{title}</Text>
        <Text style={styles.ctaDescription}>{description}</Text>
      </Pressable>
    );
  }, [strategy, trackInteraction, uiConfig.userSegment]);

  const sectionRenderers: Record<HomeSectionKey, (decision: HomeSectionDecision) => ReactNode> = {
    heroTip: (decision) => renderHeroTip(decision),
    topTips: (decision) => renderTopTips(decision),
    ctaBanner: (decision) => renderCtaBanner(decision),
  };

  const visibleDecisions = homeDecisions.filter((decision) => shouldShowSection(decision));

  const shouldShowEmptyState = !isLoading && !error && strategyAwareTips.length === 0;
  const shouldRenderSections = !error && strategyAwareTips.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: uiConfig.branding.primaryColor || COLORS.accent }]}>
          {uiConfig.branding.appName}
        </Text>
        <Text style={styles.subtitle}>QUANTUM SIGNAL ANALYTICS</Text>
        <Text style={styles.dateText}>{getTodayDate()}</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { y } = event.nativeEvent.contentOffset;
          const viewportHeight = event.nativeEvent.layoutMeasurement.height;
          const contentHeight = event.nativeEvent.contentSize.height;

          if (contentHeight <= 0) {
            return;
          }

          const maxScrollableDistance = Math.max(1, contentHeight - viewportHeight);
          const normalized = Math.max(0, Math.min(1, y / maxScrollableDistance));

          if (normalized > maxScrollDepthRef.current) {
            maxScrollDepthRef.current = normalized;
          }
        }}
        scrollEventThrottle={120}
        onScrollBeginDrag={() => {
          uiFeedbackService.track({
            screen: 'home',
            sectionType: 'home_scroll',
            eventType: 'interaction',
            strategy,
            scrollDepth: maxScrollDepthRef.current,
            userSegment: uiConfig.userSegment,
            timestamp: Date.now(),
          });
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing && !isLoading}
            onRefresh={refreshManually}
            tintColor={COLORS.accent}
          />
        }
      >
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        {error && <ErrorState message={error} onRetry={refreshManually} style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.danger, borderWidth: 1 }} />}

        {shouldShowEmptyState && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No picks today</Text>
            <Text style={styles.emptyMessage}>Check back later for today's picks</Text>
          </View>
        )}

        {shouldRenderSections && visibleDecisions.map((decision) => {
          const renderer = sectionRenderers[decision.type];
          return <View key={`${decision.type}-${decision.reason}`}>{renderer?.(decision)}</View>;
        })}

        {onLogout && (
          <Pressable
            style={styles.logoutButton}
            onPress={() => {
              uiFeedbackService.track({
                screen: 'home',
                sectionType: 'logout_button',
                eventType: 'click',
                strategy,
                userSegment: uiConfig.userSegment,
                timestamp: Date.now(),
              });
              onLogout();
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
