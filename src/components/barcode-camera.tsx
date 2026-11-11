"use client";

import { Camera, CameraOff, ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<BarcodeResult[]>;
};
type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type BrowserWindow = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

export function BarcodeCamera({
  onDetected,
}: {
  onDetected(value: string): void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const browserWindow = window as BrowserWindow;
    const timeout = setTimeout(() => {
      setSupported(
        Boolean(
          browserWindow.BarcodeDetector && navigator.mediaDevices?.getUserMedia,
        ),
      );
    }, 0);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }

  async function start() {
    const Detector = (window as BrowserWindow).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera barcode scanning is not supported in this browser.");
      return;
    }

    try {
      setStatus("Requesting camera access…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) {
        stop();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setActive(true);
      setStatus("Hold the record barcode inside the frame.");
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      intervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        void detector
          .detect(video)
          .then((results) => {
            const value = results[0]?.rawValue;
            if (!value) return;
            onDetected(value);
            setStatus(`Barcode ${value} detected.`);
            stop();
          })
          .catch(() => {
            setStatus("The camera is active, but no barcode is readable yet.");
          });
      }, 550);
    } catch {
      stop();
      setStatus(
        "Camera access was unavailable. You can type the barcode below instead.",
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] bg-black/25">
      <div
        className={`relative aspect-[4/3] bg-black ${active ? "block" : "hidden"}`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full object-cover"
          aria-label="Barcode camera preview"
        />
        <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-[var(--brass)] shadow-[0_0_0_999px_rgba(0,0,0,.32)]" />
        <ScanLine
          className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-[var(--brass)]"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={stop}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-black/60 text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          aria-label="Close camera"
        >
          <X className="size-4" />
        </button>
      </div>
      {!active ? (
        <div className="flex flex-col items-center px-5 py-7 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-white/6 text-[var(--brass)]">
            {supported ? (
              <Camera className="size-5" />
            ) : (
              <CameraOff className="size-5" />
            )}
          </span>
          <p className="mt-4 text-sm font-medium">
            {supported
              ? "Scan with this device"
              : "Camera scanning unavailable"}
          </p>
          <p className="mt-2 max-w-sm text-xs leading-5 text-white/38">
            {supported
              ? "Camera access stays in your browser. Only the detected number is submitted."
              : "This browser does not expose BarcodeDetector. Manual entry remains fully supported."}
          </p>
          {supported ? (
            <Button
              variant="outline"
              size="small"
              className="mt-4"
              onClick={() => void start()}
            >
              Open camera
            </Button>
          ) : null}
        </div>
      ) : null}
      {status ? (
        <p
          className="px-4 py-3 text-center text-xs text-white/48"
          role="status"
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
