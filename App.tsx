import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupDatabase, seedWorkouts } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    setupDatabase();
    seedWorkouts();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
