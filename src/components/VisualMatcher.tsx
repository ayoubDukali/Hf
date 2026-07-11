import React, { useState } from "react";
import { 
  Camera, Upload, Sparkles, ShoppingCart, RefreshCw, AlertTriangle, Check, ArrowRight, Eye, Info, Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Part } from "../types";
import PartImage from "./PartImage";

interface VisualMatcherProps {
  parts: Part[];
  onAddToCart: (part: Part, quantity: number) => void;
  onNavigateToInvoices: () => void;
}

interface MatchResult {
  bestMatch: {
    id: string;
    score: number;
    reason: string;
  };
  allMatches: Array<{
    id: string;
    score: number;
    reason: string;
  }>;
  visualDescription: string;
  detectedParts?: Array<{
    id: string;
    nameInImage: string;
    detectedQty: number;
    score: number;
    reason: string;
  }>;
}

export default function VisualMatcher({ parts, onAddToCart, onNavigateToInvoices }: VisualMatcherProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file input selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
        // Automatically start matching once image is uploaded for best UX
        triggerVisualMatch(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform visual matching via API
  const triggerVisualMatch = async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/match-part-by-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل تحليل ومطابقة الصورة");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Visual match error:", err);
      setError(err.message || "حدث خطأ غير متوقع أثناء تحليل ومطابقة الصورة.");
    } finally {
      setIsAnalyzing(false);
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
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
        triggerVisualMatch(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Find part details in original DB
  const matchedPart = result?.bestMatch?.id ? parts.find(p => p.id === result.bestMatch.id) : null;

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Visual Matcher Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="font-sans font-black text-2xl text-slate-100 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
              التحليل البصري الذكي للقطع ومطابقتها 🧠📸
            </h2>
            <p className="text-sm text-slate-400">
              التقط صورة لقطعة غيار مادية (الفحمات، فلتر، بواجي) وسيقوم الذكاء الاصطناعي بتحليل شكلها الخارجي ومقارنتها فورياً بقطع مخزنك لإضافتها للبيع.
            </p>
          </div>

          {result && (
            <button
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
                setError(null);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer self-start md:self-center"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحليل قطعة جديدة</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Column: Image input & Preview (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-sans font-bold text-base text-slate-200 border-b border-slate-800 pb-3">
              صورة القطعة المراد مطابقتها
            </h3>

            {!selectedImage ? (
              // Drag and drop dropzone
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 bg-slate-950/40 rounded-2xl p-8 text-center space-y-4 transition-all cursor-pointer relative group"
              >
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Camera className="w-8 h-8 text-amber-500" />
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-200">اسحب صورة القطعة وأفلتها هنا</p>
                  <p className="text-xs text-slate-500">أو حدد ملفاً من جهازك، أو التقط صورة بالكاميرا مباشرة</p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <label className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>التقاط بالكاميرا 📸</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>اختيار ملف</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            ) : (
              // Image preview area
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[350px] flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="صورة قطعة غيار مخصصة للتحليل"
                    className="object-contain max-h-[350px] w-full"
                  />
                  
                  {/* Laser Scanning Effect Layer */}
                  {isAnalyzing && (
                    <div className="absolute inset-x-0 h-1 bg-amber-500 shadow-[0_0_15px_#f59e0b] animate-[scan_2s_infinite] top-0"></div>
                  )}

                  {/* Glassmorphic analyzing overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-200 tracking-wider">جاري المسح الضوئي وتحليل المعالم البصرية للقطعة...</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">خطأ في التحليل</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {!isAnalyzing && !result && (
                  <button
                    type="button"
                    onClick={() => triggerVisualMatch(selectedImage)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة محاولة التحليل والمطابقة</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Left Column: Match Results (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl min-h-[400px] flex flex-col justify-between">
            <div>
              <h3 className="font-sans font-bold text-base text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                نتائج المطابقة البصرية بالذكاء الاصطناعي
              </h3>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  // Analyzing skeleton loading
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="inline-block relative">
                      <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
                      <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-200">يقوم Gemini بمقارنة المعالم البصرية الآن...</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        يتم تحليل ألوان القطعة، زواياها، تدرج المعادن، شكل الفراغات والأقراص لتحديد ما إذا كانت متوفرة بالمخزن حتى بدون معرفة رقم OEM الأصلي.
                      </p>
                    </div>
                  </motion.div>
                ) : result ? (
                  // Result Display
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-2"
                  >
                    <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">ماذا تظهر الصورة (تحليل بصرى):</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {result.visualDescription}
                      </p>
                    </div>

                    {/* Detected Parts & Products Section (Main focus for multiple items) */}
                    {result.detectedParts && result.detectedParts.length > 0 ? (
                      <div className="space-y-4 border-t border-slate-800/60 pt-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="text-sm font-black text-amber-500 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span>📦 المنتجات والقطع المكتشفة داخل الصورة:</span>
                          </h4>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-medium font-mono">
                            تم التعرف على {result.detectedParts.length} عناصر
                          </span>
                        </div>

                        {/* Instruction Note */}
                        <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl text-xs text-amber-300 font-bold leading-relaxed">
                          💡 لإضافة أي من هذه القطع المكتشفة إلى سلة المبيعات، يرجى الضغط على زر <span className="underline text-amber-400">إضافة للسلة</span> بجانب القطعة المكتوبة أدناه.
                        </div>

                        <div className="space-y-3.5">
                          {result.detectedParts.map((det, idx) => {
                            const dbPart = det.id ? parts.find(p => p.id === det.id) : null;
                            const qtyToAdd = det.detectedQty || 1;
                            
                            return (
                              <div key={idx} className="p-4 bg-slate-950/70 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                                      {dbPart ? (
                                        <PartImage category={dbPart.category} image={dbPart.image} className="w-full h-full object-contain" />
                                      ) : (
                                        <Package className="w-6 h-6 text-slate-600" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-200">{det.nameInImage}</span>
                                        <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold font-mono">
                                          دقة {det.score}%
                                        </span>
                                      </div>
                                      {dbPart ? (
                                        <div className="text-[11px] text-slate-400 font-medium">
                                          المنتج المطابق: <span className="text-slate-200 font-bold">{dbPart.name}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-red-400 font-medium">
                                          لم يتم العثور على مطابقة مؤكدة في المخزن
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                    <span className="text-xs font-bold text-slate-400">
                                      الكمية بالصورة: <span className="text-amber-500 font-mono font-bold text-sm bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-md">{qtyToAdd} حبة</span>
                                    </span>
                                    {dbPart && (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        سعر الحبة: {dbPart.sellingPrice} د.ل | الإجمالي: <span className="text-emerald-400 font-bold">{dbPart.sellingPrice * qtyToAdd} د.ل</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {dbPart && (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-900">
                                    <p className="text-[11px] text-slate-400 italic flex-1 pl-3">
                                      "{det.reason}"
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onAddToCart(dbPart, qtyToAdd);
                                        alert(`تم إضافة قطعة "${dbPart.name}" (الكمية: ${qtyToAdd}) إلى سلة المبيعات بنجاح!`);
                                      }}
                                      disabled={dbPart.quantity === 0}
                                      className="py-2 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/5 cursor-pointer shrink-0"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>إضافة للسلة ({qtyToAdd} حبة) 🛒</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Grand Total Price Block of detected items */}
                        {(() => {
                          const matchedItems = result.detectedParts.filter(det => det.id && parts.some(p => p.id === det.id));
                          if (matchedItems.length > 0) {
                            const grandTotal = matchedItems.reduce((sum, det) => {
                              const part = parts.find(p => p.id === det.id);
                              return sum + (part ? part.sellingPrice * (det.detectedQty || 1) : 0);
                            }, 0);
                            
                            return (
                              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-4 shadow-inner">
                                <div className="space-y-1">
                                  <span className="text-xs text-slate-300 block font-bold">📊 المجموع الإجمالي للقطع المكتشفة المتوفرة بالمخزن:</span>
                                  <span className="text-[10px] text-slate-500">مجموع قيم السلع المطابقة في مخزنك والمكتشفة داخل الصورة</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="text-left font-mono">
                                    <span className="text-2xl font-black text-emerald-400">{grandTotal}</span>
                                    <span className="text-xs font-bold text-slate-400 mr-1.5">د.ل</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      matchedItems.forEach(det => {
                                        const part = parts.find(p => p.id === det.id);
                                        if (part) {
                                          onAddToCart(part, det.detectedQty || 1);
                                        }
                                      });
                                      alert(`تم إضافة جميع القطع المكتشفة (${matchedItems.length} قطع) إلى سلة المبيعات بنجاح!`);
                                    }}
                                    className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/5 cursor-pointer shrink-0"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>إضافة كل القطع المطابقة للسلة 🛒</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      /* Fallback to original single match if no detectedParts */
                      <>
                        {/* Best Match Section */}
                        {matchedPart ? (
                          <div className="space-y-4">
                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                              <div className="flex items-center justify-between gap-4 border-b border-emerald-500/10 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <Check className="w-5 h-5" />
                                  </span>
                                  <div>
                                    <h4 className="text-xs font-bold text-emerald-400">تم العثور على مطابقة مؤكدة!</h4>
                                    <p className="text-[10px] text-slate-400">تطابق بصرى وتوافقي بنسبة عالية</p>
                                  </div>
                                </div>

                                {/* Confidence Badge */}
                                <div className="text-left">
                                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-full">
                                    {result.bestMatch.score}% تطابق
                                  </span>
                                </div>
                              </div>

                              {/* Render Matched Part details */}
                              <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl p-2 shrink-0">
                                  <PartImage category={matchedPart.category} image={matchedPart.image} className="w-full h-full object-contain" />
                                </div>

                                <div className="space-y-1 flex-1 text-right">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-bold">{matchedPart.category}</span>
                                    <span className={`text-[10px] font-bold ${
                                      matchedPart.quantity > 0 ? "text-emerald-400" : "text-red-400"
                                    }`}>
                                      {matchedPart.quantity > 0 ? `المتوفر: ${matchedPart.quantity} حبة` : "نفدت الكمية"}
                                    </span>
                                  </div>
                                  <h5 className="font-sans font-black text-slate-100 text-base">{matchedPart.name}</h5>
                                  <p className="text-xs font-mono text-slate-400">OEM: <span className="text-slate-200 font-bold">{matchedPart.partNumber}</span></p>
                                </div>
                              </div>

                              {/* Compatible Cars Strip */}
                              <div className="flex flex-wrap gap-1 border-t border-emerald-500/10 pt-3">
                                <span className="text-[10px] text-slate-400 font-bold">الموديلات المتوافقة:</span>
                                {matchedPart.compatibleCars.map((car, idx) => (
                                  <span key={idx} className="bg-slate-900/80 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                                    {car.brand} {car.model} ({car.years})
                                  </span>
                                ))}
                              </div>

                              {/* Reason detail */}
                              <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p>{result.bestMatch.reason}</p>
                              </div>

                              {/* Action Button: Add to Cart */}
                              <button
                                type="button"
                                onClick={() => {
                                  onAddToCart(matchedPart, 1);
                                  alert(`تم إضافة قطعة "${matchedPart.name}" إلى سلة البيع بنجاح!`);
                                }}
                                disabled={matchedPart.quantity === 0}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span>تأكيد القطعة وإضافتها لسلة البيع الفورية 🛒</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-amber-500/5 border border-amber-500/15 rounded-2xl space-y-4">
                            <div className="flex items-start gap-3 text-amber-400">
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-bold">لم نجد تطابق مؤكد بنسبة عالية ⚠️</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  الذكاء الاصطناعي وجد صوراً مشابهة للقطع ولكن لم يعثر على تطابق متطابق تماماً في المخزون الحالي. يرجى مراجعة القطع المقترحة البديلة أدناه، أو البحث يدوياً برقم القطعة.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Alternatives matches list */}
                        {result.allMatches && result.allMatches.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Package className="w-3.5 h-3.5" />
                              قطع بديلة أو مشابهة مقترحة في المخزن:
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {result.allMatches.map((alt, idx) => {
                                const altPart = parts.find(p => p.id === alt.id);
                                if (!altPart) return null;
                                return (
                                  <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-amber-500 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                                          {alt.score}% تشابه
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">{altPart.sellingPrice} د.ل</span>
                                      </div>
                                      <h5 className="text-xs font-black text-slate-200 leading-normal">{altPart.name}</h5>
                                      <p className="text-[10px] text-slate-500">OEM: {altPart.partNumber}</p>
                                    </div>

                                    <div className="space-y-2 border-t border-slate-900 pt-2">
                                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">"{alt.reason}"</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onAddToCart(altPart, 1);
                                          alert(`تم إضافة البديل "${altPart.name}" إلى سلة البيع بنجاح!`);
                                        }}
                                        disabled={altPart.quantity === 0}
                                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 disabled:bg-slate-900 text-slate-300 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <ShoppingCart className="w-3 h-3 text-amber-500" />
                                        <span>إضافة البديل للسلة</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ) : (
                  // Initial Guide state
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center space-y-4 text-slate-500"
                  >
                    <div className="w-16 h-16 bg-slate-950 border border-slate-850 border-dashed rounded-full flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8 text-slate-700 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-400">بانتظار تصوير أو إدراج صورة للبدء</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        بمجرد اختيارك لصورة قطعة الغيار من العمود الأيمن، سيقوم النظام بمقارنتها ذاتياً وقراءتها بحدس بصري عميق مع مخزون النسور.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Invoices redirection shortcuts */}
            <div className="border-t border-slate-850/60 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="text-slate-500">تمت إضافة بعض القطع إلى السلة؟ يمكنك تفقد السلة ومراجعة الفاتورة في ركن المبيعات.</span>
              <button
                onClick={onNavigateToInvoices}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <span>الذهاب لركن المبيعات والفواتير</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
