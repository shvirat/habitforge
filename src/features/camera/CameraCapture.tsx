import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'react-toastify';

interface CameraCaptureProps {
    onCapture: (blob: Blob) => void;
    onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            toast.error('Camera access denied or unavailable.');
            console.error(error);
            onCancel();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleCaptureClick = () => {
        setCapturing(true);
        // Random delay between 3 and 7 seconds
        let count = Math.floor(Math.random() * (7 - 3 + 1) + 3);
        setCountdown(count);

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                setCountdown(null);
                takePhoto();
            }
        }, 1000);
    };

    const takePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob); // Pass raw blob, watermark applied later
                    stopCamera();
                }
            }, 'image/jpeg', 0.9);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />

                {/* Countdown Overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <span className="text-9xl font-bold text-white animate-pulse">{countdown}</span>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 items-center">
                    <Button variant="ghost" onClick={onCancel} className="text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 p-0 flex items-center justify-center">
                        <RefreshCw size={20} />
                    </Button>

                    <button
                        onClick={handleCaptureClick}
                        disabled={capturing}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 bg-white rounded-full" />
                    </button>

                    <div className="w-12" /> {/* Spacer for balance */}
                </div>
            </div>
            <p className="text-white/50 mt-4 text-sm">Hold still for the proof.</p>
        </div>
    );
};
