import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'react-toastify';

interface CameraCaptureProps {
    onCapture: (blob: Blob) => void;
    onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [capturing, setCapturing] = useState(false);

    // Camera State
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
    const [isMirrored, setIsMirrored] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Initialize: Enumerate devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = deviceList.filter(device => device.kind === 'videoinput');
                setDevices(videoInputs);
            } catch (error) {
                console.error("Error enumerating devices:", error);
            }
        };
        getDevices();
    }, []);

    // Active Camera Stream Management
    useEffect(() => {
        let isMounted = true;

        const initCamera = async () => {
            try {
                // Stop any existing stream first
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }

                const constraints: MediaStreamConstraints = {
                    video: activeDeviceId
                        ? { deviceId: { exact: activeDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
                };

                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                // Smart Mirroring Check
                const track = mediaStream.getVideoTracks()[0];
                const settings = track.getSettings();
                // If environment (back cam), don't mirror. If user (front) or undefined (pc), mirror.
                setIsMirrored(settings.facingMode !== 'environment');

            } catch (error) {
                if (isMounted) {
                    toast.error('Camera access denied or unavailable.');
                    console.error(error);
                }
            }
        };

        // If we have specific device, or just initial load
        initCamera();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [activeDeviceId]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;

        // Current active ID (either from state or determined from active stream)
        let currentId = activeDeviceId;
        if (!currentId && streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            currentId = track.getSettings().deviceId || null;
        }

        const currentIndex = devices.findIndex(d => d.deviceId === currentId);
        // If not found (e.g. initial load logic differs), default to 0
        const nextIndex = (currentIndex + 1) % devices.length;

        setActiveDeviceId(devices[nextIndex].deviceId);
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
            // Check if we need to flip the image (user mode usually mirrored)
            // But canvas drawing draws the video as is (raw).
            // The video element is mirrored via CSS transform scale-x-[-1] for user mode.
            // If we draw raw, it will be un-mirrored (true self).
            // Usually for selfies people want the mirrored version?
            // Actually, for "proof", true non-mirrored is better for text readability.
            // Let's keep it raw (true image).

            ctx.drawImage(videoRef.current, 0, 0);

            // Generate Freeze Frame Preview
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPreviewImage(dataUrl);

            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob);
                    // Let parent unmount trigger cleanup
                }
            }, 'image/jpeg', 0.9);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col sm:flex-row animate-fade-in">
            {/* Camera Viewport */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
                />

                {/* Freeze Frame Preview */}
                {previewImage && (
                    <div className="absolute inset-0 z-30 animate-[flash_0.1s_ease-out]">
                        <img
                            src={previewImage}
                            className={`w-full h-full object-cover ${isMirrored ? 'transform scale-x-[-1]' : ''}`}
                            alt="Captured"
                        />
                    </div>
                )}

                {/* Framing Guides - Corners */}
                <div className="absolute inset-8 pointer-events-none opacity-50">
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white/80" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white/80" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white/80" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white/80" />
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                        <span className="text-[12rem] font-black text-white animate-pulse drop-shadow-2xl">{countdown}</span>
                    </div>
                )}
            </div>

            {/* Controls Bar - Right side on desktop, Bottom on mobile */}
            <div className="relative z-20 bg-black/80 backdrop-blur-xl sm:w-24 sm:h-full w-full h-32 flex sm:flex-col items-center justify-center gap-8 sm:gap-12 border-t sm:border-t-0 sm:border-l border-white/10 shrink-0">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all"
                    title="Cancel Verification"
                >
                    <X size={24} />
                </Button>

                <button
                    onClick={handleCaptureClick}
                    disabled={capturing}
                    className="w-20 h-20 rounded-full border-[6px] border-white/30 flex items-center justify-center bg-transparent hover:border-white/50 hover:bg-white/5 active:scale-95 transition-all duration-300"
                    title="Take Photo"
                >
                    <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow" />
                </button>

                <Button
                    variant="ghost"
                    onClick={handleSwitchCamera}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all"
                    title="Switch Camera"
                >
                    <RotateCcw size={24} />
                </Button>
            </div>
        </div>,
        document.body
    );
};
