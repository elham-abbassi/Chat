import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useVoice } from "../context/VoiceContext"
import '../styles/ChatPage.css';
import { uploadFileToBackend } from "../services/falUpload";
import { useNavigate } from "react-router-dom";


const ChatPage = () => {
  const location = useLocation();
  const { name, persona, voiceFile, selectedFile } = location.state || { name: 'Guest', persona: 'Unknown', voiceFile: null, selectedFile: uploadedImage};
  const uploadedImage = selectedFile;
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [audioResponse, setAudioResponse] = useState(null);
  const [mode, setMode] = useState("text", "voice");
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [talkingVideoUrl, setTalkingVideoUrl] = useState(null);
  const [userAudioUrl, setUserAudioUrl] = useState('');
  const [language, setLanguage] = useState('en-EN','fr-FR');
  const [chatType, setChatType] = useState("");
  const [customChatType, setCustomChatType] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const chatContainerRef = useRef(null);
  const { voiceId: locationVoiceId } = location.state || {};
  const audioRef = useRef(null);
  const imageRef = useRef();
  const { voiceId: contextVoiceId } = useVoice();
  const finalVoiceId = locationVoiceId || contextVoiceId;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isMicActive, setIsMicActive] = useState(true);
  const navigate = useNavigate();
 




  const predefinedChatTypes = [
    "Educational",
    "Scientific",
    "Historical",
    "Casual",
  ];

  const handleSelect = (event) => {
    setChatType(event.target.value);
    setCustomChatType("");
  };

  
  const handleCustomChatType = () => {
    if (customChatType.trim()) {
      setChatType(customChatType.trim());
    } else {
      alert("Please enter a valid custom chat type.");
    }
  };

  function handleLanguageChange(e) {
    setLanguage(e.target.value);
  }


  const insertCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/set-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert("Custom prompt saved: " + data.message);
    } catch (error) {
      console.error("Error inserting custom prompt:", error);
    }
  };

  {
    /*const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(blob);
        setUserAudioUrl(audioURL);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing microphone for recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const startInteraction = async () => {
    await startRecording();
    SpeechRecognition.startListening({ continuous: true, language: language });
  };

  {/*const stopInteraction = () => {
    stopRecording();
    SpeechRecognition.stopListening();
  };

  const sendMessage = async (msg) => {
    try {
      const payload = { message: msg, persona, voiceFile, chatType, customPrompt, voice_id: voiceId || null, language };
      
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const botAudioUrl = data.audio_url.startsWith("http")
      ? data.audio_url
      : `http://localhost:5000${data.audio_url}`;
      console.log("Response data:", data); 

      setChatHistory((prev) => [
        ...prev,
        { sender: "user", message: msg },
        { sender: "bot", message: data.response},
        
      ]);
      console.log("Response data:", data); 
      console.log("Bot audio URL:", botAudioUrl);
      setAudioResponse(botAudioUrl);
      
      const audio = new Audio(botAudioUrl);
      await audio.play();

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Something went wrong. Please try again.");
    }
  };*/
  }

  

  const handleSend = async (msg) => {
  if (!msg.trim()) return;

  console.log("🧠 Transcript before send:", transcript);
  console.log("🎙️ Listening state (is mic active?):", SpeechRecognition);
  

  setChatHistory((prev) => [...prev, { sender: 'user', message: msg }]);
  setUserMessage("");
  setIsLoading(true);

  let fallback_allowed = true;
  const payload = {
    message: msg,
    persona,
    voice_id: finalVoiceId || undefined,
    chat_type: chatType || 'General',
    custom_prompt: customPrompt || '',
    language,
    fallback_allowed
  };

  const useDocument = localStorage.getItem("documentUploaded") === "true";
  const endpoint = useDocument ? "/chat-document/" : "/chat";

  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.context_warning) {
      const confirm = window.confirm(
        "This document seems unrelated to your question. Do you want an answer from general knowledge?"
      );
      if (!confirm) return; 
    }

    setChatHistory((prev) => [...prev, { sender: 'bot', message: data.response }]);
    

    const botAudioUrl = data.audio_url ? `http://localhost:8000${data.audio_url}?t=${Date.now()}` : null;
    let videoGenerated = false;

    if (botAudioUrl && selectedFile) {
      try {
        const audioBlob = await fetch(botAudioUrl).then(res => res.blob());
        const audioFile = new File([audioBlob], "response.mp3", { type: "audio/mpeg" });
        const audioUrl = await uploadFileToBackend(audioFile, "upload-audio");
        const imageUrl = await uploadFileToBackend(selectedFile, "upload-image");

        const sadTalkerResult = await fetch("http://localhost:8000/proxy-fal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-fal-target-url": "https://fal.run/fal-ai/sadtalker"
          },
          body: JSON.stringify({
            source_image_url: imageUrl,
            driven_audio_url: audioUrl,
            preprocess_type: "full",
            still: false,
            use_enhancer: true
          })
        });

        const result = await sadTalkerResult.json();
        const videoUrl = result?.video?.url;

        if (videoUrl) {
          setTalkingVideoUrl(videoUrl);
          setAudioResponse(null);  
          videoGenerated = true;
          setIsLoading(false);
          console.log("SadTalker video URL:", videoUrl);
        } else {
          console.warn("SadTalker did not return a video");
        }
      } catch (videoErr) {
        console.error("Video generation failed:", videoErr);
      }
    }


    if (!videoGenerated && botAudioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(botAudioUrl);
      audioRef.current = audio;
      setAudioResponse(botAudioUrl);

      SpeechRecognition.stopListening();
      setIsSpeaking(true);

      await audio.play();

      audio.onended = () => {
        setIsSpeaking(false);
        SpeechRecognition.startListening({ continuous: true, language });
        setIsLoading(false);
      };
    }

  } catch (err) {
    console.error("Error sending message:", err);
  }
};


  
  const handleTextSubmit = (e) => {
    e.preventDefault();
    handleSend(userMessage);
  };

  const handleVoiceSubmit = () => {
    if (transcript.trim()) {
      handleSend(transcript);
      resetTranscript();
    } else {
      console.warn("Transcript is empty, not sending message.");
    }
  };

  const handleRefreshChat = () => {
    setChatHistory([]);
    setUserMessage("");
    resetTranscript();
    setAudioResponse(null);
    setUserAudioUrl(null);
    setCustomPrompt("");
    setChatType("");
  };


