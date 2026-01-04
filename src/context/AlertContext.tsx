import React, { createContext, useContext, useState, ReactNode } from 'react';

type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
    isVisible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState<string | undefined>(undefined);
    const [buttons, setButtons] = useState<AlertButton[]>([]);

    const showAlert = (title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) => {
        setTitle(title);
        setMessage(message);
        setButtons(buttons);
        setIsVisible(true);
    };

    const hideAlert = () => {
        setIsVisible(false);
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, isVisible, title, message, buttons }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
