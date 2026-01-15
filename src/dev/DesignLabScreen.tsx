import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import type { FC } from 'react';
import { useThemeStore } from '@store/index';
import { getTheme } from '@theme/tokens';
import { Card } from '@components/Card';
import { Badge } from '@components/Badge';
import { ListItem } from '@components/ListItem';
import { StatusLabel } from '@components/StatusLabel';
import { Loader } from '@components/Loader';
import { EmptyState } from '@components/EmptyState';
import { ErrorState } from '@components/ErrorState';

/**
 * DesignLab (DEV ONLY):
 * - Live theme toggles (light/dark mode + investor/classic tone)
 * - Typography scale preview (H1, H2, H3, body, caption)
 * - Component gallery: Card, Badge, ListItem, StatusLabel, Loader, EmptyState, ErrorState
 *
 * No fake performance metrics, no fake ROI.
 * Only design tokens and real component previews.
 */
export const DesignLabScreen: FC = () => {
  const { mode, tone, toggleMode, toggleTone } = useThemeStore();
  const theme = getTheme(mode, tone);
  const systemScheme = useColorScheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.bg }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        {/* Header */}
        <View style={{ gap: theme.spacing.md }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.color.text,
            }}
          >
            Design Lab
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.color.textMuted,
              lineHeight: theme.typography.lineHeight.base * theme.typography.fontSize.sm,
            }}
          >
            System scheme: {systemScheme ?? 'unknown'} | Mode: {mode} | Tone: {tone}
          </Text>
        </View>

        {/* Theme Toggles */}
        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            gap: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.color.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.color.text,
            }}
          >
            Theme Controls
          </Text>

          {/* Mode Toggle */}
          <Pressable
            onPress={toggleMode}
            style={{
              backgroundColor: theme.color.primary,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              Toggle Mode: {mode === 'light' ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </Pressable>

          {/* Tone Toggle */}
          <Pressable
            onPress={toggleTone}
            style={{
              backgroundColor: theme.color.primary,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              Toggle Tone: {tone === 'classic' ? '📱 Classic' : '💼 Investor'}
            </Text>
          </Pressable>
        </View>

        {/* Typography Preview */}
        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            gap: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.color.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.color.text,
            }}
          >
            Typography Scale
          </Text>

          <Text
            style={{
              fontSize: 30,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.color.text,
              lineHeight: 30 * 1.2,
            }}
          >
            H1: Heading 1
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.color.text,
              lineHeight: 24 * 1.2,
            }}
          >
            H2: Heading 2
          </Text>

          <Text
            style={{
              fontSize: 20,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.color.text,
              lineHeight: 20 * 1.2,
            }}
          >
            H3: Heading 3
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.regular,
              color: theme.color.text,
              lineHeight: theme.typography.lineHeight.base * theme.typography.fontSize.base,
            }}
          >
            Body: The quick brown fox jumps over the lazy dog. This is a standard paragraph with
            regular font weight.
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.regular,
              color: theme.color.textMuted,
              lineHeight: theme.typography.lineHeight.base * theme.typography.fontSize.sm,
            }}
          >
            Caption: Small text for supplementary information
          </Text>
        </View>

        {/* Component Gallery */}
        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            gap: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.color.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.color.text,
            }}
          >
            Component Gallery
          </Text>

          {/* Card */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              Card
            </Text>
            <Card
              style={{
                backgroundColor: theme.color.surface2,
                borderColor: theme.color.border,
                borderWidth: 1,
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
              }}
            >
              <Text style={{ color: theme.color.text }}>Card component preview</Text>
            </Card>
          </View>

          {/* Badges */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              Badges
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
              <Badge
                label="Default"
                style={{
                  backgroundColor: theme.color.surface2,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <Badge
                label="Success"
                style={{
                  backgroundColor: theme.color.success,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <Badge
                label="Warning"
                style={{
                  backgroundColor: theme.color.warning,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <Badge
                label="Danger"
                style={{
                  backgroundColor: theme.color.danger,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
            </View>
          </View>

          {/* ListItem */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              ListItem
            </Text>
            <ListItem
              title="Portfolio Item"
              subtitle="Holdings: $25,000.00"
              style={{
                backgroundColor: theme.color.surface2,
                borderRadius: theme.radius.md,
                borderBottomColor: theme.color.border,
              }}
            />
          </View>

          {/* StatusLabel */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              StatusLabel
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
              <StatusLabel
                label="Success"
                status="success"
                style={{
                  backgroundColor: theme.color.success,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <StatusLabel
                label="Error"
                status="error"
                style={{
                  backgroundColor: theme.color.danger,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <StatusLabel
                label="Warning"
                status="warning"
                style={{
                  backgroundColor: theme.color.warning,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
              <StatusLabel
                label="Info"
                status="info"
                style={{
                  backgroundColor: theme.color.primary,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              />
            </View>
          </View>

          {/* Loader */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              Loader
            </Text>
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
              <Loader />
            </View>
          </View>

          {/* EmptyState */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              EmptyState
            </Text>
            <View
              style={{
                backgroundColor: theme.color.surface2,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                alignItems: 'center',
              }}
            >
              <EmptyState message="No data available" />
            </View>
          </View>

          {/* ErrorState */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              ErrorState
            </Text>
            <View
              style={{
                backgroundColor: theme.color.surface2,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                alignItems: 'center',
              }}
            >
              <ErrorState message="Something went wrong" onRetry={() => {}} />
            </View>
          </View>

          {/* Color Palette */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.color.primary,
              }}
            >
              Color Palette
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              {Object.entries(theme.color).map(([name, color]) => (
                <View
                  key={name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 40,
                      backgroundColor: color,
                      borderRadius: theme.radius.sm,
                      borderWidth: 1,
                      borderColor: theme.color.border,
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.color.text,
                      }}
                    >
                      {name}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.color.textMuted,
                        fontFamily: 'monospace',
                      }}
                    >
                      {color}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer spacer */}
        <View style={{ height: theme.spacing.lg }} />
      </View>
    </ScrollView>
  );
};
