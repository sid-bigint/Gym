/**
 * AI Service - Claude API Integration for Smart Workout Generation
 * Phase 2: AI Intelligence Layer
 */

import Constants from 'expo-constants';

// Types for AI Workout Generation
export interface GenerateWorkoutParams {
    splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom';
    customSplit?: string;
    equipment: ('barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands')[];
    duration: 30 | 45 | 60 | 75 | 90; // minutes
    experience: 'beginner' | 'intermediate' | 'advanced';
    goal: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness';
    daysPerWeek: 3 | 4 | 5 | 6;
    focusAreas?: string[]; // e.g., ['chest', 'arms']
}

export interface GeneratedExercise {
    name: string;
    muscleGroup: string;
    sets: number;
    reps: string; // e.g., "8-12" or "15"
    restSeconds: number;
    notes?: string;
}

export interface GeneratedWorkout {
    name: string;
    dayNumber: number;
    focus: string;
    exercises: GeneratedExercise[];
    estimatedDuration: number;
}

export interface GeneratedProgram {
    name: string;
    description: string;
    daysPerWeek: number;
    workouts: GeneratedWorkout[];
}

// Get API key from environment or constants
const getApiKey = (): string | null => {
    // Check expo constants first
    const expoApiKey = Constants.expoConfig?.extra?.claudeApiKey;
    if (expoApiKey) return expoApiKey;

    // Could also check AsyncStorage for user-provided key
    return null;
};

/**
 * Generate a workout program using Claude API
 */
export async function generateWorkoutProgram(params: GenerateWorkoutParams): Promise<GeneratedProgram> {
    const apiKey = getApiKey();

    if (!apiKey) {
        // Return a fallback generated program if no API key
        return generateFallbackProgram(params);
    }

    const prompt = buildPrompt(params);

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            console.error('Claude API error:', response.status);
            return generateFallbackProgram(params);
        }

        const data = await response.json();
        const content = data.content?.[0]?.text;

        if (!content) {
            return generateFallbackProgram(params);
        }

        return parseAIResponse(content, params);
    } catch (error) {
        console.error('AI Service error:', error);
        return generateFallbackProgram(params);
    }
}

/**
 * Build the prompt for Claude
 */
function buildPrompt(params: GenerateWorkoutParams): string {
    const equipmentList = params.equipment.join(', ');
    const splitDescription = getSplitDescription(params.splitType, params.customSplit);
    const focusText = params.focusAreas?.length ? `Focus areas: ${params.focusAreas.join(', ')}` : '';

    return `You are a professional fitness coach. Generate a ${params.daysPerWeek}-day workout program.

REQUIREMENTS:
- Split Type: ${splitDescription}
- Available Equipment: ${equipmentList}
- Workout Duration: ${params.duration} minutes per session
- Experience Level: ${params.experience}
- Primary Goal: ${params.goal}
${focusText}

RULES:
1. Each workout should fit within ${params.duration} minutes
2. Only use exercises that can be performed with: ${equipmentList}
3. Include proper warm-up sets in the set counts
4. For ${params.experience} level, adjust volume and intensity appropriately
5. For ${params.goal} goal, use appropriate rep ranges and rest periods

Respond ONLY with valid JSON in this exact format:
{
  "name": "Program Name",
  "description": "Brief description",
  "daysPerWeek": ${params.daysPerWeek},
  "workouts": [
    {
      "name": "Day 1 - Push",
      "dayNumber": 1,
      "focus": "Chest, Shoulders, Triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "muscleGroup": "Chest",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Optional tip"
        }
      ],
      "estimatedDuration": 45
    }
  ]
}

Generate the complete program now:`;
}

function getSplitDescription(splitType: string, customSplit?: string): string {
    const splits: Record<string, string> = {
        push_pull_legs: 'Push/Pull/Legs - 3 distinct workouts rotating push muscles, pull muscles, and legs',
        upper_lower: 'Upper/Lower - Alternating between upper body and lower body days',
        full_body: 'Full Body - Each workout targets all major muscle groups',
        bro_split: 'Body Part Split - Each day focuses on 1-2 muscle groups',
        custom: customSplit || 'Custom split',
    };
    return splits[splitType] || splitType;
}

/**
 * Parse AI response into structured program
 */
function parseAIResponse(content: string, params: GenerateWorkoutParams): GeneratedProgram {
    try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]) as GeneratedProgram;

        // Validate structure
        if (!parsed.name || !parsed.workouts || !Array.isArray(parsed.workouts)) {
            throw new Error('Invalid program structure');
        }

        // Validate each workout
        parsed.workouts = parsed.workouts.map((workout, index) => ({
            name: workout.name || `Day ${index + 1}`,
            dayNumber: workout.dayNumber || index + 1,
            focus: workout.focus || 'General',
            exercises: (workout.exercises || []).map(ex => ({
                name: ex.name || 'Unknown Exercise',
                muscleGroup: ex.muscleGroup || 'General',
                sets: Number(ex.sets) || 3,
                reps: ex.reps || '10',
                restSeconds: Number(ex.restSeconds) || 60,
                notes: ex.notes,
            })),
            estimatedDuration: workout.estimatedDuration || params.duration,
        }));

        return parsed;
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        return generateFallbackProgram(params);
    }
}

