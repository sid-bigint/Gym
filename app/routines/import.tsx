import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/store/useTheme';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { parseRoutineCSV, parseRoutineTextBulk, ParsedExercise } from '../../src/utils/csvParser';

export default function ImportRoutineScreen() {
  const { colors } = useTheme();
  const [routineName, setRoutineName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addExercise = useWorkoutStore(s => s.addExercise);
  const createRoutine = useWorkoutStore(s => s.createRoutine);
  const existingExercises = useWorkoutStore(s => s.exercises);

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsProcessing(true);
      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const text = await response.text();

      const parsed = await parseRoutineCSV(text);
      if (parsed.length === 0) {
        Alert.alert('Error', 'No exercises found in CSV. Make sure it has an Exercise column.');
      } else {
        setParsedExercises(parsed);
        if (!routineName) {
          setRoutineName(result.assets[0].name.replace('.csv', ''));
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Parse Error', 'Failed to read the CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = () => {
    if (!bulkText.trim()) return;
    const parsed = parseRoutineTextBulk(bulkText);
    if (parsed.length === 0) {
      Alert.alert('Error', 'Could not extract any exercises. Format example: Bench Press 3x10');
    } else {
      setParsedExercises(parsed);
    }
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Missing Name', 'Please give your routine a name.');
      return;
    }

    if (parsedExercises.length === 0) {
      Alert.alert('Empty', 'No exercises found to import.');
      return;
    }

    setIsProcessing(true);

    try {
      const routineDataToSave: { exerciseId: number; sets: number; reps: number }[] = [];

      for (const item of parsedExercises) {
        // Find existing exercise (case insensitive)
        let ex = existingExercises.find(e => e.name.toLowerCase() === item.name.toLowerCase());
        
        // If not found, create a new custom exercise on the fly
        if (!ex) {
          ex = await addExercise({
            name: item.name,
            muscleGroup: 'Other',
            type: 'Gym',
          });
        }

        routineDataToSave.push({
          exerciseId: ex.id,
          sets: item.targetSets,
          reps: item.targetReps,
        });
      }

      await createRoutine(routineName, routineDataToSave);
      Alert.alert('Success!', `Routine '${routineName}' created with ${routineDataToSave.length} exercises.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save routine to database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateContent = `Exercise Name,Sets,Reps\nBench Press,3,10\nIncline Dumbbell Press,3,12\nChest Flyes,4,15\nOverhead Tricep Extension,3,12\nTricep Pushdowns,3,15`;
      const fileUri = FileSystem.documentDirectory + 'Routine_Template.csv';
      
      await FileSystem.writeAsStringAsync(fileUri, templateContent, {
        encoding: 'utf8',
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Download Routine Template',
        UTI: 'public.comma-separated-values-text'
      });
    } catch (e) {
      console.error('Error generating template:', e);
      Alert.alert('Error', 'Failed to generate template file.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Import Routine</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Routine Name</Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary, borderColor: colors.border.primary }]}
            placeholder="e.g. Push Day Heavy"
            placeholderTextColor={colors.text.disabled}
            value={routineName}
            onChangeText={setRoutineName}
          />
        </View>

        {parsedExercises.length === 0 ? (
          <>
            <TouchableOpacity 
              style={[styles.uploadBox, { borderColor: colors.accent.primary, backgroundColor: colors.accent.primary + '10' }]}
              onPress={handlePickCSV}
            >
              <Ionicons name="document-text-outline" size={48} color={colors.accent.primary} />
              <Text style={[styles.uploadTitle, { color: colors.accent.primary }]}>Upload CSV File</Text>
              <Text style={[styles.uploadSub, { color: colors.text.tertiary }]}>Format: Exercise, Sets, Reps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.downloadBtn, { backgroundColor: colors.background.secondary }]}
              onPress={handleDownloadTemplate}
            >
              <Ionicons name="download-outline" size={20} color={colors.accent.secondary} />
              <Text style={{ color: colors.text.primary, fontWeight: 'bold', marginLeft: 8 }}>Download CSV Template</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border.secondary }]} />
              <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>OR PASTE TEXT</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border.secondary }]} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.background.card }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text.primary, borderColor: colors.border.primary }]}
                placeholder="Bench Press 3x10&#10;Squats 4 sets 8 reps"
                placeholderTextColor={colors.text.disabled}
                multiline
                numberOfLines={6}
                value={bulkText}
                onChangeText={setBulkText}
                textAlignVertical="top"
              />
              <TouchableOpacity style={[styles.parseBtn, { backgroundColor: colors.background.secondary }]} onPress={handleParseText}>
                <Text style={{ color: colors.text.primary, fontWeight: 'bold' }}>Parse Text</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={[styles.previewCard, { backgroundColor: colors.background.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text.primary }]}>Preview ({parsedExercises.length} exercises)</Text>
              <TouchableOpacity onPress={() => setParsedExercises([])}>
                <Text style={{ color: colors.accent.secondary }}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            {parsedExercises.map((ex, idx) => (
              <View key={idx} style={[styles.previewRow, { borderBottomColor: colors.border.secondary }]}>
                <Text style={[styles.previewExName, { color: colors.text.primary }]}>{ex.name}</Text>
                <Text style={[styles.previewExTarget, { color: colors.text.tertiary }]}>{ex.targetSets} × {ex.targetReps}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {parsedExercises.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background.secondary, borderTopColor: colors.border.secondary }]}>
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: colors.accent.primary }]}
            onPress={handleSaveRoutine}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Routine</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16, marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  uploadSub: { fontSize: 14, marginTop: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 12, fontWeight: 'bold' },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 120 },
  parseBtn: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center' },
  previewCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  previewTitle: { fontSize: 16, fontWeight: 'bold' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  previewExName: { fontSize: 16, fontWeight: '500' },
  previewExTarget: { fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  saveBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
