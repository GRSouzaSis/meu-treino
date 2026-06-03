import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { insertExercise, updateExercise } from '../services/database';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ExerciseForm'>;

export default function ExerciseFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { workoutId, exercise } = route.params;

  const [name, setName] = useState(exercise?.name ?? '');
  const [sets, setSets] = useState(String(exercise?.sets ?? 3));
  const [reps, setReps] = useState(String(exercise?.reps ?? 12));
  const [weight, setWeight] = useState(String(exercise?.weight ?? 0));

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Informe o nome do exercício');
      return;
    }
    const s = parseInt(sets) || 3;
    const r = parseInt(reps) || 12;
    const w = parseFloat(weight) || 0;

    if (exercise) {
      updateExercise(exercise.id, name.trim(), s, r, w);
    } else {
      insertExercise(workoutId, name.trim(), s, r, w);
    }
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome do exercício</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Supino reto, Agachamento..."
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Séries</Text>
          <TextInput
            style={styles.input}
            value={sets}
            onChangeText={setSets}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Repetições</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Carga (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Salvar exercício</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
