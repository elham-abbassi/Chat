import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function useFaceLandmarks(imageRef) {
  const [landmarks, setLandmarks] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
    };

    const detect = async () => {
      if (imageRef.current) {
        const detection = await faceapi
          .detectSingleFace(imageRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        if (detection) {
          setLandmarks(detection.landmarks);
        }
      }
    };

    loadModels().then(detect);
  }, [imageRef]);

  return landmarks;
}
