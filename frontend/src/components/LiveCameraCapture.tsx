"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  SwitchCamera,
  Layers,
  ZoomIn,
} from "lucide-react";
import { classifyImagePixels } from "@/lib/visionClassifier";

interface LiveCameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onCancel?: () => void;
  category?: string;
  title?: string;
}

export default function LiveCameraCapture({
  onCapture,
  onCancel,
  category = "auto_detect",
  title = "Live Camera Scanner",
}: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scopePreview, setScopePreview] = useState<{ isAgriRelated: boolean; message: string; domain: string } | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Check available devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Stop active camera stream tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Live camera is not supported on this browser. Please use Chrome, Edge, Safari, or Firefox.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((err) => {
          console.warn("Video play error:", err);
        });
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let errorMsg = "Could not access the camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera permission was denied. Please allow camera permissions in your browser bar.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera found on this device. Please connect a webcam or use file upload.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera is already in use by another app. Please close other camera tabs.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
      setCameraLoading(false);
    }
  }, [facingMode, stream]);

  // Initialize camera on mount and when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup tracks on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Capture frame to canvas
  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = canvasRef.current || document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror image if using front selfie camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const base64 = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(base64);

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const result = classifyImagePixels(imgData.data, width, height, "live_scan.jpg", category);
      setScopePreview({
        isAgriRelated: result.isAgriRelated,
        message: result.message,
        domain: result.metrics.dominantDomain,
      });
    } catch {
      // ignore
    }

    // Stop active camera stream while reviewing
    stopStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScopePreview(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      stopStream();
      onCapture(capturedImage);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Helper guidance text based on category
  const getHelperText = () => {
    switch (category) {
      case "land_record":
        return "Position land document flat inside the green frame";
      case "crop_disease":
        return "Hold camera close and focus on affected leaves or pest";
      case "soil_health":
        return "Center the Soil Health Card table and values";
      case "identity_card":
        return "Align your Aadhaar or Farmer ID card in frame";
      default:
        return "Align document or crop inside the viewfinder and hold steady";
    }
  };

  return (
    <div className="flex flex-col items-center w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 text-white relative">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header bar */}
      <div className="w-full bg-stone-950/90 px-4 py-3 flex items-center justify-between border-b border-stone-800 z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
            {capturedImage ? "Photo Preview" : "Live Web Viewfinder"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasMultipleCameras && !capturedImage && (
            <button
              onClick={toggleCamera}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1 px-2.5"
              title="Flip camera"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Flip</span>
            </button>
          )}

          {onCancel && (
            <button
              onClick={() => {
                stopStream();
                onCancel();
              }}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Close camera"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Viewport / Video Area */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
        {/* Shutter flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 animate-out fade-out" />
        )}

        {/* Live Video Feed */}
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />
        )}

        {/* Captured Snapshot Review */}
        {capturedImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured from live camera"
              className="w-full h-full object-contain bg-black"
            />
            {scopePreview && (
              <div className="absolute top-4 inset-x-4 flex justify-center pointer-events-none z-20">
                {scopePreview.isAgriRelated ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs font-black shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    In Scope: {scopePreview.domain}
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/50 text-xs font-black shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    May Be Out of Scope: {scopePreview.domain}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scanning & Alignment Overlays (when live) */}
        {!capturedImage && !cameraError && !cameraLoading && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
            {/* Corner Alignment Reticle */}
            <div className="relative w-full h-full max-w-md max-h-[85%] border-2 border-emerald-400/40 rounded-2xl flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated laser scanline */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-laser" />

              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-emerald-400/30 text-[11px] font-bold text-emerald-300">
                Llama 3.2 Live View
              </div>
            </div>

            {/* Helper text badge */}
            <div className="bg-stone-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-stone-700 text-xs text-stone-200 font-semibold shadow-lg text-center max-w-sm">
              {getHelperText()}
            </div>
          </div>
        )}

        {/* Camera Loading Spinner */}
        {cameraLoading && !cameraError && !capturedImage && (
          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-bold text-stone-300">Initializing live camera stream...</p>
          </div>
        )}

        {/* Camera Error / Permission Blocked Message */}
        {cameraError && !capturedImage && (
          <div className="absolute inset-0 bg-stone-950 p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-stone-100">Camera Access Blocked or Unavailable</h4>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">{cameraError}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition"
                >
                  Upload File Instead
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full bg-stone-950 p-4 sm:p-5 flex items-center justify-center gap-4 border-t border-stone-800">
        {!capturedImage ? (
          /* Live Shutter Controls */
          <div className="flex items-center gap-6">
            <button
              onClick={handleSnap}
              disabled={cameraLoading || !!cameraError}
              className={`group relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition ${
                cameraLoading || cameraError
                  ? "border-stone-700 bg-stone-800 cursor-not-allowed text-stone-600"
                  : "border-white bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
              }`}
              title="Snap Live Photo"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/80 flex items-center justify-center">
                <Camera className="w-6 h-6 text-stone-950 transition" />
              </div>
            </button>
          </div>
        ) : (
          /* Review Controls: Retake vs Confirm */
          <div className="flex items-center gap-3 w-full max-w-md">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>

            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                scopePreview && !scopePreview.isAgriRelated
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{scopePreview && !scopePreview.isAgriRelated ? "Check Scope & Scan" : "Use Photo & Scan"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
