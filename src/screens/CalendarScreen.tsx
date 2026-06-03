import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutLogs } from '../services/database';
import { WorkoutLog } from '../types';

export default function CalendarScreen() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedDate, setSelectedDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      setLogs(getWorkoutLogs());
    }, [])
  );

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
      <Calendar
        markedDates={markedDates}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        theme={{
          todayTextColor: '#2563EB',
          selectedDayBackgroundColor: '#2563EB',
          arrowColor: '#2563EB',
        }}
      />

      {selectedDate ? (
        selectedLogs.length > 0 ? (
          <FlatList
            data={selectedLogs}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.logItem}>
                <Text style={styles.logName}>Treino {item.workout_name}</Text>
                <Text style={styles.logDate}>{item.date}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum treino neste dia</Text>
          </View>
        )
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Selecione um dia para ver os treinos</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { flex: 1, padding: 16 },
  logItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  logDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
});
