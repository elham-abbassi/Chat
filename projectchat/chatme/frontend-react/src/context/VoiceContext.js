import React from 'react';
import { createContext, useContext, useState } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [voiceId, setVoiceId] = useState(null);
    return (
        <VoiceContext.Provider value={{ voiceId, setVoiceId }}>
          {children}
        </VoiceContext.Provider>
    );
};
    
export const useVoice = () => useContext(VoiceContext);
