export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const getMealTypeByTime = (): MealType => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    if (hour >= 18 && hour < 23) return 'dinner';
    return 'snack'; // Late night snack
};
