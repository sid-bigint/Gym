import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { getDatabase } from '../db/database';
import { format } from 'date-fns';

export class DataExportService {
    static async exportAllDataAsPDF(userId: string) {
        try {
            console.log('Starting full PDF data export for user:', userId);
            const db = await getDatabase();
            
            // 1. Fetch User Profile
            const user = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [userId]);
            
            // 2. Fetch Recent Workouts (Last 20)
            const workouts = await db.getAllAsync<any>(
                'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 20',
                [userId]
            );

            // 3. Fetch Recent Nutrition (Last 10 days)
            const nutrition = await db.getAllAsync<any>(
                `SELECT date, SUM(calories) as calories, SUM(protein) as protein, 
                        SUM(carbs) as carbs, SUM(fats) as fats
                 FROM nutrition_logs 
                 WHERE user_id = ?
                 GROUP BY date 
                 ORDER BY date DESC 
                 LIMIT 10`,
                [userId]
            );

            // 4. Fetch Measurements
            const measurements = await db.getAllAsync<any>(
                'SELECT * FROM progress_measurements WHERE user_id = ? ORDER BY date DESC LIMIT 10',
                [userId]
            );

            // 5. Generate HTML
            const html = this.generateHTMLReport(user, workouts, nutrition, measurements);

            // 6. Generate PDF
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            console.log('PDF created at:', uri);

            // 7. Share PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Export Gym Progress Report',
                    UTI: 'com.adobe.pdf'
                });
            } else {
                throw new Error('Sharing is not available on this device');
            }

            return true;
        } catch (error) {
            console.error('PDF export failed:', error);
            throw error;
        }
    }

    private static generateHTMLReport(user: any, workouts: any[], nutrition: any[], measurements: any[]) {
        const dateStr = format(new Date(), 'MMMM do, yyyy');
        const level = user?.level || 1;
        const rank = level < 5 ? 'Novice Athlete' : level < 10 ? 'Warrior' : level < 25 ? 'Veteran' : 'Elite Titan';

        return `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1F2937; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366F1; padding-bottom: 20px; }
                    .title { font-size: 28px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                    .subtitle { color: #6B7280; font-size: 14px; margin-top: 5px; }
                    
                    .character-card { background: #1F2937; color: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .rank { font-size: 12px; font-weight: 700; color: #FDE68A; text-transform: uppercase; letter-spacing: 1px; }
                    .name { font-size: 24px; font-weight: 800; margin: 5px 0; }
                    .level-badge { background: #F59E0B; padding: 10px 20px; border-radius: 10px; text-align: center; }
                    .level-val { font-size: 24px; font-weight: 900; }
                    .level-label { font-size: 10px; text-transform: uppercase; }

                    .section { margin-bottom: 35px; }
                    .section-title { font-size: 18px; font-weight: 700; border-left: 4px solid #6366F1; padding-left: 12px; margin-bottom: 15px; text-transform: uppercase; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { text-align: left; background: #F9FAFB; padding: 12px; font-size: 12px; color: #4B5563; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
                    td { padding: 12px; font-size: 14px; border-bottom: 1px solid #F3F4F6; }
                    .date-cell { color: #6B7280; font-size: 12px; }
                    
                    .stats-grid { display: flex; gap: 20px; margin-bottom: 20px; }
                    .stat-item { flex: 1; background: #F3F4F6; padding: 15px; border-radius: 10px; }
                    .stat-val { font-size: 18px; font-weight: 700; color: #111827; }
                    .stat-label { font-size: 11px; color: #6B7280; text-transform: uppercase; margin-top: 4px; }
                    
                    .footer { text-align: center; margin-top: 50px; color: #9CA3AF; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Progress Archive</div>
                    <div class="subtitle">Generated on ${dateStr}</div>
                </div>

                <div class="character-card">
                    <div>
                        <div class="rank">${rank}</div>
                        <div class="name">${user?.name || 'Athlete'}</div>
                        <div style="font-size: 13px; color: #9CA3AF;">${user?.goal?.toUpperCase() || 'MAINTAIN'} · ${user?.activity_level?.replace('_', ' ').toUpperCase() || 'ACTIVE'}</div>
                    </div>
                    <div class="level-badge">
                        <div class="level-val">${level}</div>
                        <div class="level-label">Level</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Body Measurements</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-val">${user?.weight || '--'} kg</div>
                            <div class="stat-label">Current Weight</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-val">${user?.target_calories || '--'}</div>
                            <div class="stat-label">Daily Calorie Goal</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-val">${user?.xp || '0'}</div>
                            <div class="stat-label">Total XP</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Recent Training History</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Workout Name</th>
                                <th>Duration</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workouts.map(w => `
                                <tr>
                                    <td class="date-cell">${format(new Date(w.date), 'MMM dd, yyyy')}</td>
                                    <td style="font-weight: 600;">${w.name}</td>
                                    <td>${Math.round(w.duration_seconds / 60)} min</td>
                                    <td style="font-style: italic; color: #6B7280;">${w.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">Recent Nutrition Summary</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Calories</th>
                                <th>Protein</th>
                                <th>Carbs</th>
                                <th>Fats</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${nutrition.map(n => `
                                <tr>
                                    <td class="date-cell">${format(new Date(n.date), 'MMM dd, yyyy')}</td>
                                    <td style="font-weight: 700;">${n.calories} kcal</td>
                                    <td>${n.protein}g</td>
                                    <td>${n.carbs}g</td>
                                    <td>${n.fats}g</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    This report was generated by your Fitness Assistant. Keep pushing your limits!
                </div>
            </body>
        </html>
        `;
    }
}
