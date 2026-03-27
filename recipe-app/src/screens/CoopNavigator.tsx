import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoopIngredientsScreen from './CoopIngredientsScreen';

export type CoopStackParamList = {
  CoopIngredients: undefined;
};

const Stack = createNativeStackNavigator<CoopStackParamList>();

export default function CoopNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoopIngredients" component={CoopIngredientsScreen} />
    </Stack.Navigator>
  );
}
