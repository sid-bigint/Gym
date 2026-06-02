import Papa from 'papaparse';

export interface ParsedExercise {
  name: string;
  targetSets: number;
  targetReps: number;
}

export function parseRoutineCSV(csvString: string): Promise<ParsedExercise[]> {
  return new Promise<ParsedExercise[]>((resolve, reject) => {
    Papa.parse(csvString.trim(), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data.map((row: any) => {
            // Flexible matching for headers like 'Exercise', 'Exercise Name', 'Name', etc.
            const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('exercise') || k.toLowerCase().includes('name'));
            const setsKey = Object.keys(row).find(k => k.toLowerCase().includes('set'));
            const repsKey = Object.keys(row).find(k => k.toLowerCase().includes('rep'));

            const name = nameKey ? row[nameKey] : Object.values(row)[0];
            const targetSets = setsKey ? parseInt(row[setsKey] as string, 10) : 3;
            const targetReps = repsKey ? parseInt(row[repsKey] as string, 10) : 10;

            if (!name) throw new Error("Could not find exercise name in row");

            return {
              name: String(name).trim(),
              targetSets: isNaN(targetSets) ? 3 : targetSets,
              targetReps: isNaN(targetReps) ? 10 : targetReps,
            };
          });

          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

// Fallback manual parser for pasted text (if user just pastes lines like "Bench Press 3x10")
export function parseRoutineTextBulk(text: string): ParsedExercise[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const parsed: ParsedExercise[] = [];

  for (const line of lines) {
    // Basic regex to find patterns like "Bench Press 3x10" or "Squat 4 sets 8 reps"
    const match = line.match(/(.*?)(?:(\d+)\s*(?:x|sets|set)\s*(\d+))?/i);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[,:]$/, ''); // remove trailing punctuation
      if (name) {
        parsed.push({
          name: name,
          targetSets: match[2] ? parseInt(match[2], 10) : 3,
          targetReps: match[3] ? parseInt(match[3], 10) : 10,
        });
      }
    }
  }

  return parsed;
}
