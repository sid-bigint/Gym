export const PREDEFINED_BUNDLES = [
    {
        id: 'beginner-strength-5x5',
        name: 'Beginner Strength 5x5',
        description: 'Classic strength foundation building using heavy compound lifts.',
        type: 'Strength',
        level: 'Beginner',
        muscles: ['Full Body', 'Legs', 'Back', 'Chest'],
        gradient: ['#1c1c1e', '#2c2c2e'],
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        routines: [
            {
                name: 'Workout A',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 5, reps: 5 },
                    { name: 'Barbell Bench Press - Medium Grip', sets: 5, reps: 5 },
                    { name: 'Bent Over Barbell Row', sets: 5, reps: 5 }
                ]
            },
            {
                name: 'Workout B',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 5, reps: 5 },
                    { name: 'Military Press', sets: 5, reps: 5 },
                    { name: 'Barbell Deadlift', sets: 1, reps: 5 }
                ]
            }
        ]
    },
    {
        id: 'hypertrophy-ppl',
        name: 'Hypertrophy PPL',
        description: 'Push Pull Legs split designed for maximum muscle growth.',
        type: 'Hypertrophy',
        level: 'Intermediate',
        muscles: ['Chest', 'Back', 'Legs'],
        gradient: ['#007AFF', '#0055D4'],
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
        routines: [
            {
                name: 'Push Day',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 8 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Dips - Chest Version', sets: 3, reps: 12 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 15 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Pull Day',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 3, reps: 5 },
                    { name: 'Pullups', sets: 3, reps: 10 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Barbell Curl', sets: 3, reps: 10 },
                    { name: 'Face Pull', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Leg Day',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 8 },
                    { name: 'Leg Press', sets: 3, reps: 12 },
                    { name: 'Romanian Deadlift', sets: 3, reps: 10 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 },
                    { name: 'Standing Calf Raises', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'dumbbell-only',
        name: 'Dumbbell Only Home',
        description: 'Full workout routines using only a pair of dumbbells.',
        type: 'Home',
        level: 'Beginner',
        muscles: ['Full Body', 'Arms', 'Chest'],
        gradient: ['#30D158', '#248A3D'],
        image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800',
        routines: [
            {
                name: 'DB Full Body A',
                exercises: [
                    { name: 'Dumbbell Goblet Squat', sets: 3, reps: 12 },
                    { name: 'Dumbbell Bench Press', sets: 3, reps: 12 },
                    { name: 'One Arm Dumbbell Row', sets: 3, reps: 12 },
                    { name: 'Standing Dumbbell Press', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'DB Full Body B',
                exercises: [
                    { name: 'Dumbbell Lunge', sets: 3, reps: 12 },
                    { name: 'Straight-Leg Dumbbell Deadlift', sets: 3, reps: 12 },
                    { name: 'Dumbbell Flyes', sets: 3, reps: 15 },
                    { name: 'Dumbbell Bicep Curl', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'DB Push',
                exercises: [
                    { name: 'Dumbbell Bench Press', sets: 3, reps: 10 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Seated Dumbbell Press', sets: 3, reps: 12 },
                    { name: 'Side Lateral Raise', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'DB Pull',
                exercises: [
                    { name: 'One Arm Dumbbell Row', sets: 3, reps: 10 },
                    { name: 'Dumbbell Shrug', sets: 3, reps: 15 },
                    { name: 'Dumbbell Bicep Curl', sets: 3, reps: 12 },
                    { name: 'Hammer Curls', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'DB Legs',
                exercises: [
                    { name: 'Dumbbell Goblet Squat', sets: 4, reps: 12 },
                    { name: 'Dumbbell Lunge', sets: 3, reps: 12 },
                    { name: 'Straight-Leg Dumbbell Deadlift', sets: 3, reps: 12 },
                    { name: 'Standing Dumbbell Calf Raise', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'bodyweight-basics',
        name: 'Bodyweight Mastery',
        description: 'No equipment needed. Master your own bodyweight.',
        type: 'Calisthenics',
        level: 'Beginner',
        muscles: ['Full Body', 'Core'],
        gradient: ['#FF9500', '#D47B00'],
        image: 'https://images.unsplash.com/photo-1598971639058-211a74a94ca9?w=800',
        routines: [
            {
                name: 'Full Body Circuit',
                exercises: [
                    { name: 'Pushups', sets: 3, reps: 15 },
                    { name: 'Bodyweight Squat', sets: 3, reps: 20 },
                    { name: 'Lunges', sets: 3, reps: 15 },
                    { name: 'Plank', sets: 3, reps: 0 }, // 0 Reps implies time probably, need to handle
                    { name: 'Mountain Climbers', sets: 3, reps: 20 }
                ]
            },
            {
                name: 'Upper Body Focus',
                exercises: [
                    { name: 'Pushups', sets: 4, reps: 12 },
                    { name: 'Dips - Chest Version', sets: 3, reps: 10 }, // Assuming dips are possible on chairs
                    { name: 'Pullups', sets: 3, reps: 8 },
                    { name: 'Chin-Up', sets: 3, reps: 8 }
                ]
            },
            {
                name: 'Core Blaster',
                exercises: [
                    { name: 'Crunches', sets: 3, reps: 20 },
                    { name: 'Leg Raise', sets: 3, reps: 15 },
                    { name: 'Plank', sets: 3, reps: 60 },
                    { name: 'Russian Twist', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'gvt-volume',
        name: 'German Volume Training',
        description: '10 sets of 10 reps. High volume for mass.',
        type: 'Hypertrophy',
        level: 'Advanced',
        muscles: ['Full Body', 'Chest', 'Legs'],
        gradient: ['#AF52DE', '#8F42BE'],
        image: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800',
        routines: [
            {
                name: 'GVT Chest & Back',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 10, reps: 10 },
                    { name: 'Bent Over Barbell Row', sets: 10, reps: 10 },
                    { name: 'Cable Crossover', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'GVT Legs',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 10, reps: 10 },
                    { name: 'Leg Curl', sets: 10, reps: 10 },
                    { name: 'Standing Calf Raises', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'GVT Arms',
                exercises: [
                    { name: 'Dips - Triceps Version', sets: 10, reps: 10 },
                    { name: 'Barbell Curl', sets: 10, reps: 10 },
                    { name: 'Lateral Raise', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'mobility-recovery',
        name: 'Mobility & Recovery',
        description: 'Active recovery and flexibility work.',
        type: 'Mobility',
        level: 'All',
        muscles: ['Full Body'],
        gradient: ['#5AC8FA', '#3AA8DA'],
        image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800',
        routines: [
            {
                name: 'Full Body Stretch',
                exercises: [
                    { name: 'Cat Stretch', sets: 1, reps: 10 },
                    { name: '90/90 Hamstring', sets: 1, reps: 10 },
                    { name: 'Groin and Back Stretch', sets: 1, reps: 10 }
                ]
            },
            {
                name: 'Shoulder Health',
                exercises: [
                    { name: 'External Rotation', sets: 3, reps: 15 },
                    { name: 'Face Pull', sets: 3, reps: 15 },
                    { name: 'Band Pull Apart', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'power-explosive',
        name: 'Power & Explosive',
        description: 'Train for speed and power development.',
        type: 'Power',
        level: 'Advanced',
        muscles: ['Full Body', 'Legs'],
        gradient: ['#FF2D55', '#D4002B'],
        image: 'https://images.unsplash.com/photo-1517931160458-2f69b2dfbf44?w=800',
        routines: [
            {
                name: 'Power Lower',
                exercises: [
                    { name: 'Power Clean', sets: 5, reps: 3 },
                    { name: 'Box Jump', sets: 5, reps: 3 },
                    { name: 'Front Squat', sets: 4, reps: 6 }
                ]
            },
            {
                name: 'Power Upper',
                exercises: [
                    { name: 'Push Press', sets: 5, reps: 3 },
                    { name: 'Medicine Ball Chest Throw', sets: 5, reps: 5 },
                    { name: 'Clapping Pushups', sets: 4, reps: 6 }
                ]
            }
        ]
    },
    {
        id: 'advanced-bro-split',
        name: 'Bro Split (5 Day)',
        description: 'One muscle group per day for maximum focus.',
        type: 'Hypertrophy',
        level: 'Advanced',
        muscles: ['Chest', 'Back', 'Arms', 'Shoulders', 'Legs'],
        gradient: ['#FF3B30', '#D41810'],
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
        routines: [
            {
                name: 'Chest Day',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 8 },
                    { name: 'Incline Dumbbell Press', sets: 4, reps: 10 },
                    { name: 'Dumbbell Flyes', sets: 3, reps: 12 },
                    { name: 'Cable Crossover', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Back Day',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 4, reps: 6 },
                    { name: 'Pullups', sets: 4, reps: 8 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Lat Pulldown', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Shoulder Day',
                exercises: [
                    { name: 'Military Press', sets: 4, reps: 8 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 12 },
                    { name: 'Front Dumbbell Raise', sets: 3, reps: 12 },
                    { name: 'Reverse Flyes', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Leg Day',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 8 },
                    { name: 'Leg Press', sets: 4, reps: 12 },
                    { name: 'Leg Extensions', sets: 3, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Arm Day',
                exercises: [
                    { name: 'Barbell Curl', sets: 4, reps: 10 },
                    { name: 'Close-Grip Barbell Bench Press', sets: 4, reps: 10 },
                    { name: 'Hammer Curls', sets: 3, reps: 12 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 }
                ]
            }
        ]
    },
    {
        id: 'cardio-conditioning',
        name: 'Cardio & Conditioning',
        description: 'Improve heart health and stamina.',
        type: 'Cardio',
        level: 'All',
        muscles: ['Full Body', 'Heart'],
        gradient: ['#32ADE6', '#128DB6'],
        image: 'https://images.unsplash.com/photo-1538805060518-7dc2e3cda132?w=800',
        routines: [
            {
                name: 'HIIT Circuit',
                exercises: [
                    { name: 'Burpees', sets: 4, reps: 15 },
                    { name: 'Mountain Climbers', sets: 4, reps: 20 },
                    { name: 'Jump Squat', sets: 4, reps: 15 },
                    { name: 'Kettlebell Swing', sets: 4, reps: 20 }
                ]
            },
            {
                name: 'Cardio Core',
                exercises: [
                    { name: 'Plank', sets: 3, reps: 60 },
                    { name: 'Bicycling', sets: 1, reps: 1 }, // Need to handle as duration usually
                    { name: 'Crunches', sets: 3, reps: 20 },
                    { name: 'Air Bike', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'upper-lower-split',
        name: 'Upper / Lower Split',
        description: '4 day split hitting each muscle group twice a week.',
        type: 'Hypertrophy',
        level: 'Intermediate',
        muscles: ['Upper Body', 'Lower Body'],
        gradient: ['#5856D6', '#3F3D99'],
        image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800',
        routines: [
            {
                name: 'Upper Power',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 6 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 6 },
                    { name: 'Military Press', sets: 3, reps: 8 },
                    { name: 'Pullups', sets: 3, reps: 8 }
                ]
            },
            {
                name: 'Lower Power',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 6 },
                    { name: 'Romanian Deadlift', sets: 4, reps: 8 },
                    { name: 'Leg Press', sets: 3, reps: 10 },
                    { name: 'Standing Calf Raises', sets: 4, reps: 15 }
                ]
            },
            {
                name: 'Upper Hypertrophy',
                exercises: [
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 10 },
                    { name: 'Side Lateral Raise', sets: 3, reps: 15 },
                    { name: 'Barbell Curl', sets: 3, reps: 12 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Lower Hypertrophy',
                exercises: [
                    { name: 'Front Squat', sets: 3, reps: 10 },
                    { name: 'Lunges', sets: 3, reps: 12 },
                    { name: 'Leg Extensions', sets: 3, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'kettlebell-kings',
        name: 'Kettlebell Kings',
        description: 'Functional strength and conditioning using kettlebells.',
        type: 'Functional',
        level: 'Intermediate',
        muscles: ['Full Body', 'Back', 'Legs'],
        gradient: ['#FF9500', '#FF3B30'],
        image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800',
        routines: [
            {
                name: 'KB Full Body Flow',
                exercises: [
                    { name: 'Kettlebell Swing', sets: 4, reps: 20 },
                    { name: 'Goblet Squat', sets: 4, reps: 15 },
                    { name: 'Alternating Kettlebell Row', sets: 4, reps: 12 },
                    { name: 'Alternating Kettlebell Press', sets: 3, reps: 10 }
                ]
            },
            {
                name: 'KB Lower Blast',
                exercises: [
                    { name: 'Kettlebell Swing', sets: 5, reps: 20 },
                    { name: 'Dumbbell Walking Lunge', sets: 4, reps: 12 },
                    { name: 'Kettlebell One-Legged Deadlift', sets: 4, reps: 12 }
                ]
            },
            {
                name: 'KB Upper Power',
                exercises: [
                    { name: 'Alternating Kettlebell Press', sets: 4, reps: 8 },
                    { name: 'Alternating Floor Press', sets: 4, reps: 10 },
                    { name: 'Kettlebell Arnold Press', sets: 3, reps: 12 }
                ]
            }
        ]
    },
    {
        id: 'glute-focus',
        name: 'Glute Growth',
        description: 'Specialized routines for lower body aesthetics and strength.',
        type: 'Hypertrophy',
        level: 'Intermediate',
        muscles: ['Glutes', 'Legs', 'Hips'],
        gradient: ['#FF2D55', '#5856D6'],
        image: 'https://images.unsplash.com/photo-1579364046732-c21c2177b6e5?w=800',
        routines: [
            {
                name: 'Glute Isolation',
                exercises: [
                    { name: 'Barbell Hip Thrust', sets: 4, reps: 12 },
                    { name: 'Cable Pull Through', sets: 3, reps: 15 },
                    { name: 'Barbell Glute Bridge', sets: 3, reps: 20 },
                    { name: 'Glute Kickback', sets: 3, reps: 20 }
                ]
            },
            {
                name: 'Heavy Glutes',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 8 },
                    { name: 'Barbell Split Squat', sets: 3, reps: 10 },
                    { name: 'Romanian Deadlift', sets: 4, reps: 10 },
                    { name: 'Dumbbell Lunge', sets: 3, reps: 20 }
                ]
            },
            {
                name: 'Band Booty Burn',
                exercises: [
                    { name: 'Band Hip Adductions', sets: 3, reps: 20 },
                    { name: 'Clam', sets: 3, reps: 20 },
                    { name: 'Glute Bridge', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'abs-core-sculpt',
        name: 'Core Sculpt',
        description: 'Chiseled abs and a strong core.',
        type: 'Core',
        level: 'All',
        muscles: ['Abs', 'Obliques'],
        gradient: ['#34C759', '#30D158'],
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        routines: [
            {
                name: 'Six Pack Attack',
                exercises: [
                    { name: 'Hanging Leg Raise', sets: 3, reps: 12 },
                    { name: 'Cable Crunch', sets: 3, reps: 15 },
                    { name: 'Pallof Press', sets: 3, reps: 12 },
                    { name: 'Plank', sets: 3, reps: 60 }
                ]
            },
            {
                name: 'Oblique Focus',
                exercises: [
                    { name: 'Russian Twist', sets: 3, reps: 20 },
                    { name: 'Side Plank', sets: 3, reps: 45 },
                    { name: 'Cable Woodchoppers', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'No Equipment Abs',
                exercises: [
                    { name: 'Crunch', sets: 4, reps: 25 },
                    { name: 'Leg Raise', sets: 4, reps: 15 },
                    { name: 'Mountain Climbers', sets: 4, reps: 30 },
                    { name: 'Jackknife Sit-Up', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'strongman-foundation',
        name: 'Strongman Foundation',
        description: 'Build real-world functional strength.',
        type: 'Strength',
        level: 'Advanced',
        muscles: ['Full Body', 'Back', 'Grip'],
        gradient: ['#8E8E93', '#636366'],
        image: 'https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?w=800',
        routines: [
            {
                name: 'Carries & Holds',
                exercises: [
                    { name: 'Farmers Walk', sets: 4, reps: 30 },
                    { name: 'Suitcase Carry', sets: 3, reps: 30 },
                    { name: 'Plate Pinch', sets: 3, reps: 30 }
                ]
            },
            {
                name: 'Heavy Objects',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 5, reps: 3 },
                    { name: 'Zercher Squat', sets: 4, reps: 6 },
                    { name: 'Clean', sets: 3, reps: 5 }
                ]
            },
            {
                name: 'Overhead Power',
                exercises: [
                    { name: 'Push Press', sets: 4, reps: 5 },
                    { name: 'Military Press', sets: 4, reps: 8 },
                    { name: 'Standing Dumbbell Press', sets: 3, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'fat-loss-shred',
        name: 'Fat Loss Shred',
        description: 'High intensity circuits to burn calories.',
        type: 'Cardio',
        level: 'Intermediate',
        muscles: ['Full Body'],
        gradient: ['#FF3B30', '#FF9500'],
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
        routines: [
            {
                name: 'Metcon A',
                exercises: [
                    { name: 'Barbell Thruster', sets: 4, reps: 15 },
                    { name: 'Burpee', sets: 4, reps: 15 },
                    { name: 'Kettlebell Swing', sets: 4, reps: 20 },
                    { name: 'Box Jump', sets: 4, reps: 15 }
                ]
            },
            {
                name: 'Metcon B',
                exercises: [
                    { name: 'Rowing, Stationary', sets: 4, reps: 0 },
                    { name: 'Wall Ball', sets: 4, reps: 20 },
                    { name: 'Pushups', sets: 4, reps: 20 },
                    { name: 'Walking Lunge', sets: 4, reps: 20 }
                ]
            },
            {
                name: 'Tabata Torch',
                exercises: [
                    { name: 'Jump Squat', sets: 8, reps: 20 },
                    { name: 'Mountain Climbers', sets: 8, reps: 20 },
                    { name: 'High Knees', sets: 8, reps: 20 },
                    { name: 'Burpee', sets: 8, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'machine-only',
        name: 'Machine Only',
        description: 'Safe and effective routines using gym machines.',
        type: 'Beginner',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#AF52DE', '#5856D6'],
        image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800',
        routines: [
            {
                name: 'Machine Full Body',
                exercises: [
                    { name: 'Leg Press', sets: 3, reps: 12 },
                    { name: 'Machine Chest Press', sets: 3, reps: 12 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Machine Shoulder Press', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Machine Upper',
                exercises: [
                    { name: 'Machine Chest Press', sets: 3, reps: 12 },
                    { name: 'Lat Pulldown', sets: 3, reps: 12 },
                    { name: 'Machine Fly', sets: 3, reps: 15 },
                    { name: 'Preacher Curl', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Machine Lower',
                exercises: [
                    { name: 'Leg Press', sets: 3, reps: 12 },
                    { name: 'Leg Extensions', sets: 3, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 },
                    { name: 'Seated Calf Raise', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'ppl-advanced',
        name: 'PPL Advanced Volume',
        description: 'High volume push pull legs split for experienced lifters looking to maximize hypertrophy.',
        type: 'Hypertrophy',
        level: 'Advanced',
        muscles: ['Chest', 'Back', 'Legs'],
        gradient: ['#007AFF', '#5AC8FA'],
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        routines: [
            {
                name: 'Push A (Strength Focus)',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 5, reps: 5 },
                    { name: 'Military Press', sets: 4, reps: 6 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Dips - Chest Version', sets: 3, reps: 12 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Pull A (Strength Focus)',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 5, reps: 5 },
                    { name: 'Pullups', sets: 4, reps: 6 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 8 },
                    { name: 'Barbell Curl', sets: 3, reps: 10 },
                    { name: 'Face Pull', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Legs A (Squat Focus)',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 5, reps: 5 },
                    { name: 'Romanian Deadlift', sets: 4, reps: 8 },
                    { name: 'Leg Press', sets: 3, reps: 12 },
                    { name: 'Standing Calf Raises', sets: 4, reps: 15 }
                ]
            },
            {
                name: 'Push B (Hypertrophy Focus)',
                exercises: [
                    { name: 'Incline Barbell Bench Press', sets: 4, reps: 10 },
                    { name: 'Seated Dumbbell Press', sets: 3, reps: 12 },
                    { name: 'Dumbbell Flyes', sets: 3, reps: 15 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 15 },
                    { name: 'Skullcrushers', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Pull B (Hypertrophy Focus)',
                exercises: [
                    { name: 'Barbell Row', sets: 4, reps: 10 },
                    { name: 'Lat Pulldown', sets: 3, reps: 12 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Preacher Curl', sets: 3, reps: 12 },
                    { name: 'Hammer Curls', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Legs B (Hinge/Machine Focus)',
                exercises: [
                    { name: 'Front Squat', sets: 4, reps: 10 },
                    { name: 'Leg Press', sets: 3, reps: 15 },
                    { name: 'Leg Extensions', sets: 3, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 },
                    { name: 'Seated Calf Raise', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'aesthetic-split-4day',
        name: 'Aesthetics Split (4 Day)',
        description: 'Balanced 4-day split prioritizing V-taper and core development.',
        type: 'Aesthetics',
        level: 'Intermediate',
        muscles: ['Chest', 'Back', 'Shoulders', 'Legs'],
        gradient: ['#5856D6', '#FF2D55'],
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
        routines: [
            {
                name: 'Chest & Triceps',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 8 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Cable Crossover', sets: 3, reps: 15 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 },
                    { name: 'Dips - Triceps Version', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Back & Biceps',
                exercises: [
                    { name: 'Pullups', sets: 4, reps: 8 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 10 },
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Barbell Curl', sets: 3, reps: 10 },
                    { name: 'Incline Dumbbell Curl', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Shoulders & Abs',
                exercises: [
                    { name: 'Seated Dumbbell Press', sets: 4, reps: 10 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 15 },
                    { name: 'Face Pull', sets: 3, reps: 15 },
                    { name: 'Hanging Leg Raise', sets: 3, reps: 15 },
                    { name: 'Cable Crunch', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Legs',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 8 },
                    { name: 'Romanian Deadlift', sets: 4, reps: 10 },
                    { name: 'Walking Lunge', sets: 3, reps: 12 },
                    { name: 'Standing Calf Raises', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'arnold-split',
        name: 'Arnold Split (Classic)',
        description: 'The legendary antagonist split: Chest/Back, Shoulders/Arms, Legs.',
        type: 'Hypertrophy',
        level: 'Advanced',
        muscles: ['Chest', 'Back', 'Arms', 'Shoulders'],
        gradient: ['#FF9500', '#FF2D55'],
        image: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=800',
        routines: [
            {
                name: 'Chest & Back',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 8 },
                    { name: 'Pullups', sets: 4, reps: 10 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
                    { name: 'Bent Over Barbell Row', sets: 3, reps: 10 },
                    { name: 'Dumbbell Flyes', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Shoulders & Arms',
                exercises: [
                    { name: 'Military Press', sets: 4, reps: 8 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 12 },
                    { name: 'Barbell Curl', sets: 3, reps: 10 },
                    { name: 'Skullcrushers', sets: 3, reps: 10 },
                    { name: 'Wrist Curl', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Legs',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 5, reps: 8 },
                    { name: 'Leg Press', sets: 4, reps: 10 },
                    { name: 'Stiff-Legged Barbell Deadlift', sets: 4, reps: 10 },
                    { name: 'Seated Calf Raise', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'phul-split',
        name: 'P.H.U.L.',
        description: 'Power Hypertrophy Upper Lower - The perfect mix of strength and size.',
        type: 'Powerbuilding',
        level: 'Intermediate',
        muscles: ['Full Body', 'Upper Body', 'Lower Body'],
        gradient: ['#30D158', '#007AFF'],
        image: 'https://images.unsplash.com/photo-1541600383005-565c949cf777?w=800',
        routines: [
            {
                name: 'Upper Power',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 5 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 5 },
                    { name: 'Overhead Press', sets: 3, reps: 8 },
                    { name: 'Skullcrushers', sets: 3, reps: 8 }
                ]
            },
            {
                name: 'Lower Power',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 5 },
                    { name: 'Barbell Deadlift', sets: 4, reps: 5 },
                    { name: 'Leg Press', sets: 4, reps: 10 },
                    { name: 'Standing Calf Raises', sets: 4, reps: 10 }
                ]
            },
            {
                name: 'Upper Hypertrophy',
                exercises: [
                    { name: 'Incline Barbell Bench Press', sets: 4, reps: 10 },
                    { name: 'Cable Flyes', sets: 4, reps: 12 },
                    { name: 'Seated Cable Rows', sets: 4, reps: 12 },
                    { name: 'Dumbbell Bicep Curl', sets: 4, reps: 12 },
                    { name: 'Triceps Pushdown', sets: 4, reps: 12 }
                ]
            },
            {
                name: 'Lower Hypertrophy',
                exercises: [
                    { name: 'Front Squat', sets: 4, reps: 10 },
                    { name: 'Barbell Lunge', sets: 4, reps: 12 },
                    { name: 'Leg Extensions', sets: 4, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'minimalist-2day',
        name: 'Minimalist 2-Day',
        description: 'For busy schedules. Hit everything important in just two sessions.',
        type: 'Strength',
        level: 'Intermediate',
        muscles: ['Full Body'],
        gradient: ['#8E8E93', '#1c1c1e'],
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        routines: [
            {
                name: 'Day A (Push/Quad)',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 3, reps: 6 },
                    { name: 'Barbell Bench Press - Medium Grip', sets: 3, reps: 6 },
                    { name: 'Military Press', sets: 3, reps: 8 },
                    { name: 'Dips - Chest Version', sets: 2, reps: 12 }
                ]
            },
            {
                name: 'Day B (Pull/Hinge)',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 2, reps: 5 },
                    { name: 'Pullups', sets: 3, reps: 8 },
                    { name: 'Bent Over Barbell Row', sets: 3, reps: 10 },
                    { name: 'Barbell Curl', sets: 2, reps: 12 }
                ]
            }
        ]
    },
    {
        id: 'hypertrophy-beginner-machine',
        name: 'Beginner Machine Hypertrophy',
        description: 'Safe and effective muscle building using machines. Perfect for gym newcomers.',
        type: 'Hypertrophy',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#64D2FF', '#007AFF'],
        image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800',
        routines: [
            {
                name: 'Full Body Machines A',
                exercises: [
                    { name: 'Machine Chest Press', sets: 3, reps: 12 },
                    { name: 'Lat Pulldown', sets: 3, reps: 12 },
                    { name: 'Leg Press', sets: 3, reps: 12 },
                    { name: 'Machine Shoulder Press', sets: 3, reps: 12 },
                    { name: 'Machine Bicep Curl', sets: 3, reps: 15 }
                ]
            },
            {
                name: 'Full Body Machines B',
                exercises: [
                    { name: 'Seated Cable Rows', sets: 3, reps: 12 },
                    { name: 'Leg Extensions', sets: 3, reps: 15 },
                    { name: 'Seated Leg Curl', sets: 3, reps: 15 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 15 },
                    { name: 'Crunches', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'home-intermediate-split',
        name: 'Home Dumbbell Split',
        description: 'Intermediate level 4-day split requiring only dumbbells and a bench.',
        type: 'Home',
        level: 'Intermediate',
        muscles: ['Upper Body', 'Lower Body'],
        gradient: ['#30D158', '#0A84FF'],
        image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800',
        routines: [
            {
                name: 'Upper A',
                exercises: [
                    { name: 'Dumbbell Bench Press', sets: 4, reps: 10 },
                    { name: 'One Arm Dumbbell Row', sets: 4, reps: 12 },
                    { name: 'Seated Dumbbell Press', sets: 3, reps: 12 },
                    { name: 'Dumbbell Bicep Curl', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Lower A',
                exercises: [
                    { name: 'Dumbbell Goblet Squat', sets: 4, reps: 12 },
                    { name: 'Dumbbell Lunge', sets: 3, reps: 12 },
                    { name: 'Straight-Leg Dumbbell Deadlift', sets: 3, reps: 12 },
                    { name: 'Standing Dumbbell Calf Raise', sets: 4, reps: 15 }
                ]
            },
            {
                name: 'Upper B',
                exercises: [
                    { name: 'Incline Dumbbell Press', sets: 4, reps: 10 },
                    { name: 'Dumbbell Flyes', sets: 3, reps: 12 },
                    { name: 'Dumbbell Shrug', sets: 3, reps: 15 },
                    { name: 'Skullcrushers', sets: 3, reps: 12 }
                ]
            },
            {
                name: 'Lower B',
                exercises: [
                    { name: 'Dumbbell Step Up', sets: 3, reps: 12 },
                    { name: 'Glute Bridge', sets: 3, reps: 15 },
                    { name: 'Dumbbell Clean', sets: 3, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'home-advanced-shock',
        name: 'Home Advanced Shock',
        description: 'High intensity techniques (supersets, dropsets) for home training.',
        type: 'Home',
        level: 'Advanced',
        muscles: ['Full Body'],
        gradient: ['#FF375F', '#BF5AF2'],
        image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
        routines: [
            {
                name: 'Push Intensity',
                exercises: [
                    { name: 'Dumbbell Bench Press', sets: 4, reps: 10 },
                    { name: 'Pushups', sets: 4, reps: 20 },
                    { name: 'Seated Dumbbell Press', sets: 4, reps: 12 },
                    { name: 'Side Lateral Raise', sets: 4, reps: 15 }
                ]
            },
            {
                name: 'Pull Intensity',
                exercises: [
                    { name: 'Pullups', sets: 4, reps: 10 },
                    { name: 'One Arm Dumbbell Row', sets: 4, reps: 12 },
                    { name: 'Dumbbell Pullover', sets: 3, reps: 15 },
                    { name: 'Dumbbell Bicep Curl', sets: 4, reps: 12 }
                ]
            },
            {
                name: 'Legs Intensity',
                exercises: [
                    { name: 'Dumbbell Goblet Squat', sets: 5, reps: 15 },
                    { name: 'Jump Squat', sets: 4, reps: 20 },
                    { name: 'Dumbbell Lunge', sets: 4, reps: 12 }
                ]
            }
        ]
    },
    {
        id: 'calisthenics-beginner-2',
        name: 'Calisthenics Start Up',
        description: 'Build your base with fundamental bodyweight movements.',
        type: 'Calisthenics',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#FFD60A', '#FF9F0A'],
        image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800',
        routines: [
            {
                name: 'Basics A',
                exercises: [
                    { name: 'Pushups', sets: 3, reps: 10 },
                    { name: 'Inverted Row', sets: 3, reps: 10 },
                    { name: 'Bodyweight Squat', sets: 3, reps: 15 },
                    { name: 'Plank', sets: 3, reps: 30 }
                ]
            },
            {
                name: 'Basics B',
                exercises: [
                    { name: 'Bench Dips', sets: 3, reps: 12 },
                    { name: 'Chin-Up', sets: 3, reps: 0 },
                    { name: 'Lunges', sets: 3, reps: 12 },
                    { name: 'Leg Raise', sets: 3, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'calisthenics-intermediate-rings',
        name: 'Ring Calisthenics',
        description: 'Intermediate routine utilizing gymnastic rings for stability and strength.',
        type: 'Calisthenics',
        level: 'Intermediate',
        muscles: ['Upper Body', 'Core'],
        gradient: ['#AC8E68', '#6B5B45'],
        image: 'https://images.unsplash.com/photo-1517963879466-cd11fa9e51e9?w=800',
        routines: [
            {
                name: 'Ring Upper Body',
                exercises: [
                    { name: 'Dips - Chest Version', sets: 4, reps: 8 },
                    { name: 'Pullups', sets: 4, reps: 8 },
                    { name: 'Pushups', sets: 4, reps: 12 },
                    { name: 'Inverted Row', sets: 4, reps: 10 }
                ]
            },
            {
                name: 'Ring Core',
                exercises: [
                    { name: 'Hanging Leg Raise', sets: 3, reps: 10 },
                    { name: 'L-Sit', sets: 3, reps: 20 },
                    { name: 'Plank', sets: 3, reps: 60 }
                ]
            }
        ]
    },
    {
        id: 'calisthenics-advanced-skills',
        name: 'Advanced Static Skills',
        description: 'Training towards levers, planches, and muscle-ups.',
        type: 'Calisthenics',
        level: 'Advanced',
        muscles: ['Full Body', 'Core', 'Back'],
        gradient: ['#1c1c1e', '#8E8E93'],
        image: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=800',
        routines: [
            {
                name: 'Lever Day',
                exercises: [
                    { name: 'Pullups', sets: 5, reps: 10 },
                    { name: 'Hanging Leg Raise', sets: 4, reps: 10 },
                    { name: 'Cable Pullover', sets: 3, reps: 12 },
                    { name: 'Dragon Flag', sets: 3, reps: 5 }
                ]
            },
            {
                name: 'Push Power',
                exercises: [
                    { name: 'Dips - Chest Version', sets: 5, reps: 15 },
                    { name: 'Clapping Pushups', sets: 4, reps: 10 },
                    { name: 'Handstand Push-Up', sets: 3, reps: 5 }
                ]
            }
        ]
    },
    {
        id: 'mobility-foundation',
        name: 'Mobility Foundation',
        description: 'Beginner routines to start opening up tight joints.',
        type: 'Mobility',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#64D2FF', '#5AC8FA'],
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
        routines: [
            {
                name: 'Morning Flow',
                exercises: [
                    { name: 'Cat Stretch', sets: 2, reps: 10 },
                    { name: 'Kneeling Hip Flexor Stretch', sets: 2, reps: 30 },
                    { name: 'Groin and Back Stretch', sets: 2, reps: 30 }
                ]
            }
        ]
    },
    {
        id: 'mobility-advanced',
        name: 'Advanced Mobility',
        description: 'Deep flexibility work for advanced movers.',
        type: 'Mobility',
        level: 'Advanced',
        muscles: ['Hips', 'Shoulders'],
        gradient: ['#5856D6', '#AF52DE'],
        image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800',
        routines: [
            {
                name: 'Deep Squat Prep',
                exercises: [
                    { name: 'Goblet Squat', sets: 3, reps: 30 },
                    { name: 'Groin and Back Stretch', sets: 3, reps: 60 },
                    { name: 'Ankle Dorsiflexion', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'power-beginner-start',
        name: 'Explosive Start',
        description: 'Introduction to power training and moving weights fast.',
        type: 'Power',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#FF453A', '#FF9F0A'],
        image: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800',
        routines: [
            {
                name: 'Jump & Throw',
                exercises: [
                    { name: 'Box Jump', sets: 5, reps: 5 },
                    { name: 'Medicine Ball Chest Throw', sets: 5, reps: 5 },
                    { name: 'Kettlebell Swing', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'power-intermediate-complex',
        name: 'Power Complexes',
        description: 'Pairing heavy strength with explosive movements.',
        type: 'Power',
        level: 'Intermediate',
        muscles: ['Full Body'],
        gradient: ['#FF3B30', '#D4002B'],
        image: 'https://images.unsplash.com/photo-1517931160458-2f69b2dfbf44?w=800',
        routines: [
            {
                name: 'Contrast Lower',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 4, reps: 5 },
                    { name: 'Jump Squat', sets: 4, reps: 5 },
                    { name: 'Barbell Deadlift', sets: 3, reps: 5 },
                    { name: 'Broad Jump', sets: 3, reps: 5 }
                ]
            },
            {
                name: 'Contrast Upper',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 4, reps: 5 },
                    { name: 'Clapping Pushups', sets: 4, reps: 5 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 6 },
                    { name: 'Medicine Ball Slam', sets: 4, reps: 8 }
                ]
            }
        ]
    },
    {
        id: 'cardio-run-prep',
        name: 'Runner\'s Strength',
        description: 'Strength routine designed to support running performance.',
        type: 'Cardio',
        level: 'Beginner',
        muscles: ['Legs', 'Core'],
        gradient: ['#32ADE6', '#007AFF'],
        image: 'https://images.unsplash.com/photo-1486218119243-1388350cc8eb?w=800',
        routines: [
            {
                name: 'Leg Stability',
                exercises: [
                    { name: 'Lunges', sets: 3, reps: 15 },
                    { name: 'Step Ups', sets: 3, reps: 12 },
                    { name: 'Plank', sets: 3, reps: 45 },
                    { name: 'Standing Calf Raises', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'cardio-hiit-int',
        name: 'Intermediate HIIT',
        description: 'High intensity intervals to boost VO2 max.',
        type: 'Cardio',
        level: 'Intermediate',
        muscles: ['Full Body', 'Heart'],
        gradient: ['#5AC8FA', '#34C759'],
        image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800',
        routines: [
            {
                name: 'Full Body Burn',
                exercises: [
                    { name: 'Burpees', sets: 4, reps: 15 },
                    { name: 'Mountain Climbers', sets: 4, reps: 30 },
                    { name: 'Jumping Jacks', sets: 4, reps: 50 },
                    { name: 'Kettlebell Swing', sets: 4, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'functional-basics',
        name: 'Functional Basics',
        description: 'Move better in everyday life.',
        type: 'Functional',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#FF9500', '#FFCC00'],
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
        routines: [
            {
                name: 'Daily Movements',
                exercises: [
                    { name: 'Bodyweight Squat', sets: 3, reps: 15 },
                    { name: 'Pushups', sets: 3, reps: 10 },
                    { name: 'Lunges', sets: 3, reps: 12 },
                    { name: 'Plank', sets: 3, reps: 30 }
                ]
            }
        ]
    },
    {
        id: 'functional-tactical',
        name: 'Tactical Fitness',
        description: 'Rugged conditioning for real-world demands.',
        type: 'Functional',
        level: 'Advanced',
        muscles: ['Full Body'],
        gradient: ['#556655', '#334433'],
        image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800',
        routines: [
            {
                name: 'Ruck & Lift',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 4, reps: 8 },
                    { name: 'Pullups', sets: 4, reps: 8 },
                    { name: 'Farmers Walk', sets: 4, reps: 30 },
                    { name: 'Burpee', sets: 4, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'core-beginner',
        name: 'Core Foundations',
        description: 'Build a stable spine and basic core strength.',
        type: 'Core',
        level: 'Beginner',
        muscles: ['Abs', 'Lower Back'],
        gradient: ['#30D158', '#34C759'],
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        routines: [
            {
                name: 'Mat Pilates Inspired',
                exercises: [
                    { name: 'Glute Bridge', sets: 3, reps: 15 },
                    { name: 'Bird Dog', sets: 3, reps: 12 },
                    { name: 'Plank', sets: 3, reps: 30 },
                    { name: 'Crunch', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'aesthetics-beach',
        name: 'Beach Body Ready',
        description: 'Focus on chest, arms, and abs for the beach look.',
        type: 'Aesthetics',
        level: 'Beginner',
        muscles: ['Chest', 'Arms', 'Abs'],
        gradient: ['#5AC8FA', '#4CD964'],
        image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800',
        routines: [
            {
                name: 'Upper Pump',
                exercises: [
                    { name: 'Barbell Bench Press - Medium Grip', sets: 3, reps: 10 },
                    { name: 'Barbell Curl', sets: 3, reps: 12 },
                    { name: 'Triceps Pushdown', sets: 3, reps: 12 },
                    { name: 'Crunches', sets: 3, reps: 20 }
                ]
            }
        ]
    },
    {
        id: 'aesthetics-pro',
        name: 'Pro Physique Detail',
        description: 'Advanced detailing for lagging body parts.',
        type: 'Aesthetics',
        level: 'Advanced',
        muscles: ['Delts', 'Upper Chest', 'Calves'],
        gradient: ['#5856D6', '#FF2D55'],
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
        routines: [
            {
                name: 'Weak Point Training',
                exercises: [
                    { name: 'Incline Dumbbell Press', sets: 4, reps: 12 },
                    { name: 'Side Lateral Raise', sets: 5, reps: 15 },
                    { name: 'Rear Delt Fly', sets: 4, reps: 15 },
                    { name: 'Seated Calf Raise', sets: 5, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'powerbuilding-linear',
        name: 'Linear Powerbuilding',
        description: 'Linear progression on compounds with hypertrophy accessories.',
        type: 'Powerbuilding',
        level: 'Beginner',
        muscles: ['Full Body'],
        gradient: ['#FF3B30', '#007AFF'],
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        routines: [
            {
                name: 'Full Body Power',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 3, reps: 5 },
                    { name: 'Barbell Bench Press - Medium Grip', sets: 3, reps: 5 },
                    { name: 'Barbell Deadlift', sets: 1, reps: 5 },
                    { name: 'Pullups', sets: 3, reps: 8 },
                    { name: 'Dips - Chest Version', sets: 2, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'powerbuilding-elite',
        name: 'Elite Powerbuilding',
        description: 'Heavy singles and high volume for the elite hybrid athlete.',
        type: 'Powerbuilding',
        level: 'Advanced',
        muscles: ['Full Body'],
        gradient: ['#1c1c1e', '#D41810'],
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        routines: [
            {
                name: 'Squat & Push',
                exercises: [
                    { name: 'Barbell Full Squat', sets: 5, reps: 3 },
                    { name: 'Barbell Bench Press - Medium Grip', sets: 5, reps: 3 },
                    { name: 'Leg Press', sets: 4, reps: 12 },
                    { name: 'Incline Dumbbell Press', sets: 4, reps: 10 }
                ]
            },
            {
                name: 'Deadlift & Pull',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 5, reps: 2 },
                    { name: 'Bent Over Barbell Row', sets: 4, reps: 8 },
                    { name: 'Pullups', sets: 4, reps: 8 },
                    { name: 'Barbell Curl', sets: 4, reps: 10 }
                ]
            }
        ]
    },
    {
        id: 'core-iron-stability',
        name: 'Iron Core Stability',
        description: 'Focus on anti-rotation and static strength for a rock-solid midsection.',
        type: 'Core',
        level: 'Intermediate',
        muscles: ['Abs', 'Obliques'],
        gradient: ['#636366', '#8E8E93'],
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
        routines: [
            {
                name: 'Anti-Rotation Focus',
                exercises: [
                    { name: 'Pallof Press', sets: 4, reps: 12 },
                    { name: 'Plank', sets: 4, reps: 60 },
                    { name: 'Side Plank', sets: 3, reps: 45 },
                    { name: 'Renegade Row', sets: 3, reps: 10 }
                ]
            },
            {
                name: 'Static Strength',
                exercises: [
                    { name: 'L-Sit', sets: 4, reps: 20 },
                    { name: 'Ab Wheel Rollout', sets: 3, reps: 10 },
                    { name: 'Hollow Body Hold', sets: 4, reps: 30 }
                ]
            }
        ]
    },
    {
        id: 'core-hanging-specialist',
        name: 'Hanging Core Specialist',
        description: 'Advanced bar-based ab training for gymnastic strength.',
        type: 'Core',
        level: 'Advanced',
        muscles: ['Abs', 'Hip Flexors'],
        gradient: ['#FF9500', '#FF2D55'],
        image: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=800',
        routines: [
            {
                name: 'Barbell & Bar',
                exercises: [
                    { name: 'Hanging Leg Raise', sets: 4, reps: 12 },
                    { name: 'Toes to Bar', sets: 4, reps: 10 },
                    { name: 'Windshield Wipers', sets: 3, reps: 10 },
                    { name: 'Chin-Up', sets: 3, reps: 8 }
                ]
            }
        ]
    },
    {
        id: 'core-weighted-builder',
        name: 'Weighted Core Builder',
        description: 'Treating the abs like any other muscle: heavy weight, low reps.',
        type: 'Core',
        level: 'Intermediate',
        muscles: ['Abs'],
        gradient: ['#007AFF', '#5856D6'],
        image: 'https://images.unsplash.com/photo-1574680150243-e451cd173563?w=800',
        routines: [
            {
                name: 'Heavy Abs',
                exercises: [
                    { name: 'Cable Crunch', sets: 5, reps: 10 },
                    { name: 'Weighted Sit-Up', sets: 4, reps: 12 },
                    { name: 'Landmine Rotation', sets: 4, reps: 10 },
                    { name: 'Dumbbell Side Bend', sets: 3, reps: 15 }
                ]
            }
        ]
    },
    {
        id: 'core-bulletproof-back',
        name: 'Bulletproof Back & Core',
        description: 'Strengthen the posterior chain to prevent injury and improve posture.',
        type: 'Core',
        level: 'All',
        muscles: ['Lower Back', 'Glutes'],
        gradient: ['#34C759', '#248A3D'],
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        routines: [
            {
                name: 'Posterior Chain',
                exercises: [
                    { name: 'Hyperextension', sets: 3, reps: 15 },
                    { name: 'Bird Dog', sets: 3, reps: 12 },
                    { name: 'Superman', sets: 3, reps: 15 },
                    { name: 'Plank', sets: 3, reps: 60 }
                ]
            }
        ]
    },
    {
        id: 'core-hiit-blaster',
        name: 'HIIT Core Blaster',
        description: 'Cardio fused with intense abdominal work.',
        type: 'Core',
        level: 'Intermediate',
        muscles: ['Abs', 'Cardio'],
        gradient: ['#FF3B30', '#FF9500'],
        image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800',
        routines: [
            {
                name: 'Sweat & Shred',
                exercises: [
                    { name: 'Mountain Climbers', sets: 4, reps: 40 },
                    { name: 'Bicycle Crunch', sets: 4, reps: 30 },
                    { name: 'Burpee', sets: 4, reps: 15 },
                    { name: 'Jump Rope', sets: 4, reps: 60 }
                ]
            }
        ]
    }
];
