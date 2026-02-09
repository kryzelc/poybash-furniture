"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
// ImageWithFallback removed - using regular img tags
import { InvoiceReceipt } from "../InvoiceReceipt";
import { QrCode, Camera, AlertCircle, CheckCircle2, X } from "lucide-react";
import type { Order } from "@/models/Order";
import { getProducts } from "../../lib/products";

interface QRScannerProps {
  orders: Order[];
  onClose: () => void;
}

export function QRScanner({ orders, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [manualInput, setManualInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const products = getProducts();

  const getProductImage = (productId: number, fallbackUrl: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.imageUrl || fallbackUrl;
  };

  const handleQRCodeScanned = (qrValue: string) => {
    // Extract order ID from QR code value
    // Expected format: POYBASH-ORDER-{orderId}
    const match = qrValue.match(/POYBASH-ORDER-(.+)/);

    if (match) {
      const orderId = match[1];
      const order = orders.find((o) => o.id === orderId);

      if (order) {
        setScannedOrder(order);
        setError("");
      } else {
        setError(`No order found for QR code: ${orderId}`);
      }
    } else {
      setError("Invalid QR code. This is not a PoyBash order QR code.");
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Use jsQR library for scanning
    try {
      // @ts-ignore - jsQR will be loaded from CDN
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeScanned(code.data);
        stopScanning();
        return;
      }
    } catch (e) {
      // jsQR not loaded yet or error
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  const startScanning = async () => {
    try {
      setError("");
      setScanning(true);

      // Request camera permission with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraPermission("granted");
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            // Start scanning loop
            scanQRCode();
          });
        };
      }
    } catch (err: any) {
      // Don't log to console - this is expected user behavior
      setScanning(false);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraPermission("denied");
        setError(
          "Camera access denied. Please allow camera permissions in your browser and try again.",
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No camera found on this device. Please use the manual order ID lookup instead.",
        );
      } else if (err.name === "NotReadableError") {
        setError(
          "Camera is already in use by another application. Please close other apps using the camera and try again.",
        );
      } else if (err.name === "OverconstrainedError") {
        setError(
          "Camera constraints not supported. Trying with default settings...",
        );
        // Retry with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setCameraPermission("granted");
          streamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                scanQRCode();
              });
            };
          }
          setError("");
          setScanning(true);
        } catch (retryErr) {
          setError(
            "Unable to access camera with any settings. Please use manual order ID lookup.",
          );
        }
      } else {
        setError(
          `Camera error: ${err.message || "Unable to access camera"}. Please use the manual order ID lookup.`,
        );
      }
    }
  };

  const stopScanning = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const handleManualLookup = () => {
    if (!manualInput.trim()) return;

    const order = orders.find((o) => o.id === manualInput.trim());

    if (order) {
      setScannedOrder(order);
      setError("");
      setManualInput("");
    } else {
      setError(`No order found with ID: ${manualInput}`);
    }
  };

  useEffect(() => {
    // Load jsQR from CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      stopScanning();
      document.body.removeChild(script);
    };
  }, []);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700";
      case "ready":
        return "bg-blue-500/10 text-blue-700";
      case "processing":
        return "bg-yellow-500/10 text-yellow-700";
      case "pending":
        return "bg-orange-500/10 text-orange-700";
      case "cancelled":
        return "bg-red-500/10 text-red-700";
      case "pending":
        return "bg-purple-500/10 text-purple-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  if (scannedOrder) {
    return (
      <div className="space-y-4 pb-12">
        {/* Compact Success Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-base">Order Found!</CardTitle>
                  <CardDescription className="text-xs">
                    Order #{scannedOrder.id}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(scannedOrder.status)}>
                  {scannedOrder.status.replace("-", " ")}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScannedOrder(null);
                    setManualInput("");
                  }}
                >
                  New Lookup
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice */}
        <InvoiceReceipt order={scannedOrder} />

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            size="sm"
          >
            Close Scanner
          </Button>
          <Button
            onClick={() => {
              setScannedOrder(null);
              setManualInput("");
            }}
            className="flex-1"
            size="sm"
          >
            Look Up Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-12">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Order Lookup
          </CardTitle>
          <CardDescription>
            Scan QR code for pickup verification
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Combined Instructions */}
        {!scanning && (
          <Alert>
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-semibold mb-2">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Click "Start Camera" to activate your camera for QR scanning
                  </li>
                  <li>
                    Position the customer's QR code within the scanning area
                  </li>
                  <li>Order details will appear automatically once detected</li>
                </ol>
              </div>
              {cameraPermission === "denied" && (
                <div className="pt-2 border-t">
                  <p className="mb-2">
                    <span className="font-semibold text-red-600">
                      Camera Access Required
                    </span>
                  </p>
                  <p className="text-sm mb-2">
                    Please allow camera access in your browser settings to use
                    the QR scanner.
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Allow" for camera access</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                </div>
              )}
              {cameraPermission === "prompt" && (
                <div className="pt-2 border-t">
                  <p className="mb-2">
                    <span className="font-semibold">
                      Camera Permission Required
                    </span>
                  </p>
                  <p className="text-sm mb-2">
                    When you click "Start Camera", your browser will ask for
                    camera permission. Please click "Allow" to enable QR
                    scanning.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Camera View */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm mb-2">
              Position the QR code within the scanning area
            </p>
          </div>

          <div className="aspect-square max-w-md mx-auto bg-secondary rounded-lg overflow-hidden relative">
            {scanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-muted-foreground mb-2">
                      Camera not active
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Camera" to begin scanning
                    </p>
                  </div>
                </div>
              </div>
            )}

            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-primary rounded-lg"></div>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            {!scanning && (
              <Button
                onClick={startScanning}
                size="lg"
                className="w-full max-w-md"
              >
                Start Camera
              </Button>
            )}
            {scanning && (
              <Button
                onClick={stopScanning}
                size="lg"
                variant="destructive"
                className="w-full max-w-md"
              >
                Stop Camera
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              Or scan QR code with camera
            </p>
          </div>
        </div>

        {/* Errors and Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
