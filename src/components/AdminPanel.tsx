/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, Edit2, Trash2, Key, Database, Download, Upload, Clock, Save, X, Search, ChevronRight, AlertCircle, Sparkles, CheckCircle2, ListFilter
} from "lucide-react";
import { Part, CompatibleCar, SearchHistoryItem } from "../types";
import PartImage from "./PartImage";

interface AdminPanelProps {
  parts: Part[];
  history: SearchHistoryItem[];
  onAddPart: (part: Part) => void;
  onUpdatePart: (part: Part) => void;
  onDeletePart: (id: string) => void;
  onImportDatabase: (importedParts: Part[]) => void;
  onClearHistory: () => void;
}

const CATEGORIES = ["فرامل", "فلاتر", "محرك", "مساعدات", "سيور", "كهرباء", "أخرى"];

export default function AdminPanel({
  parts,
  history,
  onAddPart,
  onUpdatePart,
  onDeletePart,
  onImportDatabase,
  onClearHistory
}: AdminPanelProps) {
  const [isAdmin, setIsAdmin] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Search/Filter for Admin Inventory List
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form states for Add/Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  // Core Part Form Fields
  const [formName, setFormName] = useState("");
  const [formAliases, setFormAliases] = useState(""); // Comma separated
  const [formPartNumber, setFormPartNumber] = useState("");
  const [formAltNumbers, setFormAltNumbers] = useState(""); // Comma separated
  const [formCategory, setFormCategory] = useState("فرامل");
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formBuyingPrice, setFormBuyingPrice] = useState(0);
  const [formQuantity, setFormQuantity] = useState(0);
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formImage, setFormImage] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 5 ميجابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Nested Compatible Cars State
  const [formCars, setFormCars] = useState<CompatibleCar[]>([]);
  const [newCarBrand, setNewCarBrand] = useState("تويوتا");
  const [newCarModel, setNewCarModel] = useState("");
  const [newCarYears, setNewCarYears] = useState("");
  const [newCarEngine, setNewCarEngine] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "1234") {
      setIsAdmin(true);
      setPasscodeError("");
    } else {
      setPasscodeError("رمز المرور خاطئ! جرب الرمز الافتراضي (1234)");
    }
  };

  const openAddModal = () => {
    setEditingPart(null);
    setFormName("");
    setFormAliases("");
    setFormPartNumber("");
    setFormAltNumbers("");
    setFormCategory("فرامل");
    setFormSellingPrice(0);
    setFormBuyingPrice(0);
    setFormQuantity(1);
    setFormLocation("");
    setFormNotes("");
    setFormCars([]);
    setFormImage("");
    setShowFormModal(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setFormName(part.name);
    setFormAliases(part.aliases.join(", "));
    setFormPartNumber(part.partNumber);
    setFormAltNumbers(part.altNumbers.join(", "));
    setFormCategory(part.category);
    setFormSellingPrice(part.sellingPrice);
    setFormBuyingPrice(part.buyingPrice);
    setFormQuantity(part.quantity);
    setFormLocation(part.location || "");
    setFormNotes(part.notes || "");
    setFormCars([...part.compatibleCars]);
    setFormImage(part.image || "");
    setShowFormModal(true);
  };

  const handleAddCar = () => {
    if (!newCarModel.trim() || !newCarYears.trim()) {
      alert("الرجاء ملء الموديل وسنة الصنع للسيارة");
      return;
    }
    const car: CompatibleCar = {
      brand: newCarBrand,
      model: newCarModel.trim(),
      years: newCarYears.trim(),
      engine: newCarEngine.trim() || undefined
    };
    setFormCars([...formCars, car]);
    setNewCarModel("");
    setNewCarYears("");
    setNewCarEngine("");
  };

  const handleRemoveCar = (index: number) => {
    setFormCars(formCars.filter((_, idx) => idx !== index));
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPartNumber.trim()) {
      alert("اسم القطعة ورقمها الأصلي مطلوبان بشكل أساسي.");
      return;
    }

    if (formCars.length === 0) {
      alert("يرجى ربط القطعة بسيارة متوافقة واحدة على الأقل.");
      return;
    }

    const aliasesArray = formAliases
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "");

    const altNumbersArray = formAltNumbers
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "");

    const partData: Part = {
      id: editingPart ? editingPart.id : "part-" + Date.now(),
      name: formName.trim(),
      aliases: aliasesArray,
      partNumber: formPartNumber.trim().toUpperCase(),
      altNumbers: altNumbersArray.map(n => n.toUpperCase()),
      compatibleCars: formCars,
      sellingPrice: Number(formSellingPrice),
      buyingPrice: Number(formBuyingPrice),
      quantity: Number(formQuantity),
      location: formLocation.trim() || undefined,
      notes: formNotes.trim() || undefined,
      category: formCategory,
      image: formImage || formCategory
    };

    if (editingPart) {
      onUpdatePart(partData);
    } else {
      onAddPart(partData);
    }

    setShowFormModal(false);
  };

  // Export database as JSON file download
  const handleExportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `spare_parts_db_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import database from JSON file upload
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported) && imported.length > 0 && imported[0].partNumber) {
            onImportDatabase(imported);
            alert(`تم استيراد ${imported.length} قطعة بنجاح إلى قاعدة البيانات المحلية!`);
          } else {
            alert("صيغة الملف غير صالحة. يرجى التأكد من استيراد ملف JSON احتياطي صحيح.");
          }
        } catch (err) {
          alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.");
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredParts = parts.filter(p => {
    const matchQuery = 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      p.partNumber.toLowerCase().includes(adminSearch.toLowerCase()) ||
      p.aliases.some(a => a.toLowerCase().includes(adminSearch.toLowerCase()));
    
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;

    return matchQuery && matchCategory;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6 animate-fadeIn" dir="rtl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-xl text-slate-100">تسجيل دخول المشرف</h2>
          <p className="text-sm text-slate-400">الرجاء إدخال رمز المرور للوصول إلى أدوات إدارة المخزون وتعديل الأسعار.</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium block">رمز المرور للمشرف (الافتراضي: 1234)</label>
            <input
              type="password"
              placeholder="••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full text-center tracking-widest font-mono py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/50 outline-none text-slate-100 placeholder-slate-600 transition-colors"
              required
            />
          </div>

          {passcodeError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              {passcodeError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-colors"
          >
            دخول للوحة التحكم
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Admin Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500">
            <Database className="w-5 h-5" />
            <h2 className="font-sans font-bold text-xl text-slate-100">إدارة المستودع والقطع</h2>
          </div>
          <p className="text-xs text-slate-400">يمكنك هنا إضافة قطع غيار جديدة، تعديل معلومات التوافق والأسعار، أو نسخ البيانات احتياطياً.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة قطعة جديدة
          </button>

          <button
            onClick={handleExportDatabase}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير نسخة احتياطية
          </button>

          <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            استيراد نسخة احتياطية
            <input type="file" accept=".json" onChange={handleImportDatabase} className="hidden" />
          </label>
          
          <button
            onClick={() => setIsAdmin(false)}
            className="px-3.5 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl text-sm transition-colors"
          >
            خروج المشرف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main inventory list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            
            {/* List filters */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم القطعة داخل لوحة التحكم..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full py-2 pr-9 pl-4 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-slate-200 placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 outline-none focus:border-amber-500/50"
                >
                  <option value="all">كل التصنيفات ({parts.length})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-950/40 text-slate-400 text-xs uppercase border-b border-slate-800/80">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">القطعة والرمز</th>
                    <th className="py-3.5 px-4 font-semibold">التصنيف</th>
                    <th className="py-3.5 px-4 font-semibold">سعر الشراء / البيع</th>
                    <th className="py-3.5 px-4 font-semibold text-center">المخزن</th>
                    <th className="py-3.5 px-4 font-semibold">الرف</th>
                    <th className="py-3.5 px-4 font-semibold text-left">أدوات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredParts.length > 0 ? (
                    filteredParts.map(part => (
                      <tr key={part.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0">
                              <PartImage category={part.category} image={part.image} className="w-full h-full" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200">{part.name}</div>
                              <div className="text-xs font-mono text-amber-500 mt-0.5">{part.partNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          <span className="px-2 py-0.5 bg-slate-800 text-xs rounded border border-slate-700/50">
                            {part.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-red-400">شراء: <span className="font-bold">{part.buyingPrice}</span> د.ل</div>
                          <div className="text-sm text-emerald-400 font-bold mt-0.5">بيع: {part.sellingPrice} د.ل</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            part.quantity > 5 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : part.quantity > 0 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {part.quantity} حبة
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-400">
                          {part.location || "غير محدد"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 justify-end">
                            {deletingPartId === part.id ? (
                              <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 p-1 rounded-xl animate-pulse">
                                <button
                                  onClick={() => {
                                    onDeletePart(part.id);
                                    setDeletingPartId(null);
                                  }}
                                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-slate-950 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                                >
                                  تأكيد الحذف ⚠️
                                </button>
                                <button
                                  onClick={() => setDeletingPartId(null)}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  تراجع
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditModal(part)}
                                  className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/5 rounded-lg transition-colors"
                                  title="تعديل القطعة"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingPartId(part.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                                  title="حذف القطعة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        لا توجد قطع غيار مطابقة للبحث داخل لوحة التحكم.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* History Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="font-sans font-bold text-base">سجل عمليات الاستعلام</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  مسح السجل
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              تراقب هذه اللوحة نشاط البحث المباشر للعملاء والموظفين لتحسين دقة استعلامات قطع الغيار وفهم الطلب.
            </p>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded font-medium ${
                        item.searchType === "camera" 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                          : item.searchType === "smart"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.searchType === "camera" ? "كاميرا ذكية" : item.searchType === "smart" ? "بحث ذكي" : "بحث عادي"}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 text-sm">"{item.query}"</div>
                    <div className="text-xs text-slate-500">تم العثور على: <span className="text-slate-300 font-bold">{item.resultsCount} قطع</span> متطابقة</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs italic">لا توجد أي عمليات بحث في السجل حالياً.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-100">
                  {editingPart ? `تعديل قطعة: ${editingPart.name}` : "إضافة قطعة غيار جديدة للمستودع"}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSavePart} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Core Information Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">بيانات القطعة الأساسية</h4>
                
                {/* Image Upload Input */}
                <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-2xl space-y-3">
                  <label className="text-xs text-slate-400 font-medium block">صورة قطعة الغيار (اختياري)</label>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* Live Preview / Image Display */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                      <PartImage category={formCategory} image={formImage} className="w-full h-full p-2" />
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex gap-2">
                        <label className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                          <Upload className="w-4 h-4 text-amber-500" />
                          اختر صورة أو التقطها
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            className="hidden" 
                          />
                        </label>
                        
                        {formImage && (
                          <button
                            type="button"
                            onClick={() => setFormImage("")}
                            className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            حذف الصورة
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">نوصي برفع صور ذات خلفية واضحة أو ملصق القطعة. الصيغ المدعومة: PNG, JPG, WEBP بحجم لا يتجاوز 5 ميجابايت.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">اسم القطعة الأصلي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فحمات فرامل أمامية"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">رقم القطعة الأصلي (Part Number) *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 04465-33480"
                      value={formPartNumber}
                      onChange={(e) => setFormPartNumber(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none font-mono text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">الأسماء والترادفات البديلة (تفصل بينها فاصلة ",")</label>
                    <input
                      type="text"
                      placeholder="مثال: قماشات أمامية, بريكات, سيفون"
                      value={formAliases}
                      onChange={(e) => setFormAliases(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">تساعد هذه الكلمات محرك البحث والذكاء الاصطناعي في إيجاد القطعة بالعامية</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">الأرقام البديلة المتوافقة (تفصل بينها فاصلة ",")</label>
                    <input
                      type="text"
                      placeholder="مثال: D1914, SP2134"
                      value={formAltNumbers}
                      onChange={(e) => setFormAltNumbers(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none font-mono text-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">تصنيف القطعة</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">موقع القطعة في الرف/القسم</label>
                    <input
                      type="text"
                      placeholder="مثال: الرف A-12"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">الكمية المتوفرة بالمخزن</label>
                    <input
                      type="number"
                      min={0}
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                    <label className="text-xs text-red-400 font-bold block">سعر الشراء (للمشرف فقط) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formBuyingPrice}
                      onChange={(e) => setFormBuyingPrice(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-slate-950 border border-red-500/20 rounded-lg focus:border-red-500/50 outline-none text-red-300 font-bold text-sm mt-1"
                    />
                  </div>

                  <div className="space-y-1.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                    <label className="text-xs text-emerald-400 font-bold block">سعر البيع للزبون *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-slate-950 border border-emerald-500/20 rounded-lg focus:border-emerald-500/50 outline-none text-emerald-300 font-bold text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Compatible Cars Links Section */}
              <div className="space-y-4 border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">ربط السيارات المتوافقة</h4>
                  <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">مرتبطة بـ {formCars.length} سيارات</span>
                </div>

                {/* Mini Car Form */}
                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">الشركة المصنعة</label>
                      <select
                        value={newCarBrand}
                        onChange={(e) => setNewCarBrand(e.target.value)}
                        className="w-full py-2 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-amber-500/50"
                      >
                        <option value="تويوتا">تويوتا (Toyota)</option>
                        <option value="هيونداي">هيونداي (Hyundai)</option>
                        <option value="كيا">كيا (Kia)</option>
                        <option value="نيسان">نيسان (Nissan)</option>
                        <option value="هوندا">هوندا (Honda)</option>
                        <option value="لكزس">لكزس (Lexus)</option>
                        <option value="فورد">فورد (Ford)</option>
                        <option value="شيفروليه">شيفروليه (Chevrolet)</option>
                        <option value="أخرى">شركة أخرى</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">الموديل *</label>
                      <input
                        type="text"
                        placeholder="مثال: كورولا"
                        value={newCarModel}
                        onChange={(e) => setNewCarModel(e.target.value)}
                        className="w-full py-2 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">السنوات *</label>
                      <input
                        type="text"
                        placeholder="مثال: 2018-2022"
                        value={newCarYears}
                        onChange={(e) => setNewCarYears(e.target.value)}
                        className="w-full py-2 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">المحرك (اختياري)</label>
                      <input
                        type="text"
                        placeholder="مثال: 1.8L"
                        value={newCarEngine}
                        onChange={(e) => setNewCarEngine(e.target.value)}
                        className="w-full py-2 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCar}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ربط هذه السيارة بالقطعة
                  </button>
                </div>

                {/* Linked cars list tag */}
                {formCars.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formCars.map((car, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-800 border border-slate-750 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs"
                      >
                        <span className="font-bold text-amber-500">{car.brand}</span>
                        <span className="text-slate-200">{car.model}</span>
                        <span className="text-slate-400">({car.years})</span>
                        {car.engine && <span className="text-slate-500 font-mono text-[10px]">{car.engine}</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveCar(idx)}
                          className="text-red-400 hover:text-red-300 font-mono text-sm pr-1 border-r border-slate-700 mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/20 text-center text-slate-500 text-xs italic rounded-xl border border-slate-850">
                    الرجاء ربط سيارة متوافقة واحدة على الأقل باستخدام النموذج أعلاه.
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="space-y-2 border-t border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">ملاحظات فنية إضافية</h4>
                <textarea
                  placeholder="أدخل هنا ملاحظات فنية حول التركيب أو القطع المتوافقة أو نصائح للموظفين..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full h-24 p-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-amber-500/50 outline-none text-slate-200 text-sm"
                />
              </div>
            </form>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePart}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-lg transition-colors"
              >
                <Save className="w-4.5 h-4.5" />
                حفظ وحفظ البيانات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
