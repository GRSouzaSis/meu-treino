import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWorkouts, deleteWorkout } from '../services/database';
import { RootStackParamList, Workout } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWorkouts(getWorkouts());
    }, [])
  );

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
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => navigation.navigate('WorkoutExecution', { workoutId: item.id, workoutName: item.name })}
            >
              <Text style={styles.cardName}>Treino {item.name}</Text>
              <Text style={styles.cardHint}>Toque para executar</Text>
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
  cardMain: { flex: 1, padding: 16 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
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
