import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FavoritesProvider, useFavorites } from './src/hooks/useFavorites';
import { SettingsProvider } from './src/hooks/useSettings';
import { MealPlansProvider } from './src/hooks/useMealPlans';
import HomeScreen from './src/screens/HomeScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CoopNavigator from './src/screens/CoopNavigator';
import MealPlanNavigator from './src/screens/MealPlanNavigator';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { favorites } = useFavorites();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'MealPlan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Coop') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E65100',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen
        name="MealPlan"
        component={MealPlanNavigator}
        options={{ title: '献立' }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'レシピ検索' }}
      />
      <Tab.Screen
        name="Coop"
        component={CoopNavigator}
        options={{ title: 'COOP' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'お気に入り',
          tabBarBadge: favorites.length > 0 ? favorites.length : undefined,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '設定' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'NotoSansJP-Regular': require('./assets/fonts/NotoSansJP-Regular.ttf'),
    'NotoSerifJP-Bold': require('./assets/fonts/NotoSerifJP-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SettingsProvider>
      <FavoritesProvider>
        <MealPlansProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <TabNavigator />
        </NavigationContainer>
        </MealPlansProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
