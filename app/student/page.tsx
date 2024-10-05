"use client";
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { RegisterDialog } from "@/components/ui/local/RegisterDialog";
import { Angry, Meh, Smile } from "lucide-react";
import Image from "next/image";

const availableExpressions = [
  "neutral",
  "angry",
  "happy",
  "surprised",
] as const;

const Student = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [expressionStates, setExpressionStates] = useState({
    neutral: false,
    angry: false,
    happy: false,
    surprised: false,
  });
  const [expressionDescriptors, setExpressionDescriptors] = useState({
    neutral: null,
    angry: null,
    happy: null,
    surprised: null,
  });
  const [hasAllExpressions, setHasAllExpressions] = useState([
    false,
    false,
    false,
    false,
  ]);
 

  const [isDialogOpen, setDialogOpen] = useState(false);
  const inputSize = 512;
  const scoreThreshold = 0.5;

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      startVideo();
    };

    const startVideo = async () => {
      try {
        // Request the video stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });

        // Ensure the videoRef is valid
        if (videoRef.current) {
          // Stop any existing video tracks if they are present
          const existingStream = videoRef.current.srcObject;
          if (existingStream) {
            const tracks = existingStream.getTracks();
            tracks.forEach((track) => track.stop());
          }

          // Set the new video stream
          videoRef.current.srcObject = stream;

          // Play the video
          await videoRef.current.play(); // Await play to catch any errors
          detectFaceExpressions(); // Start detecting face expressions
        }
      } catch (error) {
        console.error("Error accessing webcam: ", error);
      }
    };

    const detectFaceExpressions = async () => {
      const videoEl = videoRef.current;
      const canvas = canvasRef.current;

      if (videoEl && !videoEl.paused && !videoEl.ended) {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize,
          scoreThreshold,
        });

        const detection = await faceapi
          .detectSingleFace(videoEl, options)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();

        if (detection && canvas) {
          const dims = faceapi.matchDimensions(canvas, videoEl, true);
          const resizedDetection = faceapi.resizeResults(detection, dims);

          const minConfidence = 0.8;

          Object.keys(resizedDetection.expressions).forEach((key) => {
            const expressionKey = key as keyof typeof expressionStates;

            if (
              availableExpressions.includes(expressionKey) &&
              resizedDetection.expressions[expressionKey] > minConfidence
            ) {
              const expressionIndex =
                availableExpressions.indexOf(expressionKey);

              if (!hasAllExpressions[expressionIndex]) {
                setHasAllExpressions((prev) => {
                  const newHasAllExpressions = [...prev];
                  newHasAllExpressions[expressionIndex] = true;

                  if (newHasAllExpressions.every(Boolean)) {
                    console.log("All expressions detected!");
                    setDialogOpen(true);
                  }

                  return newHasAllExpressions;
                });

                setExpressionStates((prev) => ({
                  ...prev,
                  [expressionKey]: true,
                }));

                setExpressionDescriptors((prev) => ({
                  ...prev,
                  [expressionKey]: resizedDetection.descriptor,
                }));

                // console.log(
                //   "Descriptor updated to:",
                //   resizedDetection.descriptor
                // );
              }
            }
          });

          const drawBox = new faceapi.draw.DrawBox(
            resizedDetection.detection.box,
            { label: "User" }
          );
          drawBox.draw(canvas);
        }

        requestAnimationFrame(detectFaceExpressions);
      } else {
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    loadModels();
  }, [hasAllExpressions]);

  return (
    <div className="flex">
      <div className="flex-grow bg-gray-200 relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
      <div className="flex flex-col justify-evenly h-screen w-[10vw] bg-white border-l border-gray-300 items-center">
        <span className="flex flex-col gap-2 items-center">
          <Meh
            aria-label="neutral"
            className={`w-10 h-10 ${
              expressionStates.neutral
                ? "text-gray-700 rounded-full bg-gray-700"
                : "text-gray-500"
            }`}
          />
          Neutral
        </span>
        <span className="flex flex-col gap-2 items-center">
          <Angry
            aria-label="angry"
            className={`w-10 h-10  ${
              expressionStates.angry
                ? "text-red-500 rounded-full bg-red-500"
                : "text-gray-500 rounded-full"
            }`}
          />
          Angry
        </span>
        <span className="flex flex-col gap-2 items-center">
          <Smile
            aria-label="happy"
            className={`w-10 h-10 ${
              expressionStates.happy
                ? "text-green-500 rounded-full bg-green-500"
                : "text-gray-500 rounded-full"
            }`}
          />
          Happy
        </span>
        <span className="flex flex-col gap-2 items-center">
          <Image
            alt="surprised"
            width={20}
            height={20}
            src="/surprised.svg"
            aria-label="surprised"
            className={`w-8 h-8  ${
              expressionStates.surprised
                ? "text-yellow-500 bg-yellow-500 rounded-full border-yellow-500 border-2"
                : "border-gray-500 border-2 text-gray-500 rounded-full"
            }`}
          />
          Surprised
        </span>
      </div>
      <RegisterDialog
        faceData={expressionDescriptors}
        // expressionDescriptors={}
        open={isDialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
      />
    </div>
  );
};

export default Student;
