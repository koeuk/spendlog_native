import { useRouter } from "expo-router";
import { ChevronRight, Settings } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { Txt } from "@/components/Txt";
import { useT } from "@/i18n";
import {
  useDashboardCardsStore,
  type SummaryCardId,
} from "@/store/dashboardCards";
import { radius } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { Dashboard, Money } from "@/types/api";
import { amountNumber, formatMoney } from "@/utils/money";

interface SummaryControlCardProps {
  data: Dashboard;
  negativeBalance: boolean;
  plannedSavings: boolean;
  topSource: { source: string; total: Money } | null;
  incomeTotal: number;
  onOpenManage: () => void;
}

/**
 * A single unified card that contains and controls the summary cards
 * (Today, Balance, Savings, Income) in one consolidated dashboard component.
 */
export function SummaryControlCard({
  data,
  negativeBalance,
  plannedSavings,
  topSource,
  incomeTotal,
  onOpenManage,
}: SummaryControlCardProps) {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const cards = useDashboardCardsStore((state) => state.cards);
  const visibleCards = cards.filter((c) => c.visible);

  const tileBg = theme.isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.03)";
  const tileBorder = theme.isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.06)";

  const pairs: SummaryCardId[][] = [];
  for (let i = 0; i < visibleCards.length; i += 2) {
    pairs.push(visibleCards.slice(i, i + 2).map((c) => c.id));
  }

  const renderTile = (id: SummaryCardId) => {
    switch (id) {
      case "today":
        return (
          <View
            key="today"
            style={[
              styles.tile,
              { backgroundColor: tileBg, borderColor: tileBorder },
            ]}
          >
            <Txt variant="label" faint={0.6}>
              {t("Today")}
            </Txt>
            <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(data.today.total)}
            </Txt>
          </View>
        );
      case "balance":
        return (
          <View
            key="balance"
            style={[
              styles.tile,
              { backgroundColor: tileBg, borderColor: tileBorder },
            ]}
          >
            <Txt variant="label" faint={0.6}>
              {t("Balance")}
            </Txt>
            <Txt
              variant="xl"
              color={negativeBalance ? theme.errorInk : theme.text}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatMoney(data.balance, "signed")}
            </Txt>
            <Txt variant="caption" faint={0.5}>
              {t("Income")} {formatMoney(data.income.total)}
            </Txt>
          </View>
        );
      case "savings":
        return (
          <Pressable
            key="savings"
            accessibilityRole="button"
            style={styles.tilePress}
            onPress={() => router.push("/savings")}
          >
            <View
              style={[
                styles.tile,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
            >
              <View style={styles.rowBetween}>
                <Txt variant="label" faint={0.6}>
                  {t("Savings")}
                </Txt>
                <ChevronRight size={16} color={theme.faint(0.3)} />
              </View>
              <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(data.savings.saved_this_month)}
              </Txt>
              <Txt variant="caption" faint={0.5} numberOfLines={1}>
                {t("Total saved")}{" "}
                {formatMoney(data.savings.total_saved, "signed")}
              </Txt>
              {plannedSavings ? (
                <ProgressBar
                  percent={data.savings.percent}
                  color={theme.accent}
                  height={6}
                />
              ) : null}
            </View>
          </Pressable>
        );
      case "income":
        return (
          <Pressable
            key="income"
            accessibilityRole="button"
            style={styles.tilePress}
            onPress={() => router.push("/income")}
          >
            <View
              style={[
                styles.tile,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
            >
              <View style={styles.rowBetween}>
                <Txt variant="label" faint={0.6}>
                  {t("Income")}
                </Txt>
                <ChevronRight size={16} color={theme.faint(0.3)} />
              </View>
              <Txt variant="xl" numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(data.income.total)}
              </Txt>
              {topSource ? (
                <Txt variant="caption" faint={0.5} numberOfLines={1}>
                  {t("Top source")} {topSource.source}
                </Txt>
              ) : null}
              {topSource && incomeTotal > 0 ? (
                <ProgressBar
                  percent={(amountNumber(topSource.total) / incomeTotal) * 100}
                  color={theme.accent}
                  height={6}
                />
              ) : null}
            </View>
          </Pressable>
        );
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Txt variant="heading">{t("Card summary")}</Txt>
          <Txt variant="label" faint={0.55}>
            {t("Overview of your cash flow")}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Manage cards")}
          onPress={onOpenManage}
          style={({ pressed }) => [
            styles.controlGear,
            { backgroundColor: "#0084FF" },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Settings size={18} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.tilesContainer}>
        {pairs.map((pair, pIdx) => (
          <View key={pIdx} style={styles.tilePair}>
            {pair.map((id) => renderTile(id))}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  controlGear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0084FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  tilesContainer: {
    gap: 10,
  },
  tilePair: {
    flexDirection: "row",
    gap: 10,
  },
  tilePress: {
    flex: 1,
  },
  tile: {
    flex: 1,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
