import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import AvatarPage from './pages/AvatarPage';
import { AvatarProvider } from "./context/AvatarContext";
import { VoiceProvider } from './context/VoiceContext';

function App() {
  console.log("A-pp is rendering!"); 

  return (
    <VoiceProvider>
      <AvatarProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} /> 
            <Route path="/chat" element={<ChatPage />} /> 
            <Route path="/avatar" element={<AvatarPage />} /> 
          </Routes> 
        </div>
      </AvatarProvider>
    </VoiceProvider>   
  );
}

export default App;