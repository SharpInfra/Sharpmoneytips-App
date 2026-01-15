import { View, Text, ScrollView } from 'react-native';

/**
 * DesignLab (DEV ONLY):
 * - Component gallery
 * - Live toggles (dark/light, compact/comfortable, investor/classic)
 * - Golden screens preview (Feed, Detail)
 *
 * No fake performance metrics, no fake ROI.
 * Only layout fixtures or real backend.
 */
export function DesignLabScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Design Lab</Text>
        <Text>Next: add theme provider + toggles + component gallery.</Text>
      </View>
    </ScrollView>
  );
}
