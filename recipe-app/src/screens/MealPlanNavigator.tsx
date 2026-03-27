import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyMealPlansScreen from './MyMealPlansScreen';
import MyMealPlanEditScreen from './MyMealPlanEditScreen';
import MealPlanCreateScreen from './MealPlanCreateScreen';

export type MealPlanStackParamList = {
  MealPlanList: undefined;
  MealPlanCreate: undefined;
  MealPlanEdit: { planId: string };
};

const Stack = createNativeStackNavigator<MealPlanStackParamList>();

export default function MealPlanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealPlanList" component={MyMealPlansScreen} />
      <Stack.Screen name="MealPlanCreate" component={MealPlanCreateScreen} />
      <Stack.Screen name="MealPlanEdit" component={MyMealPlanEditScreen} />
    </Stack.Navigator>
  );
}
