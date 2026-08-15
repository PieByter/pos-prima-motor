"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2, ScanLine, AlertTriangle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useLocale } from "@/lib/locales";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CameraBarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (barcode: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CameraBarcodeScanner({
  open,
  onOpenChange,
  onDetected,
}: CameraBarcodeScannerProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(false);

  // Check if BarcodeDetector is supported
  const detectorSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  // ZXing reader instance for fallback
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Init ZXing reader once if needed
  useEffect(() => {
    if (!detectorSupported && !zxingReaderRef.current) {
      zxingReaderRef.current = new BrowserMultiFormatReader();
    }
    return () => {
      zxingReaderRef.current = null
    };
  }, [detectorSupported]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      detectedRef.current = false;
      setDetectedCode(null);

      // mediaDevices hanya tersedia di secure context (HTTPS / localhost)
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("MEDIA_DEVICES_UNAVAILABLE");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCamera(false);

      if (err instanceof Error && err.message === "MEDIA_DEVICES_UNAVAILABLE") {
        setError(
          typeof window !== "undefined" && window.isSecureContext
            ? t("scanner.cameraUnsupported")
            : t("scanner.secureContextRequired")
        );
      } else if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(t("scanner.permissionDenied"));
      } else if (err instanceof DOMException && err.name === "NotReadableError") {
        setError(t("scanner.cameraInUse"));
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError(t("scanner.cameraNotFound"));
      } else {
        setError(t("scanner.cameraAccessFailed"));
      }
    }
  }, [t]);

  // Stop camera — pure media cleanup, no setState
  const cleanupMediaStream = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset ZXing reader
    if (zxingReaderRef.current) {
      zxingReaderRef.current.reset();
    }
  }, []);

  // Stop camera + reset state (called on detection)
  const stopCamera = useCallback(() => {
    cleanupMediaStream();
    setScanning(false);
  }, [cleanupMediaStream]);

  // Scan barcode from video frame
  const scanFrame = useCallback(async () => {
    if (!detectorSupported || detectedRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const detector = new BarcodeDetector({
        formats: [
          "aztec",
          "code_128",
          "code_39",
          "code_93",
          "codabar",
          "data_matrix",
          "ean_13",
          "ean_8",
          "itf",
          "pdf417",
          "qr_code",
          "upc_a",
          "upc_e",
        ],
      });

      const barcodes = await detector.detect(canvas);

      if (barcodes.length > 0 && !detectedRef.current) {
        detectedRef.current = true;
        const code = barcodes[0].rawValue;
        setDetectedCode(code);
        setScanning(false);

        // Stop camera after detection
        stopCamera();

        // Notify parent
        setTimeout(() => {
          onDetected(code);
          onOpenChange(false);
        }, 500);
      }
    } catch {
      // Silently fail on detection error, retry next frame
    }
  }, [detectorSupported, stopCamera, onDetected, onOpenChange]);

  // Start/stop scanning on dialog open/close
  useEffect(() => {
    if (open) {
      detectedRef.current = false;
      // Small delay to allow dialog to render, then startCamera handles state reset
      const t = setTimeout(() => startCamera(), 300);
      return () => clearTimeout(t);
    }
    // When dialog closes, ONLY clean up external resources.
    // State resets are handled inside startCamera when dialog reopens.
    cleanupMediaStream();
  }, [open, startCamera, cleanupMediaStream]);

  // Poll for barcode detection — native BarcodeDetector
  useEffect(() => {
    if (scanning && detectorSupported) {
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 200);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [scanning, detectorSupported, scanFrame]);

  // ZXing fallback — uses its own video scanning API
  useEffect(() => {
    if (scanning && !detectorSupported && videoRef.current && zxingReaderRef.current) {
      const reader = zxingReaderRef.current;

      reader
        .decodeFromVideoElement(videoRef.current)
        .then((result) => {
          if (result && !detectedRef.current) {
            detectedRef.current = true;
            const code = result.getText();
            setDetectedCode(code);
            setScanning(false);
            stopCamera();
            setTimeout(() => {
              onDetected(code);
              onOpenChange(false);
            }, 500);
          }
        })
        .catch(() => {
          // Timeout or decode fail — ZXing reader already handles retry internally
        });

      return () => {
        reader.reset();
      };
    }
  }, [scanning, detectorSupported, stopCamera, onDetected, onOpenChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Fallback: manual input helper
  const [manualCode, setManualCode] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <ScanLine className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{t("scanner.title")}</DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t("scanner.subtitle")}
              </p>
              {!detectorSupported && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  {t("scanner.zxingFallback")}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          {hasCamera ? (
            <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />

              {!scanning && !detectedCode && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Camera className="h-10 w-10 text-slate-400" />
                    <p className="text-sm text-slate-300">{t("scanner.preparingCamera")}</p>
                    <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                  </div>
                </div>
              )}

              {/* Scanning overlay */}
              {scanning && !detectedCode && (
                <>
                  {/* Corner brackets */}
                  <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-sky-400/60 rounded-lg">
                    <div className="absolute -left-1 -top-1 h-6 w-6 border-t-4 border-l-4 border-sky-400 rounded-tl" />
                    <div className="absolute -right-1 -top-1 h-6 w-6 border-t-4 border-r-4 border-sky-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-sky-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-sky-400 rounded-br" />
                  </div>

                  {/* Scanning line animation */}
                  <div className="absolute left-8 right-8 h-0.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-scan" />
                </>
              )}

              {/* Detected */}
              {detectedCode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="rounded-lg bg-emerald-500 px-5 py-3 text-center text-white shadow-lg">
                    <ScanLine className="mx-auto mb-1 h-6 w-6" />
                    <p className="text-lg font-bold">{detectedCode}</p>
                    <p className="text-xs text-emerald-100">{t("scanner.detected")}</p>
                  </div>
                </div>
              )}

              {/* Close up button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label={t("scanner.close")}
              >
                <CameraOff className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Camera not available — show manual input */
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
              <CameraOff className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {error || t("scanner.noCamera")}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {t("scanner.manualInput")}
              </p>

              <div className="mt-4 flex items-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualCode.trim()) {
                      onDetected(manualCode.trim());
                      onOpenChange(false);
                    }
                  }}
                  placeholder={t("scanner.manualPlaceholder")}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (manualCode.trim()) {
                      onDetected(manualCode.trim());
                      onOpenChange(false);
                    }
                  }}
                >
                  {t("scanner.search")}
                </Button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && hasCamera && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {detectorSupported
                ? t("scanner.compatibleFormats")
                : t("scanner.browserNotSupported")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
