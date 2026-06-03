import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration, Modal } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getExercises, insertWorkoutLog, insertSetLog, getExerciseSets, upsertExerciseSet } from '../services/database';
import { Exercise, RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'WorkoutExecution'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SetState {
  done: boolean;
  reps: number;
  weight: number;
}

interface EditingSet {
  key: string;
  exerciseName: string;
  setNumber: number;
}

interface WorkoutSession {
  workoutId: number;
  startedAt: number;
  setStates: Record<string, SetState>;
}

let activeSession: WorkoutSession | null = null;

export default function WorkoutExecutionScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { workoutId, workoutName } = route.params;

  const isRestoredSession = activeSession?.workoutId === workoutId;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [setStates, setSetStates] = useState<Record<string, SetState>>(
    isRestoredSession ? activeSession!.setStates : {}
  );
  const [started, setStarted] = useState(isRestoredSession);

  const [defaultTimer, setDefaultTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotal, setTimerTotal] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerFinishedNaturally = useRef(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    isRestoredSession
      ? Math.floor((Date.now() - activeSession!.startedAt) / 1000)
      : 0
  );

  const [editingSet, setEditingSet] = useState<EditingSet | null>(null);
  const [editReps, setEditReps] = useState(0);
  const [editWeight, setEditWeight] = useState(0);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [started]);

  useEffect(() => {
    const exs = getExercises(workoutId);
    setExercises(exs);
    if (isRestoredSession) return;
    const initial: Record<string, SetState> = {};
    exs.forEach(ex => {
      const perSet = getExerciseSets(ex.id);
      const setMap: Record<number, { reps: number; weight: number }> = {};
      perSet.forEach(s => { setMap[s.set_number] = { reps: s.reps, weight: s.weight }; });
      for (let s = 1; s <= ex.sets; s++) {
        const override = setMap[s];
        initial[`${ex.id}-${s}`] = {
          done: false,
          reps: override ? override.reps : ex.reps,
          weight: override ? override.weight : ex.weight,
        };
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
            timerFinishedNaturally.current = true;
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timerFinishedNaturally.current) {
        timerFinishedNaturally.current = false;
        Vibration.vibrate([0, 300, 150, 300, 150, 300]);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  function handleStart() {
    activeSession = { workoutId, startedAt: Date.now(), setStates };
    setStarted(true);
    Vibration.vibrate(60);
  }

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerFinishedNaturally.current = false;
    setTimerTotal(seconds);
    setTimerSeconds(seconds);
    setTimerActive(true);
  }

  function cancelTimer() {
    timerFinishedNaturally.current = false;
    setTimerActive(false);
  }

  function updateSetStates(updater: (prev: Record<string, SetState>) => Record<string, SetState>) {
    setSetStates(prev => {
      const next = updater(prev);
      if (activeSession?.workoutId === workoutId) activeSession.setStates = next;
      return next;
    });
  }

  function toggleSet(exerciseId: number, setNumber: number) {
    const key = `${exerciseId}-${setNumber}`;
    const current = setStates[key];
    const nowDone = !current.done;
    updateSetStates(prev => ({ ...prev, [key]: { ...current, done: nowDone } }));
    if (nowDone) {
      Vibration.vibrate(40);
      startTimer(defaultTimer);
    }
  }

  function openEditSet(exercise: Exercise, setNumber: number) {
    const key = `${exercise.id}-${setNumber}`;
    const state = setStates[key];
    Vibration.vibrate(80);
    setEditingSet({ key, exerciseName: exercise.name, setNumber });
    setEditReps(state.reps);
    setEditWeight(state.weight);
  }

  function confirmEditSet() {
    if (!editingSet) return;
    updateSetStates(prev => ({
      ...prev,
      [editingSet.key]: { ...prev[editingSet.key], reps: editReps, weight: editWeight },
    }));
    const [exIdStr, setNumStr] = editingSet.key.split('-');
    upsertExerciseSet(parseInt(exIdStr, 10), parseInt(setNumStr, 10), editReps, editWeight);
    setEditingSet(null);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function handleFinish() {
    const today = new Date().toISOString().split('T')[0];
    const logId = insertWorkoutLog(workoutId, workoutName, today, elapsedSeconds);
    exercises.forEach(ex => {
      for (let s = 1; s <= ex.sets; s++) {
        const state = setStates[`${ex.id}-${s}`];
        if (state?.done) insertSetLog(logId, ex.id, ex.name, s, state.reps, state.weight);
      }
    });
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const durationLabel = mins > 0
      ? `${mins}min${secs > 0 ? ` ${secs}s` : ''}`
      : `${secs}s`;
    activeSession = null;
    Alert.alert('Treino finalizado! 🎉', `${workoutName} concluído em ${durationLabel}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  const totalSets = Object.values(setStates).length;
  const doneSets = Object.values(setStates).filter(s => s.done).length;
  const progress = totalSets > 0 ? doneSets / totalSets : 0;
  const allDone = doneSets === totalSets && totalSets > 0;
  const canFinish = progress >= 0.8;

  return (
    <View style={styles.container}>
      {/* Barra de progresso */}
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {started ? `${doneSets}/${totalSets} séries concluídas` : workoutName}
          </Text>
          <Text style={styles.progressPct}>
            {started ? formatTime(elapsedSeconds) : `${totalSets} séries`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>

      {/* Timer pill — só visível durante o treino */}
      {started && (
        <>
          <View style={[styles.timerCard, timerActive && styles.timerCardActive]}>
            <View style={styles.timerLeft}>
              <Text style={[styles.timerLabel, timerActive && styles.timerLabelActive]}>
                {timerActive ? 'Descanso' : 'Padrão'}
              </Text>
              <Text style={[styles.timerValue, !timerActive && styles.timerValueInactive]}>
                {timerActive ? formatTime(timerSeconds) : formatTime(defaultTimer)}
              </Text>
            </View>
            <View style={styles.timerPresets}>
              {[30, 60, 90, 120].map(s => {
                const isActive = timerActive ? timerTotal === s : defaultTimer === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.presetBtn, isActive && styles.presetBtnActive]}
                    onPress={() => timerActive ? startTimer(s) : setDefaultTimer(s)}
                  >
                    <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                      {s}s
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {timerActive && (
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelTimer}>
                  <Text style={styles.cancelBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {timerActive && (
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, { width: `${(timerSeconds / timerTotal) * 100}%` as any }]} />
            </View>
          )}
        </>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {exercises.map(exercise => {
          const exDone = Array.from({ length: exercise.sets }, (_, i) => i + 1)
            .filter(s => setStates[`${exercise.id}-${s}`]?.done).length;

          return (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={[styles.exerciseCount, exDone === exercise.sets && styles.exerciseCountDone]}>
                  {started ? `${exDone}/${exercise.sets} séries` : `${exercise.sets} séries`}
                </Text>
              </View>
              <View style={styles.setsRow}>
                {Array.from({ length: exercise.sets }, (_, i) => i + 1).map(setNum => {
                  const key = `${exercise.id}-${setNum}`;
                  const state = setStates[key];
                  const done = state?.done;
                  return (
                    <TouchableOpacity
                      key={setNum}
                      style={[styles.setBtn, done && styles.setBtnDone, !started && styles.setBtnLocked]}
                      onPress={() => started && toggleSet(exercise.id, setNum)}
                      onLongPress={() => started && openEditSet(exercise, setNum)}
                      delayLongPress={400}
                      activeOpacity={started ? 0.7 : 1}
                    >
                      <Text style={[styles.setBtnLabel, done && styles.setBtnLabelDone, !started && styles.setBtnLabelLocked]}>
                        {done ? '✓' : setNum}
                      </Text>
                      <Text style={[styles.setBtnDetail, done && styles.setBtnDetailDone]}>
                        {state?.reps}x {state?.weight}kg
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {started && <Text style={styles.longPressHint}>Segure uma série para editar</Text>}
            </View>
          );
        })}
      </ScrollView>

      {/* Botão principal: iniciar ou finalizar */}
      {!started ? (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>▶  Iniciar treino</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.finishBtn,
            !canFinish && styles.finishBtnDisabled,
            allDone && styles.finishBtnAll,
          ]}
          onPress={canFinish ? handleFinish : undefined}
          activeOpacity={canFinish ? 0.8 : 1}
        >
          <Text style={[styles.finishBtnText, !canFinish && styles.finishBtnTextDisabled]}>
            {allDone
              ? '🎉 Finalizar treino'
              : canFinish
              ? `Finalizar (${doneSets}/${totalSets} séries)`
              : `${Math.round(progress * 100)}% — complete 80% para finalizar`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal de edição de série */}
      <Modal visible={editingSet !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingSet?.exerciseName}</Text>
            <Text style={styles.modalSubtitle}>Série {editingSet?.setNumber}</Text>

            <View style={styles.stepperBlock}>
              <Text style={styles.stepperLabel}>Repetições</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditReps(r => Math.max(1, r - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editReps}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditReps(r => r + 1)}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepperBlock}>
              <Text style={styles.stepperLabel}>Carga (kg)</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditWeight(w => Math.max(0, +(w - 2.5).toFixed(1)))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editWeight} kg</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditWeight(w => +(w + 2.5).toFixed(1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingSet(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmEditSet}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  progressHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  progressTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },

  timerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  timerCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  timerLeft: { minWidth: 80 },
  timerLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  timerLabelActive: { color: '#2563EB' },
  timerValue: { fontSize: 26, fontWeight: '800', color: '#1D4ED8', letterSpacing: 1 },
  timerValueInactive: { fontSize: 22, color: '#9CA3AF' },
  timerPresets: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  presetBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  presetBtnActive: { backgroundColor: '#2563EB' },
  presetText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  presetTextActive: { color: '#fff' },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center' },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '700' },
  timerTrack: {
    height: 3,
    backgroundColor: '#DBEAFE',
    marginHorizontal: 16,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  timerFill: { height: 3, backgroundColor: '#2563EB', borderRadius: 2 },

  list: { padding: 16, paddingBottom: 100 },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  exerciseCount: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  exerciseCountDone: { color: '#16A34A' },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  setBtn: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 64,
  },
  setBtnDone: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  setBtnLocked: { opacity: 0.5 },
  setBtnLabel: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  setBtnLabelDone: { color: '#fff' },
  setBtnLabelLocked: { color: '#9CA3AF' },
  setBtnDetail: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  setBtnDetailDone: { color: '#BFDBFE' },
  longPressHint: { fontSize: 11, color: '#D1D5DB', marginTop: 10, textAlign: 'right' },

  startBtn: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },

  finishBtn: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  finishBtnDisabled: { backgroundColor: '#E5E7EB', elevation: 0, shadowOpacity: 0 },
  finishBtnAll: { backgroundColor: '#15803D' },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  finishBtnTextDisabled: { color: '#9CA3AF' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 2, marginBottom: 20 },
  stepperBlock: { marginBottom: 16 },
  stepperLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#E5E7EB',
  },
  stepperBtnText: { fontSize: 20, fontWeight: '700', color: '#374151' },
  stepperValue: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalConfirmText: { fontWeight: '700', color: '#fff' },
});
