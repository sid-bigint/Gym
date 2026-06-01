import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { FitnessWidget } from './FitnessWidget';

// For the widget, we cannot easily use Zustand hooks because it runs in a headless JS task.
// We should ideally read from AsyncStorage where our WidgetSyncService writes the data.
// For now, we will mock the initial render and setup the sync structure.

export async function widgetTaskHandler({ widgetAction, widgetInfo, renderWidget }: WidgetTaskHandlerProps) {
  // TODO: Read this from AsyncStorage / Shared Preferences populated by the app.
  const calories = 1450;
  const protein = 125;
  const carbs = 110;
  const fats = 55;

  renderWidget(<FitnessWidget calories={calories} protein={protein} carbs={carbs} fats={fats} />);
}
