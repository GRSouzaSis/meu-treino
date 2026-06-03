import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCheckInsByYear, getCheckInsByMonth } from '../services/database';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface YearItem {
  year: string;
  count: number;
}

interface MonthItem {
  month: string;
  count: number;
}

export default function StatsScreen() {
  const [years, setYears] = useState<YearItem[]>([]);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<MonthItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setYears(getCheckInsByYear());
      setExpandedYear(null);
      setMonthData([]);
    }, [])
  );

  function toggleYear(year: string) {
    if (expandedYear === year) {
      setExpandedYear(null);
      setMonthData([]);
    } else {
      setExpandedYear(year);
      setMonthData(getCheckInsByMonth(year));
    }
  }

  const maxMonthCount = monthData.length > 0 ? Math.max(...monthData.map(m => m.count)) : 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-ins</Text>
        <Text style={styles.headerSub}>Seu histórico de treinos</Text>
      </View>

      {years.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Nenhum treino registrado</Text>
          <Text style={styles.emptyHint}>Complete treinos para ver seu histórico</Text>
        </View>
      ) : (
        <FlatList
          data={years}
          keyExtractor={item => item.year}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isExpanded = expandedYear === item.year;
            return (
              <View style={[styles.yearCard, isExpanded && styles.yearCardExpanded]}>
                <TouchableOpacity style={styles.yearRow} onPress={() => toggleYear(item.year)} activeOpacity={0.7}>
                  <View style={styles.yearAccent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.yearText}>{item.year}</Text>
                    <Text style={styles.yearCount}>
                      {item.count} treino{item.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.monthsContainer}>
                    <View style={styles.divider} />
                    {monthData.map(m => (
                      <View key={m.month} style={styles.monthRow}>
                        <Text style={styles.monthName}>
                          {MONTHS_PT[Number(m.month) - 1]}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${(m.count / maxMonthCount) * 100}%` as any },
                            ]}
                          />
                        </View>
                        <Text style={styles.monthCount}>{m.count}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  list: { padding: 16 },

  yearCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  yearCardExpanded: { elevation: 3 },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  yearAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginRight: 12,
  },
  yearText: { fontSize: 20, fontWeight: '800', color: '#111827' },
  yearCount: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  monthsContainer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 10 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthName: { width: 80, fontSize: 13, fontWeight: '600', color: '#374151' },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },
  monthCount: { width: 24, fontSize: 13, fontWeight: '700', color: '#2563EB', textAlign: 'right' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
