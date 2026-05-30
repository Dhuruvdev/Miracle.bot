import { createContext, useContext, useState, ReactNode } from 'react';

export type ButtonActionType = 'reply' | 'ephemeral' | 'channel';

export type ButtonAction = {
    type: ButtonActionType;
    content: string;
};

type ButtonActionsContextType = {
    actions: Record<string, ButtonAction>;
    setAction: (customId: string, action: ButtonAction | null) => void;
};

const ButtonActionsContext = createContext<ButtonActionsContextType>({
    actions: {},
    setAction: () => {},
});

function loadFromStorage(): Record<string, ButtonAction> {
    try {
        return JSON.parse(localStorage.getItem('discord.builders__buttonActions') || '{}');
    } catch {
        return {};
    }
}

export function ButtonActionsProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<Record<string, ButtonAction>>(loadFromStorage);

    const setAction = (customId: string, action: ButtonAction | null) => {
        setActions(prev => {
            const next = { ...prev };
            if (action === null) {
                delete next[customId];
            } else {
                next[customId] = action;
            }
            localStorage.setItem('discord.builders__buttonActions', JSON.stringify(next));
            return next;
        });
    };

    return (
        <ButtonActionsContext.Provider value={{ actions, setAction }}>
            {children}
        </ButtonActionsContext.Provider>
    );
}

export function useButtonActions() {
    return useContext(ButtonActionsContext);
}
