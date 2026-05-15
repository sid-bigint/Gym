import { useState, useCallback } from 'react';

export function useUndoDelete<T>() {
    const [lastDeletedItem, setLastDeletedItem] = useState<T | null>(null);

    const storeDeletedItem = useCallback((item: T) => {
        setLastDeletedItem(item);
    }, []);

    const clearLastDeleted = useCallback(() => {
        setLastDeletedItem(null);
    }, []);

    return {
        lastDeletedItem,
        storeDeletedItem,
        clearLastDeleted
    };
}
