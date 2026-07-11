/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompatibleCar {
  brand: string;      // الماركة (مثال: تويوتا)
  model: string;      // الموديل (مثال: كورولا)
  years: string;      // السنوات (مثال: 2018-2022)
  engine?: string;    // المحرك إن وجد (مثال: 1.8L)
}

export interface Part {
  id: string;
  name: string;               // اسم القطعة الرئيسي
  aliases: string[];          // الأسماء البديلة/المرادفات لتسهيل البحث
  partNumber: string;         // رقم القطعة الأصلي
  altNumbers: string[];       // الأرقام البديلة المتوافقة
  compatibleCars: CompatibleCar[];
  sellingPrice: number;       // سعر البيع
  buyingPrice: number;        // سعر الشراء (للمشرف فقط)
  quantity: number;           // الكمية المتوفرة
  location?: string;          // موقع القطعة (الرف/المستودع)
  image?: string;             // صورة القطعة (رابط أو base64 أو اسم تصنيف)
  category: string;           // تصنيف القطعة (فرامل، فلاتر، محرك، إلخ)
  notes?: string;             // ملاحظات إضافية
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: "text" | "camera" | "smart";
  timestamp: string;
  resultsCount: number;
}

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
}

export interface InvoiceItem {
  partId: string;
  name: string;
  partNumber: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice?: number; // سعر الشراء في وقت البيع لحساب الأرباح بدقة (اختياري)
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  totalAmount: number; // إجمالي المبيعات
  totalCost?: number;  // إجمالي رأس المال (تكلفة الشراء) (اختياري)
  profit?: number;     // صافي الأرباح (المكسب) (اختياري)
  timestamp: string;
  sellerName: string;
  clientName?: string;
}
