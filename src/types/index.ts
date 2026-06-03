export interface Workout {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  workout_id: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutLog {
  id: number;
  workout_id: number;
  workout_name: string;
  date: string; // YYYY-MM-DD
}

export interface SetLog {
  id: number;
  workout_log_id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  reps_done: number;
  weight_used: number;
}

export type RootStackParamList = {
  Tabs: undefined;
  WorkoutExecution: { workoutId: number; workoutName: string };
  WorkoutForm: { workout?: Workout };
  ExerciseForm: { workoutId: number; exercise?: Exercise };
};

export type TabParamList = {
  Calendario: undefined;
  Treinos: undefined;
  Stats: undefined;
};
