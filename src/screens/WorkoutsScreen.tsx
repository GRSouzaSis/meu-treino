import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWorkouts, deleteWorkout } from '../services/database';
import { RootStackParamList, Workout } from '../types';
import { getActiveSession } from './WorkoutExecutionScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      setWorkouts(getWorkouts());
      setActiveSessionId(getActiveSession()?.workoutId ?? null);
    }, [])
  );

  function handlePress(item: Workout) {
    const session = getActiveSession();
    if (session && session.workoutId !== item.id) {
      Alert.alert(
        'Treino em andamento',
        `"${session.workoutName}" está em andamento. Finalize-o antes de iniciar outro.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Retomar treino',
            onPress: () => navigation.navigate('WorkoutExecution', {
              workoutId: session.workoutId,
              workoutName: session.workoutName,
            }),
          },
        ]
      );
      return;
    }
    navigation.navigate('WorkoutExecution', { workoutId: item.id, workoutName: item.name });
  }

  function handleDelete(workout: Workout) {
    Alert.alert('Excluir treino', `Excluir "${workout.name}" e todos os exercícios?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteWorkout(workout.id);
          setWorkouts(getWorkouts());
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum treino cadastrado</Text>
            <Text style={styles.emptyHint}>Toque em + para criar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.id === activeSessionId && styles.cardActive]}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardNameRow}>
                <Text style={styles.cardName}>Treino {item.name}</Text>
                {item.id === activeSessionId && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Em andamento</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardHint}>
                {item.id === activeSessionId ? 'Toque para continuar' : 'Toque para executar'}
              </Text>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('WorkoutForm', { workout: item })}
              >
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WorkoutForm', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: { borderWidth: 2, borderColor: '#16A34A' },
  cardMain: { flex: 1, padding: 16 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  activeBadge: { backgroundColor: '#DCFCE7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  cardActions: { flexDirection: 'row', paddingRight: 8 },
  editBtn: { padding: 10 },
  editBtnText: { fontSize: 18 },
  deleteBtn: { padding: 10 },
  deleteBtnText: { fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#6B7280' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
