import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { RootStackParamList, TabParamList } from '../types';
import CalendarScreen from '../screens/CalendarScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import StatsScreen from '../screens/StatsScreen';
import WorkoutExecutionScreen from '../screens/WorkoutExecutionScreen';
import WorkoutFormScreen from '../screens/WorkoutFormScreen';
import ExerciseFormScreen from '../screens/ExerciseFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{
          title: 'Calendário',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Treinos"
        component={WorkoutsScreen}
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💪</Text>,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Check-ins',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          statusBarColor: '#2563EB',
          statusBarStyle: 'light',
          statusBarTranslucent: false,
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false, statusBarStyle: 'dark', statusBarColor: '#ffffff' }}
        />
        <Stack.Screen
          name="WorkoutExecution"
          component={WorkoutExecutionScreen}
          options={({ route }) => ({ title: route.params.workoutName })}
        />
        <Stack.Screen
          name="WorkoutForm"
          component={WorkoutFormScreen}
          options={({ route }) => ({ title: route.params.workout ? 'Editar Treino' : 'Novo Treino' })}
        />
        <Stack.Screen
          name="ExerciseForm"
          component={ExerciseFormScreen}
          options={({ route }) => ({ title: route.params.exercise ? 'Editar Exercício' : 'Novo Exercício' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
