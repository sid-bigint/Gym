import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function FitnessWidget({ calories, protein, carbs, fats }: any) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
      }}
    >
      <TextWidget
        text="TODAY'S MACROS"
        style={{ fontSize: 12, color: '#38BDF8', fontWeight: 'bold' }}
      />
      
      <FlexWidget style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <TextWidget text={`${calories}`} style={{ fontSize: 28, color: '#FFFFFF', fontWeight: 'bold' }} />
          <TextWidget text="kcal eaten" style={{ fontSize: 12, color: '#94A3B8' }} />
        </FlexWidget>

        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget text={`P: ${protein}g`} style={{ fontSize: 12, color: '#22C55E', fontWeight: 'bold' }} />
          <TextWidget text={`C: ${carbs}g`} style={{ fontSize: 12, color: '#3B82F6', fontWeight: 'bold' }} />
          <TextWidget text={`F: ${fats}g`} style={{ fontSize: 12, color: '#F59E0B', fontWeight: 'bold' }} />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          marginTop: 16,
          backgroundColor: '#38BDF8',
          borderRadius: 12,
          padding: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'gymapp://nutrition/add' }}
      >
        <TextWidget text="+ LOG MEAL" style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