let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.continuous = true;
recognition.lang = "fr-FR"; 

const toggleMicrophone = () => {
  if (isMicActive) {
    SpeechRecognition.stopListening();
    setIsMicActive(false);
    console.log("Microphone paused");
  } else {
    SpeechRecognition.startListening({ continuous: true, language });
    setIsMicActive(true);
    console.log("Microphone resumed");
  }
}


  useEffect(() => {
    if (audioResponse) {
      const audio = new Audio(audioResponse);
      console.log("Trying to play:", audioResponse);
      audio.play().catch((err) => console.error("Playback error:", err));
    }

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Your browser does not support speech recognition.");
    }
  }, [audioResponse]);

  useEffect(() => {
    if (uploadedImage instanceof File) {
      const fileUrl = URL.createObjectURL(uploadedImage);
      setImageUrl(fileUrl);
    } else if (typeof uploadedImage === "string") {
      setImageUrl(uploadedImage); 
    }
  }, [uploadedImage]);

  

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Your browser does not support speech recognition.");
      return;
    }
    SpeechRecognition.startListening({ continuous: true, language });
    SpeechRecognition.startListening({ continuous: true, language });
    console.log("Microphone started with language:", language);
  }, [language]);


  useEffect(() => {
    if (transcript.trim()) {
      console.log("Sending transcript:", transcript);
      const timeout = setTimeout(() => {
        handleSend(transcript);
        resetTranscript();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [transcript]);

  const handleBackToHome = () => {
  
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  setTalkingVideoUrl(null);
  setAudioResponse(null);
  localStorage.removeItem("documentUploaded");

  navigate("/");
};

useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
}, []);




  return (
<div className="chatpage">
  <h1 className="chatpage-title">Chat with {persona}</h1>
  <p className="chatpage-subtitle">Welcome, {name}</p>

  <div className="chat-controls">
    {/* Language Selection */}
    <div className="section">
      <label htmlFor="language">Language:</label>
      <select id="language" value={language} onChange={handleLanguageChange}>
        <option value="en-US">English</option>
        <option value="fr-FR">French</option>
      </select>
    </div>

    {/* Chat Type */}
    <div className="section">
      <h2>Chat Type</h2>
      <select onChange={handleSelect}>
        <option value="" disabled>Select a chat type</option>
        {predefinedChatTypes.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      {/* Custom chat type */}
      <input
        type="text"
        placeholder="Custom chat type..."
        value={customChatType}
        onChange={(e) => setCustomChatType(e.target.value)}
      />
      <button onClick={handleCustomChatType}>Use Custom Type</button>
    </div>

    {/* Custom Prompt */}
    <div className="section">
      <h2>Modify AI Prompt</h2>
      <textarea
        rows="4"
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder="Enter a detailed custom prompt..."
      />
      <button onClick={insertCustomPrompt}>Insert Custom Prompt</button>
    </div>

    <div className="chat-buttons">
      <button onClick={handleRefreshChat}> Refresh Chat</button>
      <button onClick={toggleMicrophone}>
        {isMicActive ? "🔇 Pause Mic" : "🎙️ Resume Mic"}
      </button>
    </div>
  </div>

  {/* Chat history */}
  <div className="chat-history">
    {chatHistory.map((chat, i) => (
      <p key={i}>
        <strong>{chat.sender === "user" ? "You" : "Bot"}:</strong> {chat.message}
      </p>
    ))}
  </div>

  {/* Chat input */}
  <form onSubmit={handleTextSubmit} className="chat-input">
    <input
      type="text"
      value={userMessage}
      onChange={(e) => setUserMessage(e.target.value)}
      placeholder="Type or speak your question..."
    />
    <button type="submit">Send</button>
  </form>

  {/* Transcript */}
  <p className="transcript"><strong>Transcript:</strong> {transcript}</p>
  
  {isLoading && (
    <div className="loading-indicator">
    <p>Generating response... Please wait</p>
    </div>
  )}

  {/* Video or audio bot response */}
  {talkingVideoUrl && (
    <div className="talking-video-preview">
      <h3>Bot Video Response</h3>
      <video
        src={talkingVideoUrl}
        autoPlay
        onPlay={() => {
          SpeechRecognition.stopListening();
          setIsSpeaking(true);
        }}
        onEnded={() => {
          setIsSpeaking(false);
          SpeechRecognition.startListening({ continuous: true, language });
        }}
        loop={false}
        muted={false}
        controls
      />
    </div>
  )}

  {audioResponse && !talkingVideoUrl && (
    <div className="audio-response">
      <h4>🔊 Bot Response (Audio)</h4>
      <audio src={audioResponse} controls autoPlay />
    </div>
  )}

  {/* Back button */}
  <button className="back-button" onClick={handleBackToHome}>⬅ Back to Home</button>
</div>

  );
};

export default ChatPage;
