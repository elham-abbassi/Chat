import React, { useState, useEffect } from "react";
import { useVoice } from "../context/VoiceContext";
import "../styles/HomePage.css";
import { useLocation, useNavigate } from "react-router-dom";
import { uploadDocument, scrapeWebsite } from "../services/documents";
import logo from "../assets/logo.png";

const HomePage = () => {
  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const { voiceId, setVoiceId } = useVoice();
  const [voiceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const location = useLocation();
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (location.state?.selectedFile) {
      setSelectedFile(location.state.selectedFile);
    }
  }, [location.state]);

  

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert("File is too large. Please upload a smaller file.");
      return;
    }
    console.log(
      "File selected:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );
    setSelectedFile(file);
  };

  const handleVoiceNameChange = (event) => {
    setVoiceName(event.target.value);
  };

  const handleUrlSubmit = async () => {
  if (!urlInput) return;
  setLoading(true);
  try {
    const res = await scrapeWebsite(urlInput);
    localStorage.setItem("documentUploaded", "true");
    setSessionId(res.session_id);
    console.log("Scrape succeeded:", res);
    alert(res.message || "Website content loaded successfully!");

  } catch (err) {
    console.error("Scrape error:", err);
    alert("Failed to load website.");
  } finally {
    setLoading(false);
  }
};


const handleFileUpload = async () => {
  if (!selectedFile) return;
  setLoading(true);

    try {
      const res = await uploadDocument(selectedFile);
      localStorage.setItem("documentUploaded", "true");
      
      setSessionId(res.session_id);
      console.log("Upload succeeded:", res);
      alert(res.message || "Document uploaded and processed!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Document upload failed. See console for details.");
    } finally {
      setLoading(false);
  }
};

  const handleUpload = async () => {
    if (!selectedFile && !voiceName.trim()) {
      alert("Please enter a voice name or upload a voice file.");
      return;
    }

    if (!selectedFile && voiceName.trim()) {
      
      try {
        const response = await fetch(
          `http://localhost:8000/get-voice/${voiceName}`
        );
        const data = await response.json();
        setVoiceId(data.voice_id);
        setSuccessMessage(`Using existing voice: ${data.voice_id}`);
        return;
      } catch {
        alert("Voice not found. Please upload a new voice file.");
        return;
      }
    }

    setIsUploading(true);
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("voice_name", voiceName?.trim() || "Cloned Voice");

    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    try {
      console.log("Sending request to backend...");

      const response = await fetch("http://localhost:8000/clone-voice", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        console.error("Non-JSON response:", response);
        alert("Server error! Please check the backend logs.");
        return;
      }

      if (!response.ok) {
        console.error("Server error:", data);
        alert(`Error: ${JSON.stringify(data, null, 2)}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Cloned Voice ID:", data.voice_id);
      setVoiceId(data.voice_id);
      setSuccessMessage(
        `Voice cloned successfully! Voice ID: ${data.voice_id}`
      );
    } catch (error) {
      console.error("Error cloning voice:", error);

      if (error.message.includes("Failed to fetch")) {
        setSuccessMessage(
          "Error: Unable to connect to the server. Please check if the backend is running."
        );
      } else {
        setSuccessMessage(`Error: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Avatar generation
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));

      const base64 = await toBase64(file);
      setBase64Image(base64);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // this converts file to base64
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
  });

  const generateAvatar = async () => {
    if (!selectedImage) {
        alert("Please upload an image first.");
        return;
      }
      navigate("/avatar", {
        state: { uploadedImage: previewUrl, selectedFile: selectedImage },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let base64Image = null;

      if (selectedImage) {
        try {
          base64Image = await toBase64(selectedImage);
        } catch (error) {
          console.error("Image conversion error:", error);
          alert("Failed to convert image.");
          return;
        }
      }
  
    navigate("/chat", {
      state: {
        name,
        persona,
        voiceFile,
        userId: voiceName,
        selectedFile: selectedImage,
        uploadedImage: uploadedImage,
      },
    });
  };

  return(
  <div className="homepage">
    <div className="welcome">
      <img src={logo} alt="Mentora Logo" className="logo-small" />
      <h1 >Welcome to Mentora</h1>
    </div>
  <form onSubmit={handleSubmit}>
    {/* User Info */}
    <div className="section">
      <label>Your Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>Persona (Who do you want to chat with?):
        <input
          type="text"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          required
        />
      </label>
    </div>

    {/* Voice Clone */}
    <div className="section">
      <h2>Clone a Voice</h2>

      <label>
        Upload Voice Sample:
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
        />
      </label>

      <label>
        Voice Name:
        <input
          type="text"
          placeholder="e.g. PiagetVoice"
          value={voiceName}
          onChange={handleVoiceNameChange}
        />
      </label>

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? "Cloning..." : "Clone Voice"}
      </button>

      {successMessage && <p className="success-msg">{successMessage}</p>}
      {voiceId && <p><strong>Voice ID:</strong> {voiceId}</p>}
    </div>
{/* Knowledge Source */}
    <div className="section">
      <h2>Knowledge Source</h2>

      <label>
        Upload Document (PDF/DOCX/TXT):
        <input type="file" onChange={handleFileChange} />
      </label>
      <button
        type="button"
        onClick={handleFileUpload}
        disabled={!selectedFile || loading}
      >
        Upload Document
      </button>

      <label>
        Or enter website URL:
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://example.com"
        />
      </label>
      <button
        type="button"
        onClick={handleUrlSubmit}
        disabled={!urlInput || loading}
      >
        Fetch Website
      </button>

      {sessionId && (
        <div className="success-msg">
          Source loaded: <strong>{selectedFile?.name || urlInput}</strong>
        </div>
      )}
    </div>

    {/* Avatar Upload */}
    <div className="section">
      <h2>Bot Image (Optional)</h2>
      <label htmlFor="image-upload">Upload a photo:
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </label>
      <label htmlFor="image-upload">Do you need an avatar or edit your photo?</label>
      <button type="button" onClick={generateAvatar}>Edit or Make Avatar</button>
      
    </div>

    <hr />

    <button type="submit">Start Chat</button>
  </form>
</div>

);

};

export default HomePage;
