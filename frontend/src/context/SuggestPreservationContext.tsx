import React, { createContext, useCallback, useContext, useState } from 'react';
import { SuggestPreservation } from '../components/SuggestPreservation';

const OpenSuggestContext = createContext<(() => void) | undefined>(undefined);

export function SuggestPreservationProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const openSuggest = useCallback(() => setOpen(true), []);

    return (
        <OpenSuggestContext.Provider value={openSuggest}>
            {children}
            <SuggestPreservation open={open} onClose={() => setOpen(false)} />
        </OpenSuggestContext.Provider>
    );
}

export function useOpenSuggestPreservation(): () => void {
    const open = useContext(OpenSuggestContext);
    return open ?? (() => {});
}
