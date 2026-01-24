import { useRef, useState } from "react";

interface CameraProps {
  onCapture?: (photoData: string) => void;
}

const CameraWithCapture: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    if (onCapture) {
      onCapture(imageData);
    }

    // You can also download the image
    // const link = document.createElement('a');
    // link.href = imageData;
    // link.download = 'photo.jpg';
    // link.click();
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    stopCamera();
    startCamera(newMode);
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} autoPlay playsInline className="camera-preview" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="camera-controls">
        {!stream ? (
          <button onClick={() => startCamera()}>Start Camera</button>
        ) : (
          <>
            <button onClick={capturePhoto}>Capture</button>
            <button onClick={switchCamera}>
              Switch to {facingMode === "user" ? "Back" : "Front"} Camera
            </button>
            <button onClick={stopCamera}>Stop</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraWithCapture;
