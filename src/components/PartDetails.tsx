/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Wrench, Layers, Tag, Truck, Coins, ShieldCheck, MapPin, Notebook, Printer, CheckCircle2, AlertTriangle, AlertCircle, ShoppingCart
} from "lucide-react";
import { Part } from "../types";
import PartImage from "./PartImage";

interface PartDetailsProps {
  part: Part;
  showAdminPrices: boolean; // Controls whether buyingPrice is visible
  onClose: () => void;
  onAddToCart?: (part: Part) => void;
}

export default function PartDetails({ part, showAdminPrices, onClose, onAddToCart }: PartDetailsProps) {
  const isOutOfStock = part.quantity === 0;
  const isLowStock = part.quantity > 0 && part.quantity <= 3;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fadeIn" dir="rtl">
      
      {/* Header section */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">تفاصيل قطعة الغيار</span>
            <h3 className="font-sans font-bold text-lg text-slate-100">{part.name}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg text-sm"
        >
          إغلاق التفاصيل ✕
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column - Graphic/Schematic & Stats (4 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950/40 relative group">
            <PartImage category={part.category} image={part.image} className="w-full h-full p-6" />
            <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-400">
              {part.category}
            </div>
          </div>

          {/* Quick status cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-slate-500 block">حالة التوفر</span>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-red-400 flex items-center gap-1 justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" /> نفدت
                </span>
              ) : isLowStock ? (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" /> منخفضة
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" /> متوفرة
                </span>
              )}
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-slate-500 block">الكمية بالمخزن</span>
              <span className="text-sm font-bold text-slate-200">{part.quantity} حبة</span>
            </div>
          </div>

          {part.location && (
            <div className="bg-slate-950/30 border border-slate-850/80 p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">موقع القطعة في الرف</span>
                <span className="text-sm font-mono font-bold text-slate-200">{part.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Spec specifications (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>رقم القطعة الأصلي (OEM Part Number)</span>
              </div>
              <span className="text-lg font-mono font-bold text-amber-500 tracking-wider block pt-1 select-all">
                {part.partNumber}
              </span>
            </div>

            <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>الأرقام البديلة المتوافقة</span>
              </div>
              {part.altNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {part.altNumbers.map((num, idx) => (
                    <span key={idx} className="bg-slate-800 border border-slate-700/60 font-mono text-xs font-semibold px-2 py-0.5 rounded text-slate-300 select-all">
                      {num}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic block pt-1.5">لا يوجد أرقام بديلة مسجلة</span>
              )}
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">سعر البيع النهائي للزبون</span>
                <span className="text-xl font-bold text-emerald-400">{part.sellingPrice} <span className="text-xs font-normal">د.ل</span></span>
              </div>
            </div>

            {showAdminPrices && (
              <div className="border-r border-slate-800 pr-6 pl-2 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">سعر الشراء (للمشرف فقط)</span>
                  <span className="text-base font-bold text-red-400">{part.buyingPrice} <span className="text-xs font-normal">د.ل</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Synonyms list */}
          {part.aliases.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">الأسماء والترادفات البديلة للقطعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {part.aliases.map((alias, idx) => (
                  <span key={idx} className="bg-slate-800/60 border border-slate-850 px-2.5 py-1 rounded-lg text-xs text-slate-300">
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Compatible Cars list */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>السيارات المتوافقة مع هذه القطعة ({part.compatibleCars.length}):</span>
            </div>
            
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/10">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">الشركة المصنعة</th>
                      <th className="py-2.5 px-3">الموديل والنوع</th>
                      <th className="py-2.5 px-3">السنوات المتوافقة</th>
                      <th className="py-2.5 px-3">المحرك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {part.compatibleCars.map((car, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/20">
                        <td className="py-2.5 px-3 font-semibold text-amber-500">{car.brand}</td>
                        <td className="py-2.5 px-3 text-slate-200">{car.model}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">{car.years}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{car.engine || "غير محدد"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes */}
          {part.notes && (
            <div className="p-4 bg-slate-950/35 border border-slate-850 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                <Notebook className="w-4 h-4 text-amber-500" />
                <span>ملاحظات وإرشادات فنية للتركيب:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {part.notes}
              </p>
            </div>
          )}

          {/* Export/Print Sticker */}
          <div className="flex justify-end gap-3 pt-2">
            {onAddToCart && (
              <button
                onClick={() => {
                  onAddToCart(part);
                  alert(`تم إضافة قطعة "${part.name}" إلى سلة البيع بنجاح!`);
                }}
                disabled={isOutOfStock}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !isOutOfStock
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/10"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>إضافة إلى سلة البيع 🛒</span>
              </button>
            )}
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة كرت القطعة والرمز
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
