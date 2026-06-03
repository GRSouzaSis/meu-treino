import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getExercises, insertWorkoutLog, insertSetLog } from '../services/database';
import { Exercise, RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'WorkoutExecution'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SetState {
  done: boolean;
  reps: number;
  weight: number;
}

export default function WorkoutExecutionScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { workoutId, workoutName } = route.params;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [setStates, setSetStates] = useState<Record<string, SetState>>({});

  // Timer de descanso
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const exs = getExercises(workoutId);
    setExercises(exs);

    const initial: Record<string, SetState> = {};
    exs.forEach(ex => {
      for (let s = 1; s <= ex.sets; s++) {
        initial[`${ex.id}-${s}`] = { done: false, reps: ex.reps, weight: ex.weight };
      }
    });
    setSetStates(initial);
  }, [workoutId]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(seconds);
    setTimerActive(true);
  }

  function toggleSet(exerciseId: number, setNumber: number) {
    const key = `${exerciseId}-${setNumber}`;
    const current = setStates[key];
    const nowDone = !current.done;
    setSetStates(prev => ({ ...prev, [key]: { ...current, done: nowDone } }));
    if (nowDone) startTimer(60);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function handleFinish() {
    const today = new Date().toISOString().split('T')[0];
    const logId = insertWorkoutLog(workoutId, workoutName, today);

    exercises.forEach(ex => {
      for (let s = 1; s <= ex.sets; s++) {
        const state = setStates[`${ex.id}-${s}`];
        if (state?.done) {
          insertSetLog(logId, ex.id, ex.name, s, state.reps, state.weight);
        }
      }
    });

    Alert.alert('Treino finalizado!', `Treino ${workoutName} salvo com sucesso.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  const totalSets = Object.values(setStates).length;
  const doneSets = Object.values(setStates).filter(s => s.done).length;

  return (
    <View style={styles.container}>
      {/* Timer banner */}
      {timerActive && (
        <TouchableOpacity style={styles.timerBanner} onPress={() => setTimerActive(false)}>
          <Text style={styles.timerLabel}>Descanso</Text>
          <Text style={styles.timerValue}>{formatTime(timerSeconds)}</Text>
          <Text style={styles.timerHint}>Toque para cancelar</Text>
        </TouchableOpacity>
      )}

      {/* Presets de descanso */}
      <View style={styles.timerPresets}>
        {[30, 60, 90, 120].map(s => (
          <TouchableOpacity key={s} style={styles.presetBtn} onPress={() => startTimer(s)}>
            <Text style={styles.presetText}>{s}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progresso */}
      <Text style={styles.progress}>{doneSets}/{totalSets} séries concluídas</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {exercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.setsRow}>
              {Array.from({ length: exercise.sets }, (_, i) => i + 1).map(setNum => {
                const key = `${exercise.id}-${setNum}`;
                const state = setStates[key];
                return (
                  <TouchableOpacity
                    key={setNum}
                    style={[styles.setBtn, state?.done && styles.setBtnDone]}
                    onPress={() => toggleSet(exercise.id, setNum)}
                  >
                    <Text style={[styles.setBtnLabel, state?.done && styles.setBtnLabelDone]}>
                      {setNum}
                    </Text>
                    <Text style={[styles.setBtnDetail, state?.done && styles.setBtnLabelDone]}>
                      {state?.reps}x {state?.weight}kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
        <Text style={styles.finishBtnText}>Finalizar treino</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  timerBanner: {
    backgroundColor: '#1D4ED8',
    padding: 16,
    alignItems: 'center',
  },
  timerLabel: { color: '#BFDBFE', fontSize: 12, fontWeight: '600' },
  timerValue: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: 2 },
  timerHint: { color: '#BFDBFE', fontSize: 11, marginTop: 2 },
  timerPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  presetBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetText: { color: '#2563EB', fontWeight: '600' },
  progress: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 10,
  },
  list: { padding: 16, paddingBottom: 100 },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  setBtn: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 64,
  },
  setBtnDone: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  setBtnLabel: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  setBtnLabelDone: { color: '#2563EB' },
  setBtnDetail: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  finishBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
  },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
