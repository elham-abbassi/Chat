import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import useImage from "use-image";
import "../styles/AvatarPage.css";

const AvatarPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const stageRef = useRef(null);
  const [konvaImage] = useImage(uploadedImage);
  const [editedImage, setEditedImage] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [operations, setOperations] = useState({
    remove_bg: false,
    enhance_face: false,
    colorize: false
  });

  useEffect(() => {
    if (location.state?.uploadedImage) {
      setUploadedImage(location.state.uploadedImage);
    }
    if (location.state?.selectedFile) {
      setSelectedFile(location.state.selectedFile);
    }
  }, [location.state]);

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleCheckboxChange = (e) => {
    setOperations({ ...operations, [e.target.name]: e.target.checked });
  };

  const handleApplyEdits = async () => {
    const selectedOps = Object.entries(operations)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(",");

    if (!selectedFile || !selectedOps) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("operations", selectedOps);

    setLoadingEdit(true);
    try {
      const response = await fetch("http://localhost:8000/edit_photo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setEditedImage(data.edited_image);
    } catch (error) {
      console.error("Error editing:", error);
      alert("An error occurred while applying edits.");
    }
    setLoadingEdit(false);
  };

  const handleUseEditedImage = () => {
    navigate("/avatar", {
      state: {
        uploadedImage: editedImage,
        selectedFile: selectedFile
      }
    });
  };

 const handleSaveAndGoHome = async () => {
  if (!editedImage) {
    alert("No edited image to save.");
    return;
  }

  try {
    const response = await fetch(editedImage); 
    const blob = await response.blob();
    const fileName = "edited_image.png";
    const file = new File([blob], fileName, { type: blob.type });

    navigate("/", {
      state: {
        uploadedImage: URL.createObjectURL(file), 
        selectedFile: file                       
      }
    });
  } catch (error) {
    console.error("Error preparing file to go home:", error);
    alert("Failed to save the image.");
  }
};



  const handleGenerateAvatar = async () => {
    if (!selectedFile && !prompt) {
      alert("You need to upload an image or enter a prompt.");
      return;
    }

    setLoading(true);
    setAvatarUrl(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    formData.append("prompt", prompt);

    try {
      const response = await fetch("http://localhost:8000/generate_avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("Error generating avatar: " + (errorData.detail || "Unknown error"));
        return;
      }

      const data = await response.json();
      setAvatarUrl(data.edited_image);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleRemoveObject = async () => {
    if (!stageRef.current || !selectedFile) return;

    const uri = stageRef.current.toDataURL({ mimeType: "image/png" });
    const maskBlob = await (await fetch(uri)).blob();

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mask", maskBlob, "mask.png");
    formData.append("operations", "remove_object");

    setLoadingRemove(true);
    try {
      const response = await fetch("http://localhost:8000/edit_photo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setEditedImage(data.edited_image);
    } catch (error) {
      console.error("Error editing:", error);
      alert("An error occurred while editing the photo.");
    }
    setLoadingRemove(false);
  };


  return (
    <div className="avatar-page">
      <h1> Create Your AI Avatar</h1>

      {/* General Edit Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="section-box">
          <h2> General Edit Options</h2>
          <div className="flex flex-col gap-2 mb-4">
            <label>
              <input type="checkbox" name="remove_bg" checked={operations.remove_bg} onChange={handleCheckboxChange} /> Remove Background
            </label>
            <label>
              <input type="checkbox" name="enhance_face" checked={operations.enhance_face} onChange={handleCheckboxChange} /> Enhance Face
            </label>
            <label>
              <input type="checkbox" name="colorize" checked={operations.colorize} onChange={handleCheckboxChange} /> Colorize
            </label>
          </div>
          <button onClick={handleApplyEdits} className="generate-btn">
            {loadingEdit ? "Processing Edits..." : "Apply Selected Edits"}
          </button>
          {editedImage && (
            <div className="mt-6 text-center">
              <div className="mt-4 text-center">
                <img src={editedImage} alt="Edited Result" className="rounded-xl max-w-full mx-auto mb-4" />
                <button onClick={handleUseEditedImage} className="generate-btn mr-2"> Save & Continue Editing</button>
                <button onClick={handleSaveAndGoHome} className="finish-btn"> Save & Return Home</button>
              </div>
            </div>
          )}
        </div>

          {/* Object Removal */}
        <div className="section-box">
          <h2> Draw to Remove Object (Inpainting)</h2>
          {uploadedImage && konvaImage && (
            <Stage
              width={konvaImage.width}
              height={konvaImage.height}
              ref={stageRef}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
            >
              <Layer>
                <KonvaImage image={konvaImage} />
              </Layer>
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="white"
                    strokeWidth={20}
                    tension={0.5}
                    lineCap="round"
                    globalCompositeOperation="source-over"
                  />
                ))}
              </Layer>
            </Stage>
          )}

          <button onClick={handleRemoveObject} className="generate-btn mt-4">
             {loadingRemove ? "Removing Object..." : "Remove Selected Object"}
          </button>

          {editedImage && (
            <div className="mt-6 text-center">
              <h2 className="text-lg font-semibold">Edited Image:</h2>
              <img src={editedImage} alt="Edited" className="rounded-xl mt-3 mx-auto max-w-full" />
              <button onClick={handleSaveAndGoHome} className="finish-btn">Save & Return Home</button>
            </div>
          )}
        </div>

        <div className="section-box">
          <h2> Generate Avatar from Prompt Only</h2>
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="e.g. A smiling girl in futuristic armor"
            rows={5}
          />
          <button
            className="generate-btn"
            onClick={handleGenerateAvatar}
            disabled={loading || !prompt}
          >
            {loading ? "Generating..." : "Generate from Prompt"}
          </button>
        </div>
      </div>

      {avatarUrl && (
        <div className="text-center mt-6">
          <h2>Your Avatar:</h2>
          <img
            key={avatarUrl}
            src={avatarUrl}
            alt="Generated Avatar"
            className="generated-avatar"
          />
          <button className="finish-btn" onClick={() => navigate("/")}>
             Finish & Use Avatar
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarPage;
