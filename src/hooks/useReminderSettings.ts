import { useEffect, useState } from 'react';
import { isEnabled, setEnabled } from '../services/DailyReminderService';

export function useReminderSettings() {
    const [enabled, setEnabledState] = useState<boolean | null>(null);

    useEffect(() => {
        isEnabled().then(setEnabledState);
    }, []);

    const toggle = async (val: boolean) => {
        setEnabledState(val);
        await setEnabled(val);
    };

    return { enabled, toggle };
}