/**
 * Generate a fallback program when API is unavailable
 */
function generateFallbackProgram(params: GenerateWorkoutParams): GeneratedProgram {
    const templates = getFallbackTemplates(params);

    return {
        name: `${params.experience.charAt(0).toUpperCase() + params.experience.slice(1)} ${getSplitName(params.splitType)} Program`,
        description: `A ${params.daysPerWeek}-day ${params.goal} focused program designed for ${params.experience} lifters.`,
        daysPerWeek: params.daysPerWeek,
        workouts: templates.slice(0, params.daysPerWeek),
    };
}

function getSplitName(splitType: string): string {
    const names: Record<string, string> = {
        push_pull_legs: 'Push/Pull/Legs',
        upper_lower: 'Upper/Lower',
        full_body: 'Full Body',
        bro_split: 'Body Part',
        custom: 'Custom',
    };
    return names[splitType] || 'Workout';
}

function getFallbackTemplates(params: GenerateWorkoutParams): GeneratedWorkout[] {
    const hasBarbell = params.equipment.includes('barbell');
    const hasDumbbell = params.equipment.includes('dumbbell');
    const hasCable = params.equipment.includes('cable');
    const hasMachine = params.equipment.includes('machine');
    const hasBodyweight = params.equipment.includes('bodyweight');

    // Adjust sets based on experience
    const baseSets = params.experience === 'beginner' ? 3 : params.experience === 'intermediate' ? 4 : 5;

    // Adjust reps based on goal
    const getReps = (): string => {
        switch (params.goal) {
            case 'strength': return '4-6';
            case 'hypertrophy': return '8-12';
            case 'endurance': return '15-20';
            default: return '10-12';
        }
    };

    const reps = getReps();
    const rest = params.goal === 'strength' ? 180 : params.goal === 'hypertrophy' ? 90 : 60;

    // Push exercises based on equipment
    const pushExercises: GeneratedExercise[] = [];
    if (hasBarbell) pushExercises.push({ name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: baseSets, reps, restSeconds: rest });
    if (hasDumbbell) pushExercises.push({ name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', sets: baseSets, reps, restSeconds: rest });
    if (hasCable) pushExercises.push({ name: 'Cable Flyes', muscleGroup: 'Chest', sets: baseSets - 1, reps: '12-15', restSeconds: 60 });
    if (hasMachine) pushExercises.push({ name: 'Chest Press Machine', muscleGroup: 'Chest', sets: baseSets, reps, restSeconds: rest });
    if (hasBodyweight) pushExercises.push({ name: 'Push-ups', muscleGroup: 'Chest', sets: 3, reps: '15-20', restSeconds: 45 });
    if (hasDumbbell) pushExercises.push({ name: 'Tricep Overhead Extension', muscleGroup: 'Triceps', sets: 3, reps: '10-12', restSeconds: 60 });

    // Pull exercises
    const pullExercises: GeneratedExercise[] = [];
    if (hasBarbell) pullExercises.push({ name: 'Barbell Rows', muscleGroup: 'Back', sets: baseSets, reps, restSeconds: rest });
    if (hasDumbbell) pullExercises.push({ name: 'Dumbbell Rows', muscleGroup: 'Back', sets: baseSets, reps, restSeconds: rest });
    if (hasCable) pullExercises.push({ name: 'Lat Pulldown', muscleGroup: 'Back', sets: baseSets, reps, restSeconds: rest });
    if (hasBodyweight) pullExercises.push({ name: 'Pull-ups', muscleGroup: 'Back', sets: 3, reps: '8-12', restSeconds: 90 });
    if (hasCable) pullExercises.push({ name: 'Face Pulls', muscleGroup: 'Rear Delts', sets: 3, reps: '15-20', restSeconds: 45 });
    if (hasDumbbell) pullExercises.push({ name: 'Bicep Curls', muscleGroup: 'Biceps', sets: 3, reps: '10-12', restSeconds: 60 });

    // Leg exercises
    const legExercises: GeneratedExercise[] = [];
    if (hasBarbell) legExercises.push({ name: 'Barbell Squat', muscleGroup: 'Legs', sets: baseSets, reps, restSeconds: rest + 30 });
    if (hasBarbell) legExercises.push({ name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', sets: baseSets, reps, restSeconds: rest });
    if (hasDumbbell) legExercises.push({ name: 'Dumbbell Lunges', muscleGroup: 'Legs', sets: 3, reps: '10-12 each', restSeconds: 60 });
    if (hasMachine) legExercises.push({ name: 'Leg Press', muscleGroup: 'Legs', sets: baseSets, reps, restSeconds: rest });
    if (hasMachine) legExercises.push({ name: 'Leg Curl', muscleGroup: 'Hamstrings', sets: 3, reps: '12-15', restSeconds: 60 });
    if (hasBodyweight) legExercises.push({ name: 'Bodyweight Squats', muscleGroup: 'Legs', sets: 3, reps: '20', restSeconds: 45 });

    // Full body exercises
    const fullBodyExercises: GeneratedExercise[] = [
        ...pushExercises.slice(0, 2),
        ...pullExercises.slice(0, 2),
        ...legExercises.slice(0, 2),
    ];

    // Templates based on split type
    switch (params.splitType) {
        case 'push_pull_legs':
            return [
                { name: 'Push Day', dayNumber: 1, focus: 'Chest, Shoulders, Triceps', exercises: pushExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Pull Day', dayNumber: 2, focus: 'Back, Biceps', exercises: pullExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Leg Day', dayNumber: 3, focus: 'Quads, Hamstrings, Glutes', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Push Day 2', dayNumber: 4, focus: 'Chest, Shoulders, Triceps', exercises: pushExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Pull Day 2', dayNumber: 5, focus: 'Back, Biceps', exercises: pullExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Leg Day 2', dayNumber: 6, focus: 'Quads, Hamstrings, Glutes', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
            ];

        case 'upper_lower':
            return [
                { name: 'Upper Body A', dayNumber: 1, focus: 'Chest, Back, Shoulders', exercises: [...pushExercises.slice(0, 3), ...pullExercises.slice(0, 3)], estimatedDuration: params.duration },
                { name: 'Lower Body A', dayNumber: 2, focus: 'Quads, Hamstrings, Glutes', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Upper Body B', dayNumber: 3, focus: 'Chest, Back, Arms', exercises: [...pushExercises.slice(0, 3), ...pullExercises.slice(0, 3)], estimatedDuration: params.duration },
                { name: 'Lower Body B', dayNumber: 4, focus: 'Quads, Hamstrings, Calves', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Upper Body C', dayNumber: 5, focus: 'Full Upper', exercises: [...pushExercises.slice(0, 3), ...pullExercises.slice(0, 3)], estimatedDuration: params.duration },
                { name: 'Lower Body C', dayNumber: 6, focus: 'Full Lower', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
            ];

        case 'full_body':
            return [
                { name: 'Full Body A', dayNumber: 1, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
                { name: 'Full Body B', dayNumber: 2, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
                { name: 'Full Body C', dayNumber: 3, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
                { name: 'Full Body D', dayNumber: 4, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
                { name: 'Full Body E', dayNumber: 5, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
                { name: 'Full Body F', dayNumber: 6, focus: 'All Major Muscle Groups', exercises: fullBodyExercises, estimatedDuration: params.duration },
            ];

        case 'bro_split':
        default:
            return [
                { name: 'Chest Day', dayNumber: 1, focus: 'Chest', exercises: pushExercises.filter(e => e.muscleGroup === 'Chest').slice(0, 5), estimatedDuration: params.duration },
                { name: 'Back Day', dayNumber: 2, focus: 'Back', exercises: pullExercises.filter(e => e.muscleGroup === 'Back').slice(0, 5), estimatedDuration: params.duration },
                { name: 'Shoulder Day', dayNumber: 3, focus: 'Shoulders', exercises: pushExercises.filter(e => e.muscleGroup.includes('Shoulder') || e.muscleGroup.includes('Delt')).slice(0, 5), estimatedDuration: params.duration },
                { name: 'Leg Day', dayNumber: 4, focus: 'Legs', exercises: legExercises.slice(0, 6), estimatedDuration: params.duration },
                { name: 'Arm Day', dayNumber: 5, focus: 'Biceps, Triceps', exercises: [...pullExercises.filter(e => e.muscleGroup === 'Biceps'), ...pushExercises.filter(e => e.muscleGroup === 'Triceps')], estimatedDuration: params.duration },
                { name: 'Full Body', dayNumber: 6, focus: 'Active Recovery', exercises: fullBodyExercises.slice(0, 4), estimatedDuration: params.duration },
            ];
    }
}

/**
 * Check if Claude API is configured
 */
export function isAIConfigured(): boolean {
    return !!getApiKey();
}

/**
 * Set API key (for user-provided keys)
 */
export async function setApiKey(key: string): Promise<void> {
    // This could store in AsyncStorage for persistence
    // For now, we rely on expo config
    console.log('API key configuration not yet implemented');
}
