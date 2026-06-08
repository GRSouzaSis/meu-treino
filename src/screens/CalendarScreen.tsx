import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutLogs, deleteWorkoutLog } from '../services/database';
import { WorkoutLog } from '../types';

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatDuration(seconds: number) {
  if (!seconds) return 'Treino concluído';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function formatDatePT(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day} de ${MONTHS_PT[Number(month) - 1]} de ${year}`;
}

export default function CalendarScreen() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      setLogs(getWorkoutLogs());
    }, [])
  );

  function handleDelete(log: WorkoutLog) {
    Alert.alert('Excluir registro', `Excluir o treino ${log.workout_name} do dia ${formatDatePT(log.date)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteWorkoutLog(log.id);
          setLogs(logs.filter(l => l.id !== log.id));
        },
      },
    ]);
  }

  const markedDates = logs.reduce<Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }>>((acc, log) => {
    acc[log.date] = { marked: true, dotColor: '#2563EB' };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#2563EB',
    };
  }

  const selectedLogs = logs.filter(l => l.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
        <Text style={styles.headerSub}>Seus treinos registrados</Text>
      </View>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#6B7280',
          selectedDayBackgroundColor: '#2563EB',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2563EB',
          todayBackgroundColor: '#EFF6FF',
          dayTextColor: '#111827',
          textDisabledColor: '#D1D5DB',
          dotColor: '#2563EB',
          selectedDotColor: '#ffffff',
          arrowColor: '#2563EB',
          monthTextColor: '#111827',
          textMonthFontSize: 18,
          textMonthFontWeight: '700',
          textDayFontSize: 14,
          textDayHeaderFontSize: 12,
          textDayHeaderFontWeight: '600',
        }}
      />

      <View style={styles.section}>
        {selectedDate ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{formatDatePT(selectedDate)}</Text>
              {selectedLogs.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedLogs.length}</Text>
                </View>
              )}
            </View>
            {selectedLogs.length > 0 ? (
              <FlatList
                data={selectedLogs}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <View style={styles.logCard}>
                    <View style={styles.logAccent} />
                    <View style={styles.logIconWrap}>
                      <Text style={styles.logIcon}>💪</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{item.workout_name}</Text>
                      <Text style={styles.logSub}>{formatDuration(item.duration_seconds)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏖️</Text>
                <Text style={styles.emptyText}>Nenhum treino neste dia</Text>
                <Text style={styles.emptyHint}>Dia de descanso!</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Selecione um dia</Text>
            <Text style={styles.emptyHint}>Toque em uma data para ver os treinos</Text>
          </View>
        )}
      </View>
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
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  section: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
  badge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  logAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#2563EB' },
  logIconWrap: { padding: 12 },
  logIcon: { fontSize: 22 },
  logName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  logSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  deleteBtn: { padding: 12 },
  deleteBtnText: { fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
