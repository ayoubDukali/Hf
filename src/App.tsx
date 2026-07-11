/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, Camera, Sparkles, Wrench, Database, History, AlertCircle, FileText, Cpu, Package, CheckCircle, BarChart3, HelpCircle, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Part, SearchHistoryItem, User, Invoice, InvoiceItem } from "./types";
import { SEED_PARTS } from "./data/seedData";
import Scanner from "./components/Scanner";
import AdminPanel from "./components/AdminPanel";
import PartDetails from "./components/PartDetails";
import PartImage from "./components/PartImage";
import VisualMatcher from "./components/VisualMatcher";
import { LogOut, Lock, User as UserIcon, LogIn, UserPlus, RefreshCw, Radio, ShoppingCart, Receipt, Calendar, UserCheck, Plus, Trash2, Check, Sparkles as SparklesIcon, FileSpreadsheet, Printer } from "lucide-react";
import alNasoorLogo from "./assets/images/al_nasoor_logo_1783518647369.jpg";
import { bluetoothPrinter } from "./utils/bluetoothPrinter";

// Helper function to compress and resize image base64 on client-side
const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<"user" | "admin">("user");
  const [authAdminCode, setAuthAdminCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // State for parts database
  const [parts, setParts] = useState<Part[]>([]);
  // State for search history log
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  // Invoices list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  // Shopping Cart / Current Invoice items
  const [salesCart, setSalesCart] = useState<InvoiceItem[]>([]);
  
  // Current view tab
  const [activeTab, setActiveTab] = useState<"search" | "admin" | "invoices">("search");
  
  // Invoice filter ("mine" to see current account's invoices, "all" to see all)
  const [invoiceFilter, setInvoiceFilter] = useState<"mine" | "all">("all");

  // Dynamically set default invoice filter on login based on user role
  useEffect(() => {
    if (currentUser) {
      setInvoiceFilter(currentUser.role === "admin" ? "all" : "mine");
    }
  }, [currentUser]);
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [smartSearchEnabled, setSmartSearchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBulkScanning, setIsBulkScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showClearInvoicesConfirm, setShowClearInvoicesConfirm] = useState(false);
  
  // Invoice states
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  
  // Scanned image preview & matching states for Invoices/Sales tab
  const [invoiceScannedImage, setInvoiceScannedImage] = useState<string | null>(null);
  const [isInvoiceScanning, setIsInvoiceScanning] = useState<boolean>(false);
  const [invoiceScanStatus, setInvoiceScanStatus] = useState<string | null>(null);
  const [invoiceScanFeedback, setInvoiceScanFeedback] = useState<{ visualDescription: string; matchedCount: number; unmatched: string[] } | null>(null);
  
  // Traditional Invoice Editable Fields
  const [clientName, setClientName] = useState("زبون نقدي");
  const [invoiceNumberInput, setInvoiceNumberInput] = useState("1002");
  const [invoiceDateInput, setInvoiceDateInput] = useState(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [printTargetInvoice, setPrintTargetInvoice] = useState<Invoice | null>(null);
  
  // Bluetooth Thermal Printer States
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState("");
  const [btPaperSize, setBtPaperSize] = useState<"58" | "80">("58");
  const [autoPrintBluetooth, setAutoPrintBluetooth] = useState(false);
  const [isConnectingBt, setIsConnectingBt] = useState(false);
  
  // Search results
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [searchExplanation, setSearchExplanation] = useState<Record<string, string>>({});
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem("smart_motor_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse saved user:", err);
      }
    }
  }, []);

  // Fetch Parts from Server
  const fetchParts = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (err) {
      console.error("Failed to fetch parts from server:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Fetch Search History from Server
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history from server:", err);
    }
  };

  // Fetch Invoices from Server
  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        // Automatically suggest next traditional invoice number
        setInvoiceNumberInput((1001 + data.length).toString());
      }
    } catch (err) {
      console.error("Failed to fetch invoices from server:", err);
    }
  };

  // Synchronize parts, history and invoices with the server when logged in
  useEffect(() => {
    if (currentUser) {
      fetchParts(true);
      fetchHistory();
      fetchInvoices();

      // Silent background sync every 8 seconds
      const syncInterval = setInterval(() => {
        fetchParts(false);
        fetchInvoices();
      }, 8000);

      return () => clearInterval(syncInterval);
    }
  }, [currentUser]);

  // Cart & Invoices Operations
  const addToCart = (part: Part, qty: number = 1) => {
    setSalesCart((prev) => {
      const existing = prev.find((item) => item.partId === part.id);
      if (existing) {
        // limit by available stock
        const newQty = Math.min(part.quantity, existing.quantity + qty);
        return prev.map((item) =>
          item.partId === part.id
            ? { ...item, quantity: newQty, total: Math.round(newQty * item.sellingPrice * 100) / 100 }
            : item
        );
      } else {
        const itemQty = Math.min(part.quantity, qty);
        const newItem: InvoiceItem = {
          partId: part.id,
          name: part.name,
          partNumber: part.partNumber,
          quantity: itemQty > 0 ? itemQty : 1, // allow at least 1 even if out of stock, user priority
          sellingPrice: part.sellingPrice,
          buyingPrice: part.buyingPrice,
          total: Math.round((itemQty > 0 ? itemQty : 1) * part.sellingPrice * 100) / 100,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartQuantity = (partId: string, qty: number) => {
    const part = parts.find((p) => p.id === partId);
    const maxQty = part ? part.quantity : 999;
    const finalQty = Math.max(1, Math.min(maxQty, qty));
    setSalesCart((prev) =>
      prev.map((item) =>
        item.partId === partId
          ? { ...item, quantity: finalQty, total: Math.round(finalQty * item.sellingPrice * 100) / 100 }
          : item
      )
    );
  };

  const removeFromCart = (partId: string) => {
    setSalesCart((prev) => prev.filter((item) => item.partId !== partId));
  };

  const handleBulkOcrAndAdd = async (base64Image: string) => {
    setIsInvoiceScanning(true);
    setInvoiceScanStatus("جاري تحسين وضغط الصورة محلياً لضمان السرعة والدقة الفائقة... ⚡");
    setInvoiceScanFeedback(null);
    setErrorMessage(null);

    try {
      // Step 1: Compress image client-side to standard web format (~200KB-400KB instead of 10MB+)
      const compressedImage = await compressImage(base64Image);
      setInvoiceScannedImage(compressedImage);

      // Step 2: visual match
      setInvoiceScanStatus("جاري تحليل المعالم البصرية للقطع ومطابقتها مع قاعدة بيانات المخزن السحابية...");
      
      const res = await fetch("/api/match-part-by-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedImage }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل تحليل الصورة بأسلوب المطابقة البصرية");
      }

      setInvoiceScanStatus("جاري معالجة نتائج المطابقة وتلقيم القطع في السلة الحالية...");
      const matchData = await res.json();
      const detectedParts = matchData.detectedParts || [];
      const visualDescription = matchData.visualDescription || "تم فحص البضاعة بنجاح بفضل تقنيات الرؤية الحاسوبية من Gemini.";
      
      let matchedCount = 0;
      let nonMatchedNames: string[] = [];
      const addedItemsInfo: string[] = [];

      detectedParts.forEach((det: any) => {
        // 1. Try exact ID match first
        let matchedPart = det.id ? parts.find(p => p.id === det.id) : null;
        
        // Helper function to normalize serial/OEM numbers to solve OCR mistakes
        const normalize = (val: string): string => {
          return val
            .toLowerCase()
            .replace(/[osilzb]/g, (char) => {
              if (char === 'o') return '0';
              if (char === 's') return '5';
              if (char === 'i' || char === 'l') return '1';
              if (char === 'z') return '2';
              if (char === 'b') return '8';
              return char;
            })
            .replace(/[^a-z0-9]/g, "");
        };

        // 2. Advanced fuzzy and serial search fallback if not matched by ID
        if (!matchedPart) {
          const searchTokens: string[] = [];
          if (det.id) searchTokens.push(normalize(det.id));
          if (det.nameInImage) {
            searchTokens.push(normalize(det.nameInImage));
            // Extract any serial-like words (combinations of letters and numbers)
            const serialCandidate = det.nameInImage.match(/[a-zA-Z0-9-]{4,15}/g);
            if (serialCandidate) {
              serialCandidate.forEach(c => searchTokens.push(normalize(c)));
            }
          }

          matchedPart = parts.find(p => {
            const dbPartNo = normalize(p.partNumber);
            const dbAlts = (p.altNumbers || []).map(alt => normalize(alt));
            const dbName = p.name.toLowerCase();
            const dbAliases = (p.aliases || []).map(a => a.toLowerCase());

            // Match based on serial numbers
            const matchesSerial = searchTokens.some(token => 
              token.length > 3 && (
                token === dbPartNo || dbPartNo.includes(token) || token.includes(dbPartNo) ||
                dbAlts.includes(token) || dbAlts.some(alt => alt.includes(token) || token.includes(alt))
              )
            );
            if (matchesSerial) return true;

            // Match based on name similarity
            if (det.nameInImage) {
              const nameInImageLower = det.nameInImage.toLowerCase();
              if (dbName.includes(nameInImageLower) || nameInImageLower.includes(dbName)) return true;
              if (dbAliases.some(alias => alias.includes(nameInImageLower) || nameInImageLower.includes(alias))) return true;
            }

            return false;
          });
        }

        if (matchedPart && (det.score >= 35 || matchedPart)) {
          const qtyToAdd = det.detectedQty && det.detectedQty > 0 ? det.detectedQty : 1;
          addToCart(matchedPart, qtyToAdd);
          matchedCount++;
          addedItemsInfo.push(`"${matchedPart.name}" (الكمية: ${qtyToAdd})`);
        } else if (det.nameInImage) {
          nonMatchedNames.push(det.nameInImage);
        }
      });

      setInvoiceScanFeedback({
        visualDescription,
        matchedCount,
        unmatched: nonMatchedNames
      });

      // Show temporary alert or status
      if (matchedCount > 0) {
        console.log(`تم التعرف على عدد ${matchedCount} قطع وإضافتها للسلة.`);
      } else {
        alert("تنبيه: لم نعثر على قطع في الصورة تطابق المخزن الحالي بدقة كافية.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "حدث خطأ أثناء قراءة الفاتورة بالذكاء الاصطناعي");
      alert(`حدث خطأ أثناء التحليل البصري: ${err.message || err}`);
    } finally {
      setIsInvoiceScanning(false);
      setInvoiceScanStatus(null);
    }
  };
  
  // Bluetooth Thermal Printer Helpers
  const handleConnectBluetoothPrinter = async () => {
    setIsConnectingBt(true);
    try {
      const name = await bluetoothPrinter.connect();
      setBtConnected(true);
      setBtDeviceName(name);
      alert(`🔌 تم ربط الطابعة بنجاح: ${name}`);
    } catch (err: any) {
      setBtConnected(false);
      setBtDeviceName("");
      alert(`❌ فشل ربط الطابعة: ${err.message}`);
    } finally {
      setIsConnectingBt(false);
    }
  };

  const handleDisconnectBluetoothPrinter = () => {
    bluetoothPrinter.disconnect();
    setBtConnected(false);
    setBtDeviceName("");
    alert("🔌 تم فصل الطابعة.");
  };

  const handleBluetoothPrint = async (invoice: any) => {
    try {
      const printData = {
        shopName: "محل النسور لقطع غيار الهوندا",
        shopSubtitle: "لتجارة قطع غيار السيارات ومستلزماتها الأصلية والممتازة",
        shopAddress: "المملكة العربية السعودية - الرياض",
        invoiceNumber: invoice.invoiceNumber || "INV-TEMP",
        dateStr: invoice.timestamp ? new Date(invoice.timestamp).toLocaleDateString("ar-SA") : new Date().toLocaleDateString("ar-SA"),
        clientName: invoice.clientName || "زبون نقدي",
        sellerName: invoice.sellerName || "بائع مجهول",
        items: invoice.items.map((item: any) => ({
          name: item.name || item.partName || "قطعة غيار",
          quantity: item.quantity,
          price: item.selectedPrice || item.sellingPrice || 0,
          total: item.total || (item.quantity * (item.selectedPrice || item.sellingPrice || 0))
        })),
        totalAmount: invoice.totalAmount
      };

      await bluetoothPrinter.printBitmap(printData, btPaperSize);
    } catch (err: any) {
      console.error("Bluetooth print error:", err);
      alert(`⚠️ فشل الطباعة عبر البلوتوث: ${err.message}`);
    }
  };

  const submitInvoice = async () => {
    if (salesCart.length === 0) {
      alert("السلة فارغة! الرجاء إضافة قطع أولاً قبل إتمام البيع.");
      return;
    }

    const totalAmount = salesCart.reduce((sum, item) => sum + item.total, 0);
    const newInvoice = {
      items: salesCart,
      totalAmount,
      sellerName: currentUser?.username || "بائع مجهول",
      clientName: clientName || "زبون نقدي",
      invoiceNumber: invoiceNumberInput ? `INV-${invoiceNumberInput}` : undefined,
    };

    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل تسجيل الفاتورة على الخادم");
      }

      // Success
      const resultData = await res.json();
      alert(`🎉 تم إتمام عملية البيع بنجاح! رقم الفاتورة: ${resultData.invoice.invoiceNumber}`);
      
      // Automatic Bluetooth Printing if enabled
      if (autoPrintBluetooth && btConnected) {
        handleBluetoothPrint(resultData.invoice);
      }

      setSalesCart([]); // clear cart
      fetchInvoices();  // refresh invoices
      fetchParts();     // refresh parts stock
      setActiveTab("invoices"); // switch to invoices to see it!
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Submit Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword) {
      setAuthError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
      setCurrentUser(data.user);
      localStorage.setItem("smart_motor_user", JSON.stringify(data.user));
      setAuthUsername("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword) {
      setAuthError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    if (authRole === "admin" && authAdminCode !== "123123") {
      setAuthError("رمز تأكيد المشرف غير صحيح! يرجى إدخال الرمز الصحيح (123123) لإنشاء حساب مشرف.");
      return;
    }
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: authUsername, 
          password: authPassword, 
          role: authRole,
          adminCode: authAdminCode
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطأ أثناء إنشاء الحساب");
      }
      setCurrentUser(data.user);
      localStorage.setItem("smart_motor_user", JSON.stringify(data.user));
      setAuthUsername("");
      setAuthPassword("");
      setAuthAdminCode("");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("smart_motor_user");
    setActiveTab("search");
  };

  // Add search entry to history on server
  const addHistoryItem = async (query: string, searchType: "text" | "camera" | "smart", count: number) => {
    const newItem: SearchHistoryItem = {
      id: "hist-" + Date.now(),
      query: query,
      searchType: searchType,
      timestamp: new Date().toISOString(),
      resultsCount: count
    };
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to add history item to server:", err);
    }
  };

  // Trigger search whenever searchQuery or smartSearchEnabled changes
  useEffect(() => {
    executeSearch();
  }, [searchQuery, smartSearchEnabled, parts]);

  const executeSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
      setSearchResults([]);
      setSearchExplanation({});
      return;
    }

    setErrorMessage(null);

    // If smart search is enabled, execute server side AI matchmaking
    if (smartSearchEnabled) {
      // Don't search automatically on single character keypresses to prevent high server rate limits
      if (query.length < 3) return;
      
      setIsLoading(true);
      try {
        const res = await fetch("/api/smart-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery, parts: parts }),
        });

        if (!res.ok) {
          throw new Error("فشلت عملية المطابقة الذكية من الخادم");
        }

        const data = await res.json();
        
        // Map matches back to parts
        const explanationMap: Record<string, string> = {};
        const matchedParts: Part[] = [];

        if (data.matches && Array.isArray(data.matches)) {
          // Sort parts according to Gemini score
          const sortedMatches = data.matches
            .filter((m: any) => m.score >= 30) // Filter weak matches
            .sort((a: any, b: any) => b.score - a.score);

          sortedMatches.forEach((match: any) => {
            const part = parts.find(p => p.id === match.id);
            if (part) {
              matchedParts.push(part);
              explanationMap[part.id] = match.reason;
            }
          });
        }

        setSearchResults(matchedParts);
        setSearchExplanation(explanationMap);
        addHistoryItem(searchQuery, "smart", matchedParts.length);
      } catch (err: any) {
        console.error("Smart search failed, falling back to local search:", err);
        setErrorMessage("تعذر الاتصال بمحرك البحث الذكي. تم تفعيل البحث المحلي البديل تلقائياً.");
        runLocalSearch(query);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Normal instant local search
      runLocalSearch(query);
    }
  };

  const runLocalSearch = (query: string) => {
    // 1. Exact or partial part number match (highest priority)
    // 2. Name or alias match
    // 3. Car compatibility match
    const matched = parts.filter(part => {
      // Part number match
      if (part.partNumber.toLowerCase().includes(query) || 
          part.altNumbers.some(alt => alt.toLowerCase().includes(query))) {
        return true;
      }

      // Name or alias/synonyms match
      if (part.name.toLowerCase().includes(query) || 
          part.aliases.some(alias => alias.toLowerCase().includes(query))) {
        return true;
      }

      // Compatible cars match
      const matchedCar = part.compatibleCars.some(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.years.toLowerCase().includes(query) ||
        (car.engine && car.engine.toLowerCase().includes(query))
      );

      return matchedCar;
    });

    setSearchResults(matched);
    setSearchExplanation({});
    
    // Throttle logging to history only if query changed intentionally
    if (query.length > 2) {
      // We log in parent component or directly with debounce
    }
  };

  // Triggered when camera OCR extracts a code
  const handleCameraCodeDetected = (code: string) => {
    setSearchQuery(code);
    setSmartSearchEnabled(false); // Switch to part number search instantly
    addHistoryItem(`كاميرا: ${code}`, "camera", 1);
  };

  // Inventory modifications handlers (passed to Admin Panel)
  const handleAddPart = async (newPart: Part) => {
    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPart),
      });
      if (res.ok) {
        fetchParts(false);
      } else {
        const errData = await res.json();
        alert("فشل إضافة القطعة: " + errData.error);
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء الاتصال بالخادم: " + err.message);
    }
  };

  const handleUpdatePart = async (updatedPart: Part) => {
    try {
      const res = await fetch(`/api/parts/${updatedPart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPart),
      });
      if (res.ok) {
        fetchParts(false);
        if (selectedPart?.id === updatedPart.id) {
          setSelectedPart(updatedPart);
        }
      } else {
        const errData = await res.json();
        alert("فشل تعديل القطعة: " + errData.error);
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء الاتصال بالخادم: " + err.message);
    }
  };

  const handleDeletePart = async (id: string) => {
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchParts(false);
        if (selectedPart?.id === id) {
          setSelectedPart(null);
        }
      } else {
        const errData = await res.json();
        alert("فشل حذف القطعة: " + errData.error);
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء الاتصال بالخادم: " + err.message);
    }
  };

  const handleImportDatabase = async (importedParts: Part[]) => {
    // For bulk import, we can loop or do server-side setup. Since this is simple, we will do sequential POSTs or a simple bulk replace. Let's send them sequentially for simplicity.
    setIsLoading(true);
    try {
      for (const part of importedParts) {
        await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(part),
        });
      }
      fetchParts(true);
    } catch (err: any) {
      alert("خطأ أثناء الاستيراد: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch("/api/history/clear", {
        method: "POST",
      });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // Get statistics for the dashboard cards
  const stats = {
    totalParts: parts.length,
    lowStock: parts.filter(p => p.quantity > 0 && p.quantity <= 3).length,
    outOfStock: parts.filter(p => p.quantity === 0).length,
    categories: new Set(parts.map(p => p.category)).size
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans justify-center items-center p-4 selection:bg-amber-500/30 selection:text-amber-200 relative" dir="rtl">
        {/* Decorative background lights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-850 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-amber-500/10 mx-auto bg-slate-950">
              <img 
                src={alNasoorLogo} 
                alt="شعار النسور" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <h1 className="font-sans font-extrabold text-2xl text-slate-100">النسور لقطع الغيار</h1>
              <p className="text-xs text-slate-400 font-medium">نظام إدارة وبحث قطع غيار السيارات السحابي المتزامن</p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-850">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === "login" 
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === "register" 
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              إنشاء حساب جديد
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={authMode === "login" ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">اسم المستخدم</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="مثال: ahmad_car"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-850 hover:border-slate-750 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-xl text-sm transition-all placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block">كلمة المرور (الرمز)</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-850 hover:border-slate-750 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-xl text-sm transition-all placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            {authMode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">نوع الحساب والصلاحية</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setAuthRole("user"); setAuthAdminCode(""); }}
                    className={`py-2.5 px-4 border text-xs font-bold rounded-xl transition-all ${
                      authRole === "user"
                        ? "bg-slate-800 border-amber-500 text-amber-400 shadow-sm"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    مستخدم عادي (عرض وبحث)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthRole("admin")}
                    className={`py-2.5 px-4 border text-xs font-bold rounded-xl transition-all ${
                      authRole === "admin"
                        ? "bg-slate-800 border-amber-500 text-amber-400 shadow-sm"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    مشرف / مدير (تعديل وإضافة)
                  </button>
                </div>
              </div>
            )}

            {authMode === "register" && authRole === "admin" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-amber-500 block">رمز تأكيد المشرف الخاص (المطلوب)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-amber-500/60 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={authAdminCode}
                    onChange={(e) => setAuthAdminCode(e.target.value)}
                    placeholder="أدخل الرمز السري (123123)"
                    className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-amber-500/30 hover:border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-300 rounded-xl text-sm transition-all placeholder:text-amber-500/20 outline-none font-mono"
                  />
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 outline-none mt-2"
            >
              {isAuthLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحقق والاتصال...
                </>
              ) : authMode === "login" ? (
                "تسجيل الدخول"
              ) : (
                "إنشاء الحساب والبدء"
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-850/60">
            تنبيه: الاتصال بالإنترنت مفعل، يتم حفظ ومزامنة جميع البيانات في قاعدة البيانات السحابية المركزية فوراً لتتمكن من الوصول إليها من أي هاتف آخر.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 animate-fadeIn" dir="rtl">
      
      {/* Top Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-800 shadow-lg shadow-amber-500/10 bg-slate-950">
                <img 
                  src={alNasoorLogo} 
                  alt="شعار النسور" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                  النسور لقطع الغيار <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-medium">إصدار 2.5 سحابي</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">مزامنة سحابية فورية ومطابقة قطع غيار بالذكاء الاصطناعي</p>
              </div>
            </div>

            {/* Mobile Connected Badge & Logout combo */}
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-1 rounded-lg text-[9px] font-bold animate-pulse">
                <Radio className="w-3 h-3" />
                <span>متصل</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-[10px] font-bold border border-red-500/15 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3 h-3" />
                <span>خروج</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls & Desktop Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold animate-pulse ml-2">
                <Radio className="w-3.5 h-3.5" />
                <span>متصل</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === "search"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>البحث والاستعلام</span>
                </button>

                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all relative ${
                    activeTab === "invoices"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>ركن الفواتير والمبيعات</span>
                  {salesCart.length > 0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {salesCart.length}
                    </span>
                  )}
                </button>

                {currentUser.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === "admin"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>لوحة التحكم والمخزون</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop User display & Logout */}
            <div className="hidden sm:flex items-center gap-2 mr-1 sm:mr-2 border-r border-slate-800 pr-1 sm:pr-2 shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                مرحباً، <span className="text-slate-200 font-bold">{currentUser.username}</span> 
                {currentUser.role === "admin" ? " (مشرف)" : " (بائع)"}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all text-xs font-bold border border-red-500/15 cursor-pointer"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {activeTab === "search" ? (
          /* SEARCH VIEW */
          <div className="space-y-8">
            
            {/* Quick stats widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">القطع المسجلة</span>
                  <span className="text-lg font-bold text-slate-200">{stats.totalParts} قطع</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">منخفضة المخزن</span>
                  <span className="text-lg font-bold text-amber-400">{stats.lowStock} قطع</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">منتهية بالكامل</span>
                  <span className="text-lg font-bold text-red-400">{stats.outOfStock} قطع</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">التصنيفات الموفرة</span>
                  <span className="text-lg font-bold text-cyan-400">{stats.categories} أقسام</span>
                </div>
              </div>
            </div>

            {/* Giant search section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
              
              <div className="space-y-2 text-center md:text-right">
                <h2 className="font-sans font-black text-2xl text-slate-100 flex items-center gap-2.5 justify-center md:justify-start">
                  أسرع نظام بحث ذكي لقطع الغيار 🚘
                </h2>
                <p className="text-sm text-slate-400">ابحث باسم القطعة (مثل: فحمات، فلتر زيت)، برقمها الأصلي، أو بالتقاط صورة للملصق.</p>
              </div>

              {/* Main input composite field */}
              <div className="space-y-4">
                <div className="relative flex flex-col md:flex-row gap-2">
                  
                  {/* Text Input */}
                  <div className="relative flex-1">
                    <Search className="absolute right-4 top-4 text-slate-500 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اكتب اسم القطعة بالعامية أو رقمها الأصلي (مثال: سيفون كورولا 2020)..."
                      className="w-full py-3.5 pr-12 pl-12 bg-slate-950 border-2 border-slate-800 focus:border-amber-500 rounded-2xl outline-none font-sans text-slate-100 placeholder-slate-600 transition-all text-sm sm:text-base shadow-inner"
                    />
                    
                    {/* Camera snapshot trigger inside input */}
                    <button
                      type="button"
                      onClick={() => setIsScanning(true)}
                      className="absolute left-3.5 top-3 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-amber-500 hover:text-amber-400 rounded-xl transition-all"
                      title="تصوير ملصق القطعة بالكاميرا"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search mode / action buttons */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="md:hidden py-2 px-4 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* Gemini smart semantic match toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">محرك المطابقة الدلالية الذكي (AI Smart Search)</h4>
                      <p className="text-[11px] text-slate-400">يفهم اللهجة المحلية (مثل: سيفون، بريك، جامبينات) ويتحقق من مطابقة سنوات الموديل لسيارتك.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">مفتاح التبديل:</span>
                    <button
                      onClick={() => setSmartSearchEnabled(!smartSearchEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        smartSearchEnabled ? "bg-cyan-500" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                          smartSearchEnabled ? "-translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning error if API falls back */}
              {errorMessage && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Results section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-lg text-slate-200">
                  {searchQuery 
                    ? `نتائج البحث عن "${searchQuery}" (${searchResults.length} قطعة)` 
                    : "اكتب شيئاً أعلاه للبدء بالبحث في مخزن القطع"
                  }
                </h3>
                {smartSearchEnabled && searchQuery && (
                  <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-cyan-500/20">
                    <Cpu className="w-3.5 h-3.5 animate-spin" /> مفعّل بالكامل بواسطة Gemini 3.5
                  </span>
                )}
              </div>

              {isLoading ? (
                /* Loading State Animation */
                <div className="p-16 flex flex-col items-center justify-center gap-4 bg-slate-900/20 border border-slate-900 rounded-3xl">
                  <RefreshCwSpinner className="w-10 h-10 text-amber-500" />
                  <span className="text-sm text-slate-400 animate-pulse">جاري مطابقة استعلامك في قاعدة بيانات المخزون...</span>
                </div>
              ) : searchResults.length > 0 ? (
                /* Search results display */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(part => (
                    <motion.div
                      layoutId={`part-card-${part.id}`}
                      key={part.id}
                      onClick={() => setSelectedPart(part)}
                      className={`p-5 bg-slate-900 hover:bg-slate-850/80 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between gap-4 group ${
                        selectedPart?.id === part.id ? "border-amber-500 ring-1 ring-amber-500" : "border-slate-850"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 shrink-0">
                          <PartImage category={part.category} image={part.image} className="w-full h-full p-2" />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{part.category}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              part.quantity > 5 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                : part.quantity > 0 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                : "bg-red-500/10 text-red-400 border border-red-500/15"
                            }`}>
                              {part.quantity > 0 ? `متوفر: ${part.quantity} حبة` : "نفدت الكمية"}
                            </span>
                          </div>

                          <h4 className="font-sans font-bold text-base text-slate-100 group-hover:text-amber-500 transition-colors mt-1">{part.name}</h4>
                          <p className="text-xs font-mono text-slate-500">OEM: <span className="text-slate-300 font-bold">{part.partNumber}</span></p>
                        </div>
                      </div>

                      {/* Display compatible cars preview */}
                      <div className="flex flex-wrap gap-1.5 border-t border-slate-800/60 pt-3">
                        <span className="text-[10px] text-slate-500 font-medium py-0.5">التوافق:</span>
                        {part.compatibleCars.slice(0, 3).map((car, idx) => (
                          <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-slate-400">
                            {car.brand} {car.model} ({car.years})
                          </span>
                        ))}
                        {part.compatibleCars.length > 3 && (
                          <span className="text-[10px] text-amber-500 font-bold">+ {part.compatibleCars.length - 3} موديلات أخرى</span>
                        )}
                      </div>

                      {/* Display price & match details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/40 mt-1">
                        <div className="text-xs text-slate-400">سعر البيع: <span className="text-emerald-400 font-extrabold text-sm font-mono">{part.sellingPrice} د.ل</span></div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(part, 1);
                              alert(`تم إضافة قطعة "${part.name}" إلى سلة البيع بنجاح! يمكنك مراجعتها وإتمام البيع من "ركن الفواتير والمبيعات" بالرأس.`);
                            }}
                            disabled={part.quantity === 0}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              part.quantity > 0
                                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/10"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>إضافة للسلة</span>
                          </button>
                          <span className="text-[11px] text-amber-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 font-sans">
                            التفاصيل ←
                          </span>
                        </div>
                      </div>

                      {/* Gemini Match Reason details if smart search is enabled */}
                      {smartSearchEnabled && searchExplanation[part.id] && (
                        <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[11px] text-cyan-300 leading-relaxed mt-2 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div>{searchExplanation[part.id]}</div>
                        </div>
                      )}

                    </motion.div>
                  ))}
                </div>
              ) : searchQuery.length > 2 ? (
                /* No Results fallback */
                <div className="p-12 text-center space-y-3 bg-slate-900/10 border border-slate-900 rounded-3xl">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400">عذراً، لم نتمكن من العثور على أي قطعة متطابقة.</p>
                  <p className="text-xs text-slate-500">حاول البحث باستخدام كلمة رئيسية أخرى مثل "فحمات" أو تفقد قائمة السيارات المتوافقة.</p>
                </div>
              ) : (
                /* Search Guide screen */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-amber-500">💡 بحث بالمرادفات العامية</div>
                    <p className="text-xs text-slate-400 leading-relaxed">يدعم المحرك البحث بالأسماء الشعبية السائدة في محلات قطع الغيار مثل "سيفون، صفاية، قماشات، مساعد، مقص، رديتر".</p>
                  </div>
                  <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-amber-500">📸 قراءة الصور بالذكاء الاصطناعي</div>
                    <p className="text-xs text-slate-400 leading-relaxed">انقر على رمز الكاميرا لتصوير ملصق رقم القطعة أو الكرتون وسيقوم Gemini باستخراج الرموز والأرقام الطويلة تلقائياً.</p>
                  </div>
                  <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-amber-500">⚙️ التوافق مع موديلات السيارات</div>
                    <p className="text-xs text-slate-400 leading-relaxed">يمكنك كتابة اسم السيارة والموديل وسنة الصنع مباشرة مثل "سيفون كامري 2017" وسيقوم المحرك الذكي بربطها بالقطع المتطابقة.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Part specifications details container */}
            <AnimatePresence>
              {selectedPart && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="pt-4"
                >
                  <PartDetails 
                    part={selectedPart} 
                    showAdminPrices={currentUser?.role === "admin"} 
                    onClose={() => setSelectedPart(null)} 
                    onAddToCart={addToCart}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : activeTab === "invoices" ? (
          /* INVOICES AND SALES VIEW */
          <div className="space-y-8 animate-fadeIn" dir="rtl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Right Column (Sales Setup & Cart): col-span-7 */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Brand Banner / Section Title */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="font-sans font-black text-xl text-slate-100 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-amber-500" />
                        سلة مبيعات الزبون وتصوير الفاتورة
                      </h2>
                      <p className="text-xs text-slate-400">سجل عمليات البيع، التقط صور كرتون قطع الزبون، وأصدر فواتير فورية متزامنة.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Mobile/Camera File Input */}
                      <label className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>تصوير البضاعة بالكامل 📸</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                handleBulkOcrAndAdd(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* Desktop Web camera trigger */}
                      <button
                        onClick={() => setIsBulkScanning(true)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="استخدام كاميرا الكمبيوتر للمسح"
                      >
                        <Radio className="w-4 h-4 text-emerald-400" />
                        <span>مسح كاميرا الويب</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visual Capture & Analysis Feedback section */}
                {invoiceScannedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-500 animate-pulse" />
                        <h3 className="font-sans font-bold text-sm text-slate-200">الصورة الملتقطة للبضاعة والتحليل البصري المباشر</h3>
                      </div>
                      <button
                        onClick={() => {
                          setInvoiceScannedImage(null);
                          setInvoiceScanFeedback(null);
                        }}
                        className="text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        إغلاق العرض ×
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Image Preview Container */}
                      <div className="w-full sm:w-1/3 h-48 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40 relative group shadow-inner shrink-0">
                        <img
                          src={invoiceScannedImage}
                          alt="البضاعة الملتقطة"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {isInvoiceScanning && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center gap-3">
                            <RefreshCwSpinner className="w-7 h-7 text-amber-500" />
                            <span className="text-[10px] text-slate-300 font-bold animate-pulse">جاري فحص المعالم...</span>
                          </div>
                        )}
                      </div>

                      {/* AI Analysis Details */}
                      <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        {isInvoiceScanning ? (
                          <div className="space-y-3 py-4">
                            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                              <span>{invoiceScanStatus || "جاري معالجة الصورة..."}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                              <motion.div
                                className="h-full bg-amber-500 rounded-full"
                                animate={{ width: ["10%", "90%"] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              يقوم نموذج الذكاء الاصطناعي Gemini حالياً بمسح الصورة والتعرف على كراتين قطع الغيار وعلاماتها التجارية، ثم مطابقتها مع السجلات المتوفرة في قاعدة البيانات لإضافتها فوراً لسلتك.
                            </p>
                          </div>
                        ) : invoiceScanFeedback ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed">
                              <span className="font-bold text-amber-500 block mb-1">📝 الوصف البصري للبضاعة:</span>
                              {invoiceScanFeedback.visualDescription}
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                                ✓ تم التعرف على: {invoiceScanFeedback.matchedCount} قطع مسجلة
                              </span>
                              {invoiceScanFeedback.unmatched.length > 0 && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
                                  ⚠️ قطع لم تطابق المخزن: {invoiceScanFeedback.unmatched.length}
                                </span>
                              )}
                            </div>

                            {invoiceScanFeedback.unmatched.length > 0 && (
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                تلميح: القطع غير المطابقة ({invoiceScanFeedback.unmatched.join(", ")}) قد تكون غير مسجلة في المخزن أو لم يتم ربط أرقامها التسلسلية بشكل كامل. يمكنك إضافتها يدوياً من لوحة التحكم.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-500 text-xs">
                            بانتظار بدء تحليل الذكاء الاصطناعي...
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. Cart Items */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-sans font-bold text-base text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span>مكونات السلة الحالية</span>
                    <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-mono font-medium">
                      {salesCart.reduce((sum, item) => sum + item.quantity, 0)} قطع
                    </span>
                  </h3>

                  {salesCart.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-slate-950/20 border border-slate-850 border-dashed rounded-2xl">
                      <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto" />
                      <p className="text-sm font-semibold text-slate-400">السلة فارغة حالياً</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        قم بالبحث عن قطع الغيار من تبويب "البحث والاستعلام" وانقر على "إضافة للسلة"، أو استخدم ميزة تصوير البضاعة أعلاه لتلقيمها تلقائياً.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/15">
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="py-3 px-3">القطعة</th>
                                <th className="py-3 px-3 text-center">الكمية المطلوبة</th>
                                <th className="py-3 px-3 text-left">سعر الوحدة</th>
                                <th className="py-3 px-3 text-left">المجموع</th>
                                <th className="py-3 px-3 text-center">حذف</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {salesCart.map((item) => {
                                const matchedPart = parts.find((p) => p.id === item.partId);
                                const availableStock = matchedPart ? matchedPart.quantity : 999;
                                return (
                                  <tr key={item.partId} className="hover:bg-slate-850/10">
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                          <PartImage category={matchedPart?.category || "أخرى"} image={matchedPart?.image} className="w-full h-full p-1 object-cover" />
                                        </div>
                                        <div>
                                          <span className="font-semibold text-slate-200 block">{item.name}</span>
                                          <span className="text-[10px] text-slate-500 block font-mono">OEM: {item.partNumber}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => updateCartQuantity(item.partId, item.quantity - 1)}
                                          className="w-6.5 h-6.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="1"
                                          max={availableStock}
                                          value={item.quantity}
                                          onChange={(e) => updateCartQuantity(item.partId, parseInt(e.target.value) || 1)}
                                          className="w-12 text-center bg-slate-950 border border-slate-800 rounded py-0.5 text-xs font-bold text-slate-100"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateCartQuantity(item.partId, item.quantity + 1)}
                                          className="w-6.5 h-6.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-left font-mono font-medium text-slate-300">{item.sellingPrice} د.ل</td>
                                    <td className="py-3 px-3 text-left font-mono font-bold text-emerald-400">{item.total} د.ل</td>
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeFromCart(item.partId)}
                                        className="text-red-400 hover:text-red-300 p-1 bg-red-500/5 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4 mx-auto" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary calculations card */}
                      <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                        {showClearCartConfirm ? (
                          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/20 p-1.5 rounded-xl animate-pulse">
                            <span className="text-[10px] font-bold text-red-300">تفريغ السلة؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSalesCart([]);
                                setShowClearCartConfirm(false);
                              }}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer"
                            >
                              نعم، تفريغ ⚠️
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowClearCartConfirm(false)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowClearCartConfirm(true)}
                            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>تفريغ السلة</span>
                          </button>
                        )}

                        <div className="text-right space-y-1">
                          <span className="text-[10px] text-slate-500 block">الإجمالي الكلي للفاتورة</span>
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            {salesCart.reduce((sum, item) => sum + item.total, 0)} <span className="text-xs font-medium">د.ل</span>
                          </span>
                        </div>
                      </div>

                      {/* Finalize button */}
                      <button
                        type="button"
                        onClick={submitInvoice}
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? (
                          <RefreshCwSpinner className="w-5 h-5 text-slate-950" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                        <span>إتمام عملية البيع وحفظ الفاتورة سحابياً 💾</span>
                      </button>

                      {/* Beautiful Paper Invoice Preview Section (Booklet Ledger layout) */}
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h4 className="font-sans font-bold text-sm text-slate-200">نموذج ومعاينة الفاتورة الورقية (الأصلية) 📝</h4>
                          <span className="text-[10px] bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">فاتورة رقم: {invoiceNumberInput}</span>
                        </div>

                        {/* Inline controls to customize the paper invoice header live */}
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                          <div className="space-y-1.5">
                            <label className="text-slate-500 block text-[10px] flex items-center justify-between">
                              <span>مطلوب من السادة (اسم العميل):</span>
                              <span className="text-[9px] text-slate-400">اختر بسرعة:</span>
                            </label>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              placeholder="زبون نقدي"
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setClientName("زبون نقدي")}
                                className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                                  clientName === "زبون نقدي"
                                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm"
                                    : "bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <span>💵 زبون نقدي</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setClientName("زبون بطاقة")}
                                className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                                  clientName === "زبون بطاقة"
                                    ? "bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow-sm"
                                    : "bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <span>💳 زبون بطاقة</span>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 block text-[10px]">رقم الفاتورة:</label>
                            <input
                              type="text"
                              value={invoiceNumberInput}
                              onChange={(e) => setInvoiceNumberInput(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 block text-[10px]">تاريخ الفاتورة:</label>
                            <input
                              type="date"
                              value={invoiceDateInput}
                              onChange={(e) => setInvoiceDateInput(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                        </div>

                        {/* Bluetooth Thermal Printer Management Box */}
                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <Radio className={`w-3.5 h-3.5 ${btConnected ? "text-emerald-500 animate-pulse" : "text-slate-500"}`} />
                              طابعة الفواتير الحرارية (Bluetooth) 🖨️
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              btConnected 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-slate-900 text-slate-500 border border-slate-800"
                            }`}>
                              {btConnected ? "متصلة" : "غير متصلة"}
                            </span>
                          </div>

                          {btConnected ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500">اسم الجهاز المتصل:</p>
                                  <p className="font-bold text-slate-200 text-xs">{btDeviceName}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleDisconnectBluetoothPrinter}
                                  className="py-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  فصل الطابعة 🔌
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-500 block">عرض ورق الطباعة:</label>
                                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => setBtPaperSize("58")}
                                      className={`flex-1 py-1 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                                        btPaperSize === "58" ? "bg-slate-800 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-400"
                                      }`}
                                    >
                                      58 مم (صغير)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBtPaperSize("80")}
                                      className={`flex-1 py-1 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                                        btPaperSize === "80" ? "bg-slate-800 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-400"
                                      }`}
                                    >
                                      80 مم (كبير)
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-500 block">الطباعة التلقائية عند البيع:</label>
                                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => setAutoPrintBluetooth(true)}
                                      className={`flex-1 py-1 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                                        autoPrintBluetooth ? "bg-amber-500 text-slate-950 shadow-sm font-black" : "text-slate-500 hover:text-slate-400"
                                      }`}
                                    >
                                      تفعيل ⚡
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAutoPrintBluetooth(false)}
                                      className={`flex-1 py-1 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                                        !autoPrintBluetooth ? "bg-slate-800 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-400"
                                      }`}
                                    >
                                      إيقاف
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const tempInvoice = {
                                    items: salesCart.length > 0 ? salesCart : [
                                      { name: "تجربة طباعة (هوندا أصلية)", quantity: 1, selectedPrice: 0.0, total: 0.0 }
                                    ],
                                    totalAmount: salesCart.reduce((sum, i) => sum + i.total, 0),
                                    invoiceNumber: invoiceNumberInput ? `INV-${invoiceNumberInput}` : undefined,
                                    clientName: clientName || "زبون نقدي",
                                    sellerName: currentUser?.username || "بائع مجهول"
                                  };
                                  handleBluetoothPrint(tempInvoice);
                                }}
                                className="w-full py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>تجربة طباعة الفاتورة الحالية بالبلوتوث 🖨️</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleConnectBluetoothPrinter}
                              disabled={isConnectingBt}
                              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-200"
                            >
                              {isConnectingBt ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                  <span>جاري الاتصال بالطابعة...</span>
                                </>
                              ) : (
                                <>
                                  <Radio className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                                  <span>ربط طابعة حرارية عبر البلوتوث 🔌</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Print triggering button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintTargetInvoice(null);
                            setTimeout(() => {
                              window.print();
                            }, 150);
                          }}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/15"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة هذه الفاتورة فوراً 🖨️</span>
                        </button>

                        {/* Traditional Paper Booklet Layout (Matches requested style exactly) */}
                        <div className="bg-white text-black border-2 border-slate-400 rounded-2xl p-6 shadow-md relative overflow-hidden font-sans space-y-4">
                          {/* Booklet header style */}
                          <div className="flex justify-between items-start border-b border-black pb-3">
                            <div>
                              <h5 className="font-sans font-black text-base text-slate-900">محل النسور لقطع غيار الهوندا</h5>
                              <p className="text-[9px] text-slate-600 leading-relaxed mt-0.5">لتجارة قطع غيار السيارات ومستلزماتها الأصلية والممتازة</p>
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] font-bold border border-black px-2 py-0.5 rounded bg-slate-100">فاتورة مبيعات</span>
                            </div>
                          </div>

                          {/* Paper metadata block */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] border border-black p-2 bg-slate-50 rounded">
                            <div className="space-y-1">
                              <div>
                                مطلوب من السادة /{" "}
                                <span 
                                  onClick={() => setClientName(prev => prev === "زبون نقدي" ? "زبون بطاقة" : "زبون نقدي")}
                                  className="font-extrabold cursor-pointer hover:bg-amber-100 px-1 py-0.5 rounded transition-colors select-none inline-flex items-center gap-1 border border-dashed border-slate-300 hover:border-amber-500"
                                  title="اضغط هنا للتبديل السريع بين نقدي وبطاقة"
                                >
                                  {clientName}
                                </span>
                              </div>
                              <div>الموظف المسؤول / <span className="font-bold">{currentUser?.username || "بائع مجهول"}</span></div>
                            </div>
                            <div className="space-y-1 text-left">
                              <div>رقم الفاتورة / <span className="font-mono font-bold">INV-{invoiceNumberInput}</span></div>
                              <div>تاريخ الفاتورة / <span className="font-mono font-bold">{new Date(invoiceDateInput).toLocaleDateString("ar-SA")}</span></div>
                            </div>
                          </div>

                          {/* Traditional ledger booklet table */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-2 border-black border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-slate-200 text-black border-b border-black h-8 text-center font-bold">
                                  <th className="border-r border-black w-8">م</th>
                                  <th className="border-r border-black">البيان</th>
                                  <th className="border-r border-black w-14">الكمية</th>
                                  <th className="border-r border-black w-18">السعر</th>
                                  <th className="w-20">القيمة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const maxRows = 10;
                                  return Array.from({ length: maxRows }).map((_, i) => {
                                    const item = salesCart[i];
                                    if (item) {
                                      return (
                                        <tr key={i} className="h-7 border-b border-black text-black font-semibold text-center">
                                          <td className="border-r border-black bg-slate-100/50 font-bold">{i + 1}</td>
                                          <td className="border-r border-black px-2 text-right font-bold text-slate-900">{item.name}</td>
                                          <td className="border-r border-black font-mono font-bold">{item.quantity}</td>
                                          <td className="border-r border-black font-mono">{item.sellingPrice}</td>
                                          <td className="font-mono font-bold text-slate-950">{item.total}</td>
                                        </tr>
                                      );
                                    } else {
                                      return (
                                        <tr key={i} className="h-7 border-b border-black">
                                          <td className="border-r border-black text-transparent">-</td>
                                          <td className="border-r border-black text-transparent">-</td>
                                          <td className="border-r border-black text-transparent">-</td>
                                          <td className="border-r border-black text-transparent">-</td>
                                          <td className="text-transparent">-</td>
                                        </tr>
                                      );
                                    }
                                  });
                                })()}
                                {/* Grand Total ledger row */}
                                <tr className="h-8 font-bold bg-slate-200 text-black border-t border-black">
                                  <td colSpan={4} className="border-r border-black text-center font-extrabold text-[11px]">اجمالي الفاتورة (Total)</td>
                                  <td className="text-center font-mono font-black text-slate-950">{salesCart.reduce((sum, item) => sum + item.total, 0)} د.ل</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Stamp / Signature section */}
                          <div className="grid grid-cols-2 gap-4 text-[9px] pt-2 border-t border-dashed border-slate-300">
                            <div>توقيع المستلم: .........................</div>
                            <div className="text-left">ختم واعتماد المبيعات: .........................</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Left Column (Invoices registry): col-span-5 */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                  
                  {/* Search and Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-bold text-base text-slate-100 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-500" />
                        ركن الفواتير المسجلة
                      </h3>
                      <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-mono font-medium">
                        {
                          invoices.filter((inv) => {
                            if (currentUser?.role !== "admin" || invoiceFilter === "mine") {
                              return inv.sellerName === currentUser?.username;
                            }
                            return true;
                          }).length
                        } فواتير
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">ابحث عن الفواتير السابقة برقمها أو باسم الموظف البائع.</p>

                    <div className="relative">
                      <Search className="absolute right-3 top-3 text-slate-500 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="ابحث برقم الفاتورة أو البائع..."
                        value={invoiceSearchQuery}
                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Account Invoice Partition Toggles */}
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setInvoiceFilter("mine")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        invoiceFilter === "mine"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>فواتير حسابي الخاص 👤</span>
                      <span className="bg-slate-900/40 text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {invoices.filter(i => i.sellerName === currentUser?.username).length}
                      </span>
                    </button>
                    
                    {currentUser?.role === "admin" ? (
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter("all")}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                          invoiceFilter === "all"
                            ? "bg-amber-500 text-slate-950 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>كافة فواتير الموظفين 🌐</span>
                        <span className="bg-slate-900/40 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {invoices.length}
                        </span>
                      </button>
                    ) : (
                      <div className="flex-1 py-1.5 px-3 text-slate-600 text-[10px] font-bold flex items-center justify-center gap-1 cursor-not-allowed border border-dashed border-slate-850 rounded-lg">
                        <span>فواتير الموظفين (للمشرفين) 🔒</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Dashboard Widget (ويطلع المكسب ويطلع راس المال) */}
                  {(() => {
                    const shownInvoices = invoices.filter((inv) => {
                      if (currentUser?.role !== "admin" || invoiceFilter === "mine") {
                        if (inv.sellerName !== currentUser?.username) return false;
                      }
                      if (!invoiceSearchQuery) return true;
                      const q = invoiceSearchQuery.toLowerCase();
                      return (
                        inv.invoiceNumber.toLowerCase().includes(q) ||
                        inv.sellerName.toLowerCase().includes(q) ||
                        inv.items.some((item) => item.name.toLowerCase().includes(q) || item.partNumber.toLowerCase().includes(q))
                      );
                    });

                    const statsSummary = shownInvoices.reduce(
                      (acc, inv) => {
                        const cost = inv.totalCost !== undefined 
                          ? inv.totalCost 
                          : inv.items.reduce((sum, item) => sum + (item.buyingPrice || 0) * item.quantity, 0);
                        const profit = inv.profit !== undefined 
                          ? inv.profit 
                          : inv.totalAmount - cost;
                        
                        return {
                          sales: acc.sales + inv.totalAmount,
                          cost: acc.cost + cost,
                          profit: acc.profit + profit,
                        };
                      },
                      { sales: 0, cost: 0, profit: 0 }
                    );

                    return (
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-850 rounded-xl p-3 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 block font-bold">المبيعات</span>
                          <span className="text-xs font-black text-emerald-400 font-mono block">
                            {statsSummary.sales} د.ل
                          </span>
                        </div>
                        <div className="space-y-0.5 border-r border-slate-850/60">
                          <span className="text-[9px] text-slate-400 block font-bold">رأس المال (التكلفة)</span>
                          <span className="text-xs font-black text-slate-300 font-mono block">
                            {statsSummary.cost} د.ل
                          </span>
                        </div>
                        <div className="space-y-0.5 border-r border-slate-850/60">
                          <span className="text-[9px] text-slate-400 block font-bold">الأرباح (المكسب)</span>
                          <span className="text-xs font-black text-amber-500 font-mono block">
                            {statsSummary.profit} د.ل
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Previous Invoices log items */}
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {(() => {
                      const list = invoices.filter((inv) => {
                        if (currentUser?.role !== "admin" || invoiceFilter === "mine") {
                          if (inv.sellerName !== currentUser?.username) return false;
                        }
                        if (!invoiceSearchQuery) return true;
                        const q = invoiceSearchQuery.toLowerCase();
                        return (
                          inv.invoiceNumber.toLowerCase().includes(q) ||
                          inv.sellerName.toLowerCase().includes(q) ||
                          inv.items.some((item) => item.name.toLowerCase().includes(q) || item.partNumber.toLowerCase().includes(q))
                        );
                      });

                      if (list.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-500 text-xs italic">
                            لا يوجد أي فواتير مطابقة لبحثك حالياً.
                          </div>
                        );
                      }

                      return list.map((inv) => {
                        const isExpanded = expandedInvoiceId === inv.id;
                        return (
                          <div key={inv.id} className="bg-slate-950/40 border border-slate-850 rounded-xl overflow-hidden transition-all">
                            {/* Invoice main header strip */}
                            <div
                              onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-950/80 transition-colors"
                            >
                              <div className="space-y-1">
                                <span className="text-xs font-black text-amber-500 font-mono tracking-wider">{inv.invoiceNumber}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <Calendar className="w-3 h-3 text-slate-600" />
                                  <span>{new Date(inv.timestamp).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-200 block font-mono">{inv.totalAmount} د.ل</span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 justify-end">
                                  <UserCheck className="w-3 h-3 text-slate-600" />
                                  <span>البائع: {inv.sellerName}</span>
                                </div>
                              </div>
                            </div>

                              {/* Collapsible itemized details */}
                              {isExpanded && (
                                <div className="border-t border-slate-850 bg-slate-950/70 p-4 space-y-3 animate-slideDown">
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 block">تفاصيل القطع المباعة:</span>
                                    <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-850/50">
                                      {inv.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-900 last:border-0">
                                          <div>
                                            <span className="text-slate-200 font-bold">{item.name}</span>
                                            <span className="text-slate-500 block font-mono text-[9px]">OEM: {item.partNumber}</span>
                                          </div>
                                          <div className="text-left">
                                            <span className="text-slate-300">{item.quantity} حبة × {item.sellingPrice} د.ل</span>
                                            <span className="text-emerald-400 font-bold block font-mono">{item.total} د.ل</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Invoice Financial Breakdown (Profit & Cost) */}
                                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850/50 text-[10px]">
                                    <div className="text-center">
                                      <span className="text-slate-500 block">قيمة الفاتورة</span>
                                      <span className="font-bold text-emerald-400 font-mono text-xs">{inv.totalAmount} د.ل</span>
                                    </div>
                                    <div className="text-center border-r border-slate-900">
                                      <span className="text-slate-500 block">رأس المال (التكلفة)</span>
                                      <span className="font-bold text-slate-300 font-mono text-xs">
                                        {inv.totalCost !== undefined ? inv.totalCost : inv.items.reduce((sum, item) => sum + (item.buyingPrice || 0) * item.quantity, 0)} د.ل
                                      </span>
                                    </div>
                                    <div className="text-center border-r border-slate-900">
                                      <span className="text-slate-500 block">الأرباح (المكسب)</span>
                                      <span className="font-bold text-amber-500 font-mono text-xs">
                                        {inv.profit !== undefined ? inv.profit : (inv.totalAmount - inv.items.reduce((sum, item) => sum + (item.buyingPrice || 0) * item.quantity, 0))} د.ل
                                      </span>
                                    </div>
                                  </div>

                                  {/* Print single invoice button using reliable state-based printing */}
                                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPrintTargetInvoice(inv);
                                        setTimeout(() => {
                                          window.print();
                                        }, 150);
                                      }}
                                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>طباعة هذه الفاتورة الرسمية (الورقية) 🖨️</span>
                                    </button>

                                    {btConnected && (
                                      <button
                                        type="button"
                                        onClick={() => handleBluetoothPrint(inv)}
                                        className="flex-1 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>طباعة بلوتوث حرارية 🖨️</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                    })()}
                  </div>

                  {/* Administrator Reset Invoices option */}
                  {currentUser.role === "admin" && invoices.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      {showClearInvoicesConfirm ? (
                        <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl space-y-2 text-center animate-pulse">
                          <p className="text-[11px] font-bold text-red-300">⚠️ مسح الفواتير بالكامل من السحاب؟ لا يمكن التراجع!</p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/invoices/clear", { method: "POST" });
                                  if (res.ok) {
                                    alert("تم تصفير سجل الفواتير والمبيعات بنجاح.");
                                    fetchInvoices();
                                    setShowClearInvoicesConfirm(false);
                                  } else {
                                    alert("فشل مسح السجل.");
                                  }
                                } catch (err: any) {
                                  alert(`خطأ: ${err.message}`);
                                }
                              }}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-slate-950 text-xs font-black rounded-lg cursor-pointer"
                            >
                              تأكيد مسح السحاب 🗑️
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowClearInvoicesConfirm(false)}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              تراجع
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowClearInvoicesConfirm(true)}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          تصفير ومسح كافة الفواتير 🗑️
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ADMIN VIEW */
          <AdminPanel
            parts={parts}
            history={history}
            onAddPart={handleAddPart}
            onUpdatePart={handleUpdatePart}
            onDeletePart={handleDeletePart}
            onImportDatabase={handleImportDatabase}
            onClearHistory={handleClearHistory}
          />
        )}

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          نظام المحرك الذكي لإدارة قطع الغيار والبحث المتقدم - {new Date().getFullYear()} م. متصل بالشبكة السحابية ومزامن عبر كافة الهواتف والأجهزة.
        </div>
      </footer>

      {/* Camera OCR Scanner Modal overlay */}
      {isScanning && (
        <Scanner
          onScanCompleted={handleCameraCodeDetected}
          onClose={() => setIsScanning(false)}
        />
      )}

      {/* Camera OCR Scanner for bulk items */}
      {isBulkScanning && (
        <Scanner
          onScanCompleted={(code) => {
            const matchedPart = parts.find(p => {
              const cleanCode = code.replace(/[-\s]/g, "").toUpperCase();
              const mainNo = p.partNumber.replace(/[-\s]/g, "").toUpperCase();
              const matchesMain = mainNo.includes(cleanCode) || cleanCode.includes(mainNo);
              const matchesAlt = p.altNumbers.some(alt => {
                const cleanAlt = alt.replace(/[-\s]/g, "").toUpperCase();
                return cleanAlt.includes(cleanCode) || cleanCode.includes(cleanAlt);
              });
              return matchesMain || matchesAlt;
            });
            if (matchedPart) {
              addToCart(matchedPart, 1);
              alert(`تم إضافة قطعة "${matchedPart.name}" إلى السلة بنجاح!`);
            } else {
              alert(`تم مسح الرمز "${code}" بنجاح ولكن لم يتم العثور على قطعة مطابقة في المخزن.`);
            }
          }}
          onClose={() => setIsBulkScanning(false)}
        />
      )}

      {/* Hidden Printable Invoice for physical printing (mimicking the traditional ledger book) */}
      <div id="printable-invoice" className="hidden print:block bg-white text-black p-8 font-sans" dir="rtl">
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            #printable-invoice {
              display: block !important;
              visibility: visible !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">محل النسور لقطع غيار الهوندا</h1>
            <p className="text-xs text-slate-600 mt-1">قطع غيار السيارات ومستلزماتها الأصلية والممتازة</p>
            <p className="text-[10px] text-slate-500">المملكة العربية السعودية - الرياض</p>
          </div>
          <div className="text-left">
            <div className="inline-block border border-black p-1.5 px-4 rounded font-bold text-xs bg-slate-100">
              فاتورة مبيعات مبسطة
            </div>
          </div>
        </div>

        {/* Invoice Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-black p-3 bg-slate-50/50 rounded">
          <div className="space-y-1.5">
            <div>
              <span className="font-bold text-slate-700">مطلوب من السادة / </span>
              <span className="font-extrabold text-slate-900">
                {printTargetInvoice ? (printTargetInvoice.clientName || "زبون نقدي") : clientName}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">الموظف المسؤول / </span>
              <span className="font-semibold text-slate-900">
                {printTargetInvoice ? printTargetInvoice.sellerName : (currentUser?.username || "بائع مجهول")}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 text-left">
            <div>
              <span className="font-bold text-slate-700">رقم الفاتورة / </span>
              <span className="font-mono font-black text-slate-900">
                {printTargetInvoice ? printTargetInvoice.invoiceNumber : `INV-${invoiceNumberInput}`}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">تاريخ الإصدار / </span>
              <span className="font-mono font-semibold text-slate-900">
                {printTargetInvoice 
                  ? new Date(printTargetInvoice.timestamp).toLocaleDateString("ar-SA") 
                  : new Date(invoiceDateInput).toLocaleDateString("ar-SA")}
              </span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <table className="w-full border-2 border-black border-collapse text-xs">
          <thead>
            <tr className="bg-slate-200 text-black border-b-2 border-black h-9 text-center font-bold">
              <th className="border-r border-black w-10">م</th>
              <th className="border-r border-black">البيان (تفاصيل البضاعة المباعة)</th>
              <th className="border-r border-black w-20">الكمية</th>
              <th className="border-r border-black w-24">السعر</th>
              <th className="w-28">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const activeItems = printTargetInvoice ? printTargetInvoice.items : salesCart;
              const maxPrintRows = Math.max(12, activeItems.length);
              return Array.from({ length: maxPrintRows }).map((_, i) => {
                const item = activeItems[i];
                if (item) {
                  return (
                    <tr key={i} className="h-8 border-b border-black text-black font-bold text-center">
                      <td className="border-r border-black bg-slate-50">{i + 1}</td>
                      <td className="border-r border-black px-3 text-right">
                        <span>{item.name}</span>
                        {item.partNumber && <span className="text-[10px] text-slate-600 block font-mono">OEM: {item.partNumber}</span>}
                      </td>
                      <td className="border-r border-black font-mono">{item.quantity}</td>
                      <td className="border-r border-black font-mono">{item.sellingPrice} د.ل</td>
                      <td className="font-mono font-black">{item.total} د.ل</td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={i} className="h-8 border-b border-black text-center">
                      <td className="border-r border-black text-transparent bg-slate-50/20">-</td>
                      <td className="border-r border-black text-transparent">-</td>
                      <td className="border-r border-black text-transparent">-</td>
                      <td className="border-r border-black text-transparent">-</td>
                      <td className="text-transparent">-</td>
                    </tr>
                  );
                }
              });
            })()}
            {/* Grand Total Row */}
            <tr className="h-9 font-bold bg-slate-200 text-black border-t-2 border-black text-center">
              <td colSpan={4} className="border-r border-black font-black text-xs">
                إجـمـالـي الـفـاتـورة (Total Amount)
              </td>
              <td className="font-black font-mono text-xs">
                {printTargetInvoice 
                  ? printTargetInvoice.totalAmount 
                  : salesCart.reduce((sum, item) => sum + item.total, 0)} د.ل
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer legal & signatures */}
        <div className="grid grid-cols-2 gap-8 text-[11px] mt-10">
          <div className="space-y-1">
            <p className="font-bold">توقيع المستلم:</p>
            <p className="text-slate-400 font-mono">..................................................</p>
          </div>
          <div className="space-y-1 text-left">
            <p className="font-bold">ختم وتوقيع البائع المسؤول:</p>
            <p className="text-slate-400 font-mono">..................................................</p>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-500 border-t border-dashed border-slate-300 pt-4 mt-8">
          محل النسور لقطع غيار الهوندا - شكرًا لتعاملكم معنا ونرجو زيارتنا مجددًا
        </div>
      </div>

    </div>
  );
}

// Simple Helper spinner component
function RefreshCwSpinner({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
