import * as SQLite from 'expo-sqlite';
import { Exercise, SetLog, Workout, WorkoutLog } from '../types';

const db = SQLite.openDatabaseSync('meu-treino.db');

export function setupDatabase() {
  db.execSync(`PRAGMA foreign_keys = ON;`);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL DEFAULT 3,
      reps INTEGER NOT NULL DEFAULT 12,
      weight REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      workout_name TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS set_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps_done INTEGER NOT NULL,
      weight_used REAL NOT NULL,
      FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
    );
  `);
}

export function seedWorkouts() {
  const existing = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM workouts');
  if (existing && existing.count > 0) return;

  const workouts: { name: string; exercises: { name: string; sets: number; reps: number; weight: number }[] }[] = [
    {
      name: 'A',
      exercises: [
        { name: 'Supino Reto', sets: 4, reps: 10, weight: 40 },
        { name: 'Supino Inclinado', sets: 3, reps: 12, weight: 35 },
        { name: 'Crucifixo', sets: 3, reps: 12, weight: 15 },
        { name: 'Tríceps Pulley', sets: 3, reps: 12, weight: 25 },
        { name: 'Tríceps Testa', sets: 3, reps: 12, weight: 20 },
      ],
    },
    {
      name: 'B',
      exercises: [
        { name: 'Puxada Frontal', sets: 4, reps: 10, weight: 50 },
        { name: 'Remada Curvada', sets: 4, reps: 10, weight: 50 },
        { name: 'Remada Unilateral', sets: 3, reps: 12, weight: 20 },
        { name: 'Rosca Direta', sets: 3, reps: 12, weight: 25 },
        { name: 'Rosca Martelo', sets: 3, reps: 12, weight: 12.5 },
      ],
    },
    {
      name: 'C',
      exercises: [
        { name: 'Agachamento', sets: 4, reps: 10, weight: 60 },
        { name: 'Leg Press', sets: 4, reps: 12, weight: 100 },
        { name: 'Extensora', sets: 3, reps: 15, weight: 40 },
        { name: 'Flexora', sets: 3, reps: 15, weight: 35 },
        { name: 'Desenvolvimento', sets: 3, reps: 10, weight: 30 },
        { name: 'Elevação Lateral', sets: 3, reps: 15, weight: 10 },
      ],
    },
  ];

  workouts.forEach(({ name, exercises }) => {
    const { lastInsertRowId } = db.runSync('INSERT INTO workouts (name) VALUES (?)', name);
    exercises.forEach(e => {
      db.runSync(
        'INSERT INTO exercises (workout_id, name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
        lastInsertRowId, e.name, e.sets, e.reps, e.weight
      );
    });
  });
}

// Workouts
export function getWorkouts(): Workout[] {
  return db.getAllSync('SELECT * FROM workouts ORDER BY name');
}

export function insertWorkout(name: string): number {
  const result = db.runSync('INSERT INTO workouts (name) VALUES (?)', name);
  return result.lastInsertRowId;
}

export function updateWorkout(id: number, name: string) {
  db.runSync('UPDATE workouts SET name = ? WHERE id = ?', name, id);
}

export function deleteWorkout(id: number) {
  db.runSync('DELETE FROM workouts WHERE id = ?', id);
}

// Exercises
export function getExercises(workoutId: number): Exercise[] {
  return db.getAllSync('SELECT * FROM exercises WHERE workout_id = ? ORDER BY id', workoutId);
}

export function insertExercise(workoutId: number, name: string, sets: number, reps: number, weight: number): number {
  const result = db.runSync(
    'INSERT INTO exercises (workout_id, name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
    workoutId, name, sets, reps, weight
  );
  return result.lastInsertRowId;
}

export function updateExercise(id: number, name: string, sets: number, reps: number, weight: number) {
  db.runSync(
    'UPDATE exercises SET name = ?, sets = ?, reps = ?, weight = ? WHERE id = ?',
    name, sets, reps, weight, id
  );
}

export function deleteExercise(id: number) {
  db.runSync('DELETE FROM exercises WHERE id = ?', id);
}

// Workout Logs
export function getWorkoutLogs(): WorkoutLog[] {
  return db.getAllSync('SELECT * FROM workout_logs ORDER BY date DESC');
}

export function deleteWorkoutLog(id: number) {
  db.runSync('DELETE FROM workout_logs WHERE id = ?', id);
}

export function insertWorkoutLog(workoutId: number, workoutName: string, date: string): number {
  const result = db.runSync(
    'INSERT INTO workout_logs (workout_id, workout_name, date) VALUES (?, ?, ?)',
    workoutId, workoutName, date
  );
  return result.lastInsertRowId;
}

// Set Logs
export function insertSetLog(workoutLogId: number, exerciseId: number, exerciseName: string, setNumber: number, repsDone: number, weightUsed: number) {
  db.runSync(
    'INSERT INTO set_logs (workout_log_id, exercise_id, exercise_name, set_number, reps_done, weight_used) VALUES (?, ?, ?, ?, ?, ?)',
    workoutLogId, exerciseId, exerciseName, setNumber, repsDone, weightUsed
  );
}

export function getSetLogs(workoutLogId: number): SetLog[] {
  return db.getAllSync('SELECT * FROM set_logs WHERE workout_log_id = ? ORDER BY exercise_id, set_number', workoutLogId);
}

// Stats
export function getCheckInsByYear(): { year: string; count: number }[] {
  return db.getAllSync(
    `SELECT strftime('%Y', date) AS year, COUNT(*) AS count
     FROM workout_logs GROUP BY year ORDER BY year DESC`
  );
}

export function getCheckInsByMonth(year: string): { month: string; count: number }[] {
  return db.getAllSync(
    `SELECT strftime('%m', date) AS month, COUNT(*) AS count
     FROM workout_logs WHERE strftime('%Y', date) = ?
     GROUP BY month ORDER BY month ASC`,
    year
  );
}
