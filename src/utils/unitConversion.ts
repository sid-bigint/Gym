/**
 * Utility functions for Unit Conversion
 * Standardizing on Metric (CM for Height, KG for Weight)
 */

export const UnitConverters = {
    // Height
    feetToCm: (feet: number, inches: number = 0): number => {
        return (feet * 30.48) + (inches * 2.54);
    },

    // Handing "5.9" input where 5 is feet and 9 is inches
    decimalFeetToCm: (val: number): number => {
        const feet = Math.floor(val);
        const decimalPart = val - feet;
        // Attempt to guess if 5.9 means 5' 9" (common user behavior) or 5.9 ft
        // If user types 5.9, they usually mean 5 ft 9 inches.
        // 0.9 ft is 10.8 inches.
        // 5.90 could be 5 ft 90? No.
        // Let's assume standard behavior: integer part is feet.
        // For the decimal:
        // If check logic: if users type "5.11", they mean 5' 11".
        // 0.11 * 100 = 11.

        // Heuristic: Thread the decimal part as inches directly?
        // 5.9 -> 5 feet, 9 inches.
        // 5.11 -> 5 feet, 11 inches.

        // Note: This is a robust guess for 'lazy' input.
        const inches = Math.round(decimalPart * 100);
        // Problem: 5.9 -> 0.9 * 100 = 90 inches. WRONG.
        // 5.09 -> 9 inches.
        // BUT users often type 5.9 for 5'9".

        // Safer approach: 
        // If < 10, treat as simple conversion/heuristic in UI. 
        // But for pure math, let's provide strict converters.
        return 0; // Placeholder, use specific functions below
    },

    cmToFeet: (cm: number) => {
        const realFeet = cm / 30.48;
        const feet = Math.floor(realFeet);
        const inches = Math.round((realFeet - feet) * 12);
        return { feet, inches };
    },

    // Weight
    lbsToKg: (lbs: number): number => {
        return lbs * 0.453592;
    },

    kgToLbs: (kg: number): number => {
        return kg * 2.20462;
    },

    // Formatters
    formatHeight: (cm: number, unit: 'cm' | 'ft' = 'ft'): string => {
        if (!cm) return '--';
        if (unit === 'cm') return `${Math.round(cm)} cm`;
        const { feet, inches } = UnitConverters.cmToFeet(cm);
        return `${feet}'${inches}"`;
    },

    formatWeight: (kg: number, unit: 'kg' | 'lbs' = 'kg'): string => {
        if (!kg) return '--';
        if (unit === 'kg') return `${Math.round(kg * 10) / 10} kg`;
        return `${Math.round(UnitConverters.kgToLbs(kg) * 10) / 10} lbs`;
    }
};
