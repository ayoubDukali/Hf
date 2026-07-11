/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Upload, AlertCircle, Sparkles, Check, Image as ImageIcon } from "lucide-react";

interface ScannerProps {
  onScanCompleted: (detectedCode: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScanCompleted, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ codes: string[]; description: string; confidence: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  // Start the webcam
  const startCamera = async () => {
    setCameraError(null);
    setIsCapturing(true);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError("عذراً، تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات أو استخدام خيار تحميل صورة.");
      setActiveTab("upload");
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Capture photo from camera stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Match canvas dimensions to the video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSelectedImage(dataUrl);
        analyzeImage(dataUrl);
      }
    }
  };

  // Handle uploaded image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        analyzeImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        analyzeImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send image to backend OCR endpoint
  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل تحليل الصورة من قبل الخادم");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setCameraError(err.message || "حدث خطأ أثناء الاتصال بخدمة قراءة الرموز بالذكاء الاصطناعي.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyCode = (code: string) => {
    onScanCompleted(code);
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-2xl overflow-hidden border bg-slate-900 border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-slate-100">قراءة وتصوير رقم القطعة الذكي</h3>
              <p className="text-xs text-slate-400">وجه الكاميرا لملصق القطعة لقراءة الرقم تلقائياً بالذكاء الاصطناعي</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors font-mono"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 bg-slate-950/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "camera"
                ? "bg-slate-800 text-amber-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            الكاميرا المباشرة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "upload"
                ? "bg-slate-800 text-amber-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            تحميل صورة ملصق
          </button>
        </div>

        {/* Scan Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cameraError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div>{cameraError}</div>
            </div>
          )}

          {activeTab === "camera" ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${selectedImage ? "hidden" : "block"}`}
              />

              {/* Target bracket overlays */}
              {!selectedImage && !isCapturing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-2/3 h-1/3 border-2 border-amber-500/40 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500 -mt-0.5 -ml-0.5"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500 -mt-0.5 -mr-0.5"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500 -mb-0.5 -ml-0.5"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500 -mb-0.5 -mr-0.5"></div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/30 animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Captured Image Preview */}
              {selectedImage && (
                <img src={selectedImage} alt="Captured" className="w-full h-full object-cover" />
              )}

              {/* Laser animation */}
              {isAnalyzing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent top-0 animate-[bounce_2s_infinite]"></div>
              )}

              {/* Loading spinner */}
              {(isCapturing || isAnalyzing) && (
                <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <span className="text-sm font-medium text-slate-200">
                    {isCapturing ? "جاري تشغيل الكاميرا..." : "جاري قراءة وتحليل الرموز بالذكاء الاصطناعي..."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Upload Area */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 bg-slate-950/20 text-center cursor-pointer transition-colors space-y-4 flex flex-col items-center justify-center min-h-[220px]"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              {selectedImage ? (
                <div className="relative max-h-[180px] rounded-lg overflow-hidden border border-slate-800">
                  <img src={selectedImage} alt="Uploaded preview" className="max-h-[170px] object-contain" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-slate-800 text-slate-400 group-hover:text-amber-500 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">اسحب صورة ملصق الرقم هنا أو انقر للتصفح</p>
                    <p className="text-xs text-slate-500 mt-1">يدعم صيغ JPG, PNG حتى 5 ميجابايت</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action buttons under scan box */}
          <div className="flex gap-3 justify-center">
            {activeTab === "camera" && !selectedImage && (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isCapturing || isAnalyzing}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                التقاط صورة وتحليلها
              </button>
            )}

            {selectedImage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                  if (activeTab === "camera") startCamera();
                }}
                className="px-5 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة / تصوير جديد
              </button>
            )}
          </div>

          {/* AI Result Card */}
          {result && (
            <div className="p-5 bg-slate-950/40 border border-amber-500/20 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>نتائج تحليل الذكاء الاصطناعي (Gemini-3.5)</span>
                <span className="mr-auto text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  ثقة: {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {result.description && (
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/50">
                  {result.description}
                </p>
              )}

              <div className="space-y-2">
                <span className="text-xs text-slate-500 block font-medium">أرقام ورموز القطع المكتشفة:</span>
                {result.codes && result.codes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.codes.map((code, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleApplyCode(code)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg text-sm font-mono font-semibold border border-slate-700 flex items-center gap-2 transition-all group"
                      >
                        <span>{code}</span>
                        <Check className="w-4 h-4 text-emerald-500 group-hover:text-slate-950 shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">لم نتمكن من العثور على أرقام قطع واضحة في الصورة. حاول مجدداً مع إضاءة أفضل وزاوية مستقيمة.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center text-xs text-slate-500">
          تعتمد ميزة القراءة الذكية على رؤية الكمبيوتر المتقدمة من Gemini لقراءة الرموز من الملصقات والكراتين.
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
