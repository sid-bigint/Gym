/**
 * Dashboard-specific tutorial overlay.
 * Re-exports the shared TutorialOverlay with Dashboard-specific step configs.
 */
export { TutorialOverlay, type TourStepConfig } from './TutorialOverlay';

import { TourStepConfig } from './TutorialOverlay';

// Steps follow the exact top-to-bottom visual order of the Dashboard
export const DASHBOARD_TOUR_STEPS: TourStepConfig[] = [
  {
    title: 'Your Dashboard',
    description: 'This is your fitness hub. See your name, daily streak, and profile at a glance.',
    icon: 'home',
  },
  {
    title: 'Nutrition & Weight',
    description: 'Track your calories, macros, last workout, and log your weight — all in one place.',
    icon: 'restaurant',
  },
  {
    title: 'Muscle Recovery',
    description: 'Your interactive muscle map shows fatigue and recovery levels after each workout.',
    icon: 'body',
  },
  {
    title: 'Track Your Steps',
    description: 'Tap "Health Steps" to sync your daily step count from Google Health Connect. You can track your daily steps right here!',
    icon: 'footsteps',
    interactive: true,
    actionLabel: 'Tap "Health Steps" to try it',
  },
  {
    title: 'Workout History',
    description: 'All your past workouts live here. Head to the Routines tab to start a new session!',
    icon: 'barbell',
  },
];
