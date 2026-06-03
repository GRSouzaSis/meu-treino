import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { insertWorkout, updateWorkout, getExercises, deleteExercise } from '../services/database';
import { RootStackParamList, Exercise } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'WorkoutForm'>;

export default function WorkoutFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.workout;

  const [name, setName] = useState(existing?.name ?? '');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutId, setWorkoutId] = useState<number | null>(existing?.id ?? null);

  useFocusEffect(
    useCallback(() => {
      if (workoutId) setExercises(getExercises(workoutId));
    }, [workoutId])
  );

  function handleSaveName() {
    if (!name.trim()) {
      Alert.alert('Informe o nome do treino');
      return;
    }
    if (workoutId) {
      updateWorkout(workoutId, name.trim());
    } else {
      const id = insertWorkout(name.trim());
      setWorkoutId(id);
    }
  }

  function handleDeleteExercise(exercise: Exercise) {
    Alert.alert('Excluir exercício', `Excluir "${exercise.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteExercise(exercise.id);
          setExercises(getExercises(workoutId!));
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Nome do treino (ex: A, Push...)"
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
          <Text style={styles.saveBtnText}>{workoutId ? 'Salvo ✓' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      {workoutId && (
        <>
          <Text style={styles.sectionTitle}>Exercícios</Text>
          <FlatList
            data={exercises}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum exercício ainda</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.exerciseCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseDetail}>{item.sets}x{item.reps} — {item.weight}kg</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ExerciseForm', { workoutId: workoutId!, exercise: item })}
                >
                  <Text style={{ fontSize: 18, padding: 8 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteExercise(item)}>
                  <Text style={{ fontSize: 18, padding: 8 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => navigation.navigate('ExerciseForm', { workoutId: workoutId! })}
          >
            <Text style={styles.addExerciseBtnText}>+ Adicionar exercício</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  nameInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  list: { paddingBottom: 16 },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  exerciseDetail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
  addExerciseBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    margin: 16,
    marginBottom: 50,
  },
  addExerciseBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
