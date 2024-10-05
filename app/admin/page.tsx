// @ts-nocheck 
"use client";
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

// Define the face data for each emotion
interface FaceEmotionData {
  [key: string]: number;
}

// Define the structure for the face data
interface FaceData {
  neutral: FaceEmotionData;
  angry: FaceEmotionData;
  happy: FaceEmotionData;
  surprised: FaceEmotionData;
}

// Define the structure for the user data
interface UserData {
  email: string;
  fullName: string;
  faceData: FaceData;
}


const Admin = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faceData, setFaceData] = useState<UserData[]>([]); // Array to hold face descriptors from the database
  const [newDescriptor, setNewDescriptor] = useState<Float32Array | undefined>(
    undefined
  );
  const [foundUsers, setFoundUsers] = useState<string[]>([]); // To track verified users

  const [boxLabel, setBoxLabel] = useState<string>("User"); // To store the label text
  const [boxColor, setBoxColor] = useState<string>("blue"); // To store the box color  const distanceThreshold = 0.6;

  const distanceThreshold = 0.6;
  const inputSize = 512;
  const scoreThreshold = 0.5;

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
      startVideo();
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          detectFace();
        }
      } catch (error) {
        console.error("Error accessing webcam: ", error);
      }
    };

    const detectFace = async () => {
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
          // console.log(resizedDetection.descriptor);
          setNewDescriptor(resizedDetection.descriptor); // Capture the new descriptor

          const drawBox = new faceapi.draw.DrawBox(
            resizedDetection.detection.box,
            { label: `${boxLabel}`, boxColor: `${boxColor}` } // Dynamic label and color
          );
          drawBox.draw(canvas);
        }

        requestAnimationFrame(detectFace);
      }
    };

    // Fetch existing face data from the database
    const fetchFaceData = async () => {
      const response = await fetch("/api/users"); // Your endpoint for fetching face data
      const data = await response.json();
      console.log(data);
      setFaceData(data);
    };

    fetchFaceData(); // Fetch face data on component mount
    loadModels(); // Load face-api.js models
  }, [boxLabel, boxColor]);

  useEffect(() => {
    // Only match face if both newDescriptor and faceData are available
    if (newDescriptor && faceData.length > 0) {
      matchFace();
    }
  }, [newDescriptor, faceData]);

  const labeledDescriptors = faceData
    .map((user) => {
      // Ensure user has valid faceData
      if (user.faceData && Object.keys(user.faceData).length > 0) {
        // Get descriptors for each emotion
        const emotionDescriptors = Object.keys(user.faceData)
          .map((emotion) => {
            const descriptor = Object.values(
              user.faceData[emotion]
            ) as number[]; // Convert descriptor to array

            // Check if the emotion descriptor has 128 values
            if (descriptor.length !== 128) {
              console.error(
                `Descriptor for ${user.fullName} in ${emotion} does not have 128 values!`,
                descriptor
              );
              return null;
            }

            return new Float32Array(descriptor); // Convert to Float32Array and return
          })
          .filter(Boolean); // Filter out any invalid descriptors

        // If we have valid descriptors, return the user's labeled descriptor
        if (emotionDescriptors.length > 0) {
          return {
            label: JSON.stringify(user), // Use the fullName as the label
            descriptors: emotionDescriptors, // Store the array of descriptors (one per emotion)
          };
        }
      }
      return null; // Return null if there are no valid descriptors
    })
    .filter(Boolean);

  let faceMatcher: faceapi.FaceMatcher | null = null;
  // Check if labeledDescriptors is not empty
  if (labeledDescriptors.length > 0) {
    // Create the FaceMatcher instance using the mapped descriptors
    faceMatcher = new faceapi.FaceMatcher(
      labeledDescriptors.map(
        (descriptor) =>
          new faceapi.LabeledFaceDescriptors(
            descriptor.label,
            descriptor.descriptors
          )
      ),
      distanceThreshold
    );
  }

  // Function to match a new face descriptor with stored descriptors
  const matchFace = () => {
    if (newDescriptor && faceMatcher) {
      const bestMatch = faceMatcher.findBestMatch(newDescriptor);
      if (bestMatch.distance < distanceThreshold) {
        // console.log(`Match found: ${bestMatch.label}`);
        const match = JSON.parse(bestMatch.label);
        if (foundUsers.includes(match.email)) {
          // If user is already verified, show toast message
          toast.error(`User ${match.fullName} is already verified.`);
        } else {
          // Add the user to the foundUsers array
          setFoundUsers((prevFoundUsers) => [...prevFoundUsers, match.email]);
          toast.success(`Hi, ${match.fullName}, success in your exams!`);

          // Update box label and color
          setBoxLabel(match.fullName);
          setBoxColor("green");
        }
      } else {
        toast.error("No match found");
        console.log("No match found");
        setBoxLabel("No User");
        setBoxColor("red");
      }
    } else {
      console.log("FaceMatcher or new descriptor is missing");
      setBoxLabel("User");
      setBoxColor("blue");
    }
  };

  const clearState = () => {
    setFoundUsers([]);
    setBoxLabel("User");
    setBoxColor("blue");
    toast.success("State cleared");
  };

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
      <Button
        onClick={clearState}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded mx-2"
      >
        Reset State
      </Button>
    </div>
  );
};

export default Admin;
