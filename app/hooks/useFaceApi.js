// hooks/useFaceApi.js
import { useEffect } from 'react';
import * as faceapi from 'face-api.js';

const useFaceApi = (videoRef, canvasRef) => {
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // You need to put your models in the public/models directory
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    };

    loadModels();

    const videoEl = videoRef.current;

    const handleVideoPlay = async () => {
      if (videoEl.paused || videoEl.ended) return;
      const detections = await faceapi.detectAllFaces(videoEl).withFaceLandmarks().withFaceDescriptors();
      const canvas = canvasRef.current;
      faceapi.matchDimensions(canvas, videoEl, true);
      const resizedDetections = faceapi.resizeResults(detections, faceapi.matchDimensions(canvas, videoEl, true));
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      requestAnimationFrame(handleVideoPlay);
    };

    videoEl.addEventListener('play', handleVideoPlay);
    return () => videoEl.removeEventListener('play', handleVideoPlay);
  }, [videoRef, canvasRef]);
};

export default useFaceApi;
