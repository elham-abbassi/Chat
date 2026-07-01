import React, { useEffect, useRef, useState } from 'react';
import useFaceLandmarks from '../hooks/useFaceLandmarks';


const TalkingPhoto = ({ imageSrc, audioSrc }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const imageRef = useRef();
  const landmarks = useFaceLandmarks(imageRef);
  const audioRef = useRef(null);
  const blinkTimer = useRef(null);
  const mouthTimer = useRef(null);

  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);

    audio.play().catch((err) => console.error("Playback error:", err));
  }, [audioSrc]);

  useEffect(() => {
    if (isSpeaking) {
      mouthTimer.current = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 200);
    } else {
      clearInterval(mouthTimer.current);
      setMouthOpen(false);
    }
    return () => clearInterval(mouthTimer.current);
  }, [isSpeaking]);

  useEffect(() => {
    blinkTimer.current = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 4000);
    return () => clearInterval(blinkTimer.current);
  }, []);

  return (
    <div className="talking-photo-container" style={{ position: 'relative', display: 'inline-block' }}>
      <img
        ref={imageRef}
        src={imageSrc}
        alt="avatar"
        className="avatar-photo"
        style={{
          width: 250,
          height: 250,
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
      {/* Mouth */}
      {landmarks && isSpeaking && (
        <div style={{
          position: 'absolute',
          left: `${landmarks.getMouth()[0].x - 15}px`,
          top: `${landmarks.getMouth()[0].y - 10}px`,
          width: '30px',
          height: mouthOpen ? '18px' : '6px',
          backgroundColor: 'black',
          borderRadius: '50%',
          transition: 'height 0.1s ease-in-out'
        }} />
      )}
      {/* Blink */}
      {blinking && landmarks && (
        <div style={{
          position: 'absolute',
          left: `${landmarks.getLeftEye()[0].x - 10}px`,
          top: `${landmarks.getLeftEye()[0].y - 5}px`,
          width: '20px',
          height: '6px',
          backgroundColor: 'black',
          borderRadius: '10px'
        }} />
      )}
    </div>
  );
};

export default TalkingPhoto;
