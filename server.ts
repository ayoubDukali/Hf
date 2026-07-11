/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { SEED_PARTS } from "./src/data/seedData";

// Load environment variables
dotenv.config();

// Define database paths
const PARTS_FILE = path.join(process.cwd(), "parts_db.json");
const USERS_FILE = path.join(process.cwd(), "users_db.json");
const HISTORY_FILE = path.join(process.cwd(), "history_db.json");
const INVOICES_FILE = path.join(process.cwd(), "invoices_db.json");

// Helper function to initialize files
const initDatabase = () => {
  if (!fs.existsSync(PARTS_FILE)) {
    fs.writeFileSync(PARTS_FILE, JSON.stringify(SEED_PARTS, null, 2), "utf8");
    console.log("Initialized parts database with seed data.");
  }
  if (!fs.existsSync(USERS_FILE)) {
    // Default admin user
    const defaultUsers = [
      { id: "usr-admin", username: "admin", password: "123", role: "admin" }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf8");
    console.log("Initialized users database with default admin user.");
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf8");
    console.log("Initialized history database.");
  }
  if (!fs.existsSync(INVOICES_FILE)) {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2), "utf8");
    console.log("Initialized invoices database.");
  }
};

// Call database initializer
initDatabase();

// Helper database read/write functions
const readParts = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(PARTS_FILE, "utf8"));
  } catch (e) {
    console.error("Error reading parts DB, recovering with seed data:", e);
    return SEED_PARTS;
  }
};

const writeParts = (parts: any[]) => {
  fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2), "utf8");
};

const readUsers = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
};

const writeUsers = (users: any[]) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

const readHistory = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch (e) {
    return [];
  }
};

const writeHistory = (history: any[]) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
};

const readInvoices = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(INVOICES_FILE, "utf8"));
  } catch (e) {
    return [];
  }
};

const writeInvoices = (invoices: any[]) => {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf8");
};

// Shared Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY environment variable is not defined. AI features will be unavailable.");
}

// Robust helper to perform Gemini API generation with exponential backoff retries and model fallbacks
async function generateContentWithRetry(options: {
  model: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = [options.model, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const currentModel of uniqueModels) {
    let delay = 500;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (!ai) {
          throw new Error("AI service is not initialized");
        }
        console.log(`Calling Gemini API using model: ${currentModel} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          ...options,
          model: currentModel,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMessage = String(error?.message || error || "");
        console.warn(`Attempt ${attempt + 1} with model ${currentModel} failed:`, errorMessage);

        // Check if the error is transient/recoverable
        const isTransient = errorMessage.includes("503") || 
                            errorMessage.includes("temporary") || 
                            errorMessage.includes("RESOURCE_EXHAUSTED") ||
                            errorMessage.includes("UNAVAILABLE") ||
                            errorMessage.includes("high demand") ||
                            error?.status === "UNAVAILABLE" ||
                            error?.code === 503 ||
                            error?.code === 429;

        if (isTransient && attempt < 2) {
          console.log(`Transient error detected. Waiting ${delay}ms before next retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 3; // Exponential backoff
        } else {
          // Break the retry loop to try the next fallback model
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after trying multiple models and retries");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", ai_available: !!ai });
  });

  // API Route: User Registration
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, password, role, adminCode } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      if (role === "admin") {
        if (!adminCode || adminCode !== "123123") {
          return res.status(400).json({ error: "رمز تأكيد المشرف غير صحيح! يرجى إدخال الرمز الصحيح (123123) لإنشاء حساب مشرف." });
        }
      }

      const users = readUsers();
      const lowerUsername = username.trim().toLowerCase();
      
      const exists = users.some(u => u.username.toLowerCase() === lowerUsername);
      if (exists) {
        return res.status(400).json({ error: "اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر" });
      }

      const newUser = {
        id: "usr-" + Date.now(),
        username: username.trim(),
        password: password, // Storing plain text password for simplicity in this local applet context
        role: role === "admin" ? "admin" : "user"
      };

      users.push(newUser);
      writeUsers(users);

      res.json({ 
        success: true, 
        user: { id: newUser.id, username: newUser.username, role: newUser.role } 
      });
    } catch (err: any) {
      res.status(500).json({ error: "فشل إنشاء الحساب: " + err.message });
    }
  });

  // API Route: User Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      const users = readUsers();
      const lowerUsername = username.trim().toLowerCase();

      const user = users.find(u => u.username.toLowerCase() === lowerUsername && u.password === password);
      if (!user) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role } 
      });
    } catch (err: any) {
      res.status(500).json({ error: "فشل تسجيل الدخول: " + err.message });
    }
  });

  // API Route: Get all parts
  app.get("/api/parts", (req, res) => {
    try {
      const parts = readParts();
      res.json(parts);
    } catch (err: any) {
      res.status(500).json({ error: "فشل جلب قطع الغيار: " + err.message });
    }
  });

  // API Route: Add a new part
  app.post("/api/parts", (req, res) => {
    try {
      const newPart = req.body;
      if (!newPart || !newPart.name || !newPart.partNumber) {
        return res.status(400).json({ error: "بيانات القطعة غير مكتملة (الاسم ورقم القطعة مطلوبان)" });
      }

      const parts = readParts();
      // Ensure unique ID
      newPart.id = "part-" + Date.now();
      
      parts.unshift(newPart);
      writeParts(parts);

      res.json({ success: true, part: newPart });
    } catch (err: any) {
      res.status(500).json({ error: "فشل إضافة القطعة: " + err.message });
    }
  });

  // API Route: Update an existing part
  app.put("/api/parts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedPart = req.body;
      if (!updatedPart) {
        return res.status(400).json({ error: "بيانات القطعة فارغة" });
      }

      const parts = readParts();
      const index = parts.findIndex(p => p.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: "القطعة المطلوبة غير موجودة" });
      }

      parts[index] = { ...parts[index], ...updatedPart, id }; // retain ID
      writeParts(parts);

      res.json({ success: true, part: parts[index] });
    } catch (err: any) {
      res.status(500).json({ error: "فشل تحديث القطعة: " + err.message });
    }
  });

  // API Route: Delete an existing part
  app.delete("/api/parts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const parts = readParts();
      const filtered = parts.filter(p => p.id !== id);
      
      if (filtered.length === parts.length) {
        return res.status(404).json({ error: "القطعة المطلوبة غير موجودة" });
      }

      writeParts(filtered);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "فشل حذف القطعة: " + err.message });
    }
  });

  // API Route: Get Search History
  app.get("/api/history", (req, res) => {
    try {
      const history = readHistory();
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: "فشل جلب سجل البحث: " + err.message });
    }
  });

  // API Route: Save Search History Item
  app.post("/api/history", (req, res) => {
    try {
      const newItem = req.body;
      if (!newItem || !newItem.query) {
        return res.status(400).json({ error: "بيانات سجل الاستعلام غير صحيحة" });
      }

      const history = readHistory();
      const updatedHistory = [newItem, ...history].slice(0, 50);
      writeHistory(updatedHistory);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "فشل حفظ السجل: " + err.message });
    }
  });

  // API Route: Clear Search History
  app.post("/api/history/clear", (req, res) => {
    try {
      writeHistory([]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "فشل مسح السجل: " + err.message });
    }
  });

  // API Route: Get Invoices
  app.get("/api/invoices", (req, res) => {
    try {
      const invoices = readInvoices();
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: "فشل جلب الفواتير: " + err.message });
    }
  });

  // API Route: Create Invoice & Deduct stock
  app.post("/api/invoices", (req, res) => {
    try {
      const newInvoice = req.body;
      if (!newInvoice || !newInvoice.items || !Array.isArray(newInvoice.items)) {
        return res.status(400).json({ error: "بيانات الفاتورة غير صحيحة" });
      }

      // Read current invoices
      const invoices = readInvoices();
      
      // Auto-assign ID and Invoice Number if not present
      if (!newInvoice.id) {
        newInvoice.id = "inv-" + Date.now();
      }
      if (!newInvoice.invoiceNumber) {
        const nextNum = 1001 + invoices.length;
        newInvoice.invoiceNumber = `INV-${nextNum}`;
      }
      if (!newInvoice.timestamp) {
        newInvoice.timestamp = new Date().toISOString();
      }

      // Calculate cost/profit based on parts catalog without modifying parts inventory (Do not change inventory)
      const parts = readParts();
      let calculatedCost = 0;
      let calculatedTotal = 0;

      newInvoice.items.forEach((item: any) => {
        const part = parts.find((p: any) => p.id === item.partId || p.partNumber === item.partNumber);
        if (part) {
          // Set or verify buyingPrice from DB
          item.buyingPrice = part.buyingPrice || 0;
          // Calculate total for this item
          item.total = Math.round(item.quantity * item.sellingPrice * 100) / 100;
          
          calculatedCost += Math.round(item.quantity * item.buyingPrice * 100) / 100;
          calculatedTotal += item.total;
          
          // Do NOT deduct quantity (user specifically requested not to change the inventory)
        } else {
          // Fallback if part not found in DB
          if (item.buyingPrice === undefined) {
            item.buyingPrice = 0;
          }
          item.total = Math.round(item.quantity * item.sellingPrice * 100) / 100;
          calculatedCost += Math.round(item.quantity * item.buyingPrice * 100) / 100;
          calculatedTotal += item.total;
        }
      });

      // Record final totals on the Invoice with absolute rounding precision
      newInvoice.totalAmount = Math.round(calculatedTotal * 100) / 100;
      newInvoice.totalCost = Math.round(calculatedCost * 100) / 100;
      newInvoice.profit = Math.round((newInvoice.totalAmount - newInvoice.totalCost) * 100) / 100;

      // Save invoice
      const updatedInvoices = [newInvoice, ...invoices];
      writeInvoices(updatedInvoices);

      res.json({ success: true, invoice: newInvoice });
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      res.status(500).json({ error: "فشل حفظ الفاتورة: " + err.message });
    }
  });

  // API Route: Clear Invoices
  app.post("/api/invoices/clear", (req, res) => {
    try {
      writeInvoices([]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "فشل مسح الفواتير: " + err.message });
    }
  });

  // API Route: Image OCR (Extract part numbers from camera/photo)
  app.post("/api/ocr", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "خدمة الذكاء الاصطناعي غير متوفرة حالياً لعدم تكوين مفتاح API" });
      }

      const { image } = req.body; // base64 representation of image
      if (!image) {
        return res.status(400).json({ error: "لم يتم تزويد أي صورة للتحليل" });
      }

      // Extract base64 clean data (remove mime prefix if present)
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

      const prompt = `This is an image of a car spare part, its container, or a sticker label. 
      Please identify and extract any part numbers, OEM codes, serial numbers, barcodes, or text that represents the part number.
      Search for codes resembling:
      - XXXXX-XXXXX (e.g., 90915-YZZD2, 04465-33480)
      - Standard alphanumeric part serials (e.g., FK20HR11, 7PK2090, 58101-H8A00).
      
      Return the output as a simple JSON object containing a list of identified codes and a confidence rating (0 to 1).
      JSON schema to return:
      {
        "codes": ["extracted_code_1", "extracted_code_2"],
        "confidence": 0.9,
        "description": "Arabic summary of what is seen in the image, e.g. علبة زيت محرك تويوتا برقم..."
      }
      Do not include any backticks or markdown, return pure JSON text only.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              codes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "الرموز وأرقام القطع المستخرجة من الصورة",
              },
              confidence: {
                type: Type.NUMBER,
                description: "نسبة الثقة في استخراج الرموز بين 0 و 1",
              },
              description: {
                type: Type.STRING,
                description: "وصف باللغة العربية للقطعة أو النص المقروء من الملصق",
              },
            },
            required: ["codes", "confidence", "description"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم يتم استلام استجابة صالحة من نموذج الذكاء الاصطناعي");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("OCR API error:", error);
      res.status(500).json({ error: "فشل استخراج الرمز من الصورة: " + error.message });
    }
  });

  // API Route: Image Spare Part Visual Matching (visual recognition and comparison with DB parts)
  app.post("/api/match-part-by-image", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "خدمة الذكاء الاصطناعي غير متوفرة حالياً لعدم تكوين مفتاح API" });
      }

      const { image } = req.body; // base64 representation of image
      if (!image) {
        return res.status(400).json({ error: "لم يتم تزويد أي صورة للتحليل البصري" });
      }

      // Extract base64 clean data (remove mime prefix if present)
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

      // Get all parts from DB to match against
      const parts = readParts();
      const partsListForAi = parts.map(p => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        altNumbers: p.altNumbers,
        category: p.category,
        sellingPrice: p.sellingPrice,
        compatibleCars: p.compatibleCars,
        quantity: p.quantity,
        notes: p.notes
      }));

      const prompt = `You are an expert car spare parts warehouse management AI.
      The user has taken a photo containing one or multiple car spare parts, products, branding packages, boxes, or serial stickers.
      
      Your goal is to identify EVERY single spare part/product visible in the photo and map it with high accuracy to our inventory database:
      ${JSON.stringify(partsListForAi, null, 2)}
      
      Instructions for 99% high-accuracy recognition and error reduction:
      1. MULTIPLE PARTS RECOGNITION (CRITICAL REQUIREMENT):
         - The photo may contain MULTIPLE different items (e.g., an oil filter AND brake pads, or multiple different spark plug boxes, or a group of different parts).
         - You MUST detect and identify EACH unique product shown in the image and include it as a separate entry in the "detectedParts" array.
         - Do NOT stop after finding the first part. Do NOT bundle different parts together.
         - If there are 2, 3 or more parts visible, you MUST populate "detectedParts" with 2, 3 or more corresponding items.
      2. OCR & PART NUMBER MATCHING (WITH HOMOGLYPHS & CORRECTION):
         - Closely analyze the image for any text, OEM numbers, part numbers, serials, barcodes, or barcode text (e.g., "04465-33480", "90915-YZZD2", "FK20HR11", "58101-H8A00", etc.).
         - Match these numbers against the "partNumber" and "altNumbers" in the database.
         - Do an extremely robust fuzzy comparison! Since photos often have minor noise, you must actively resolve common OCR misreads/homoglyphs (e.g., O/0, S/5, I/l/1, Z/2, B/8, or missing/extra spaces and hyphens) to pair the item perfectly with the database catalog. Give it a matching score of 95%+ if the number only has these noise elements.
      3. VISUAL ATTRIBUTES & LABELS:
         - If the serial number is not visible, look at the package brand (e.g., Toyota, Hyundai, Denso, Bosch, Kyb, Bando), the category (Brake pads, Oil filter, Spark plug, Shock absorber, Cabin filter, Belt), and physical appearance (color, size, shape).
         - Cross-reference with the product "name", "aliases" (e.g. "سيفون", "قماشات", "بواجي"), and "notes" in our database.
      4. QUANTITY DETECTED:
         - Look at how many physical pieces or boxes are shown for each detected part type. For example, if there is a set of 4 spark plugs, specify 4. If there is a single box, specify 1. Make a realistic estimate of the quantity.
      5. STRICT MAPPING RULE:
         - If a product matches perfectly or with high confidence, set "id" to the exact "id" from our database (e.g., "part-1", "part-2").
         - If a product does NOT match any item in our database, do NOT make up an ID. Set "id" to an empty string "", but still describe the product in the visual description and include it in "detectedParts" with "id": "" so the seller knows we saw it but don't stock it.
         - For every match, provide a detailed reasoning in fluent Arabic explaining why you matched it (e.g., "تمت مطابقتها بناءً على الرقم التسلسلي 04465-33480 الموجود على كرتون فحمات الفرامل المكتشف").

      Fill the "detectedParts" array with all unique parts recognized (including all distinct physical parts detected).
      For backwards compatibility, select the single most prominent matched item to put in "bestMatch" (with its matching DB "id", "score" between 0-100, and "reason" in Arabic).
      If multiple potential matches or alternative compatible parts exist, list them in "allMatches".
      Provide a rich, professional, and detailed "visualDescription" in fluent Arabic.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bestMatch: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "معرف القطعة المطابقة الأكثر بروزاً أو نص فارغ" },
                  score: { type: Type.INTEGER, description: "نسبة التطابق من 0 إلى 100" },
                  reason: { type: Type.STRING, description: "توضيح باللغة العربية لسبب التطابق" },
                },
                required: ["id", "score", "reason"],
              },
              allMatches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                  },
                  required: ["id", "score", "reason"],
                },
              },
              visualDescription: {
                type: Type.STRING,
                description: "وصف بصرى دقيق لجميع القطع والمنتجات التي تظهر في الصورة باللغة العربية",
              },
              detectedParts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "معرف القطعة المطابقة من قاعدة البيانات، أو نص فارغ إذا لم تجد مطابقة" },
                    nameInImage: { type: Type.STRING, description: "اسم القطعة كما تظهر في الصورة باللغة العربية" },
                    detectedQty: { type: Type.INTEGER, description: "الكمية المكتشفة في الصورة للمنتج" },
                    score: { type: Type.INTEGER, description: "نسبة دقة التطابق من 0 إلى 100" },
                    reason: { type: Type.STRING, description: "توضيح لسبب مطابقة هذه القطعة بالذات مع مخزوننا باللغة العربية" },
                  },
                  required: ["id", "nameInImage", "detectedQty", "score", "reason"],
                },
                description: "قائمة بكافة المنتجات والقطع المختلفة المكتشفة والمميزة داخل الصورة ومطابقتها بمخزوننا",
              },
            },
            required: ["bestMatch", "allMatches", "visualDescription", "detectedParts"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم يتم استلام استجابة صالحة من نموذج الذكاء الاصطناعي للمطابقة");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Match part by image API error:", error);
      res.status(500).json({ error: "فشل التحليل البصري ومطابقة القطعة: " + error.message });
    }
  });

  // API Route: AI Smart Search (semantic matching of Arabic automotive colloquial terms to DB items)
  app.post("/api/smart-search", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "خدمة الذكاء الاصطناعي غير متوفرة حالياً لعدم تكوين مفتاح API" });
      }

      const { query, parts } = req.body;
      if (!query || !parts || !Array.isArray(parts)) {
        return res.status(400).json({ error: "المعاملات المطلوبة (البحث والقطع) غير مكتملة" });
      }

      const prompt = `You are an expert automotive parts specialist in Arab markets (especially Saudi Arabia/Gulf).
      The user is searching for a car spare part using colloquial Arabic.
      Query: "${query}"
      
      Here is the JSON database of available parts in our shop:
      ${JSON.stringify(parts.map(p => ({
        id: p.id,
        name: p.name,
        aliases: p.aliases,
        partNumber: p.partNumber,
        altNumbers: p.altNumbers,
        compatibleCars: p.compatibleCars,
        category: p.category,
        notes: p.notes
      })), null, 2)}
      
      Determine which parts from this database are relevant to the user's search.
      Note that:
      - Arabic terms have synonyms (e.g. "فحمات" or "قماشات" refer to Brake Pads, "سيفون" or "فلتر زيت" refer to Oil Filter, "مساعدات" or "جامبين" refer to Shocks/Suspension, "بواجي" or "شمعات احتراق" refer to Spark Plugs, "سيور" refers to Belts, etc.)
      - The user may specify a model year (e.g., "كورولا 2018" or "كامري ٢٠٢٠" or "إلنترا ١٦"). You must check if the part is compatible with that year and model.
      - Return a JSON object with matched parts ordered by relevance (score 0 to 100), along with a short, helpful explanation in Arabic explaining why it's a match and if there are any compatibility caveats.
      
      Schema to return:
      {
        "matches": [
          {
            "id": "part-id",
            "score": 95,
            "reason": "توضيح باللغة العربية لسبب المطابقة والتوافق، مثلاً: فلتر زيت متوافق تماماً مع تويوتا كورولا 2018"
          }
        ]
      }
      Do not include backticks, return pure JSON text only.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    score: { type: Type.INTEGER, description: "نسبة المطابقة من 0 إلى 100" },
                    reason: { type: Type.STRING, description: "سبب مطابقة وتوافق القطعة باللغة العربية" },
                  },
                  required: ["id", "score", "reason"],
                },
              },
            },
            required: ["matches"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم يتم الحصول على مطابقة صالحة من الذكاء الاصطناعي");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Smart Search API error:", error);
      res.status(500).json({ error: "فشل البحث الذكي: " + error.message });
    }
  });

  // Vite development middleware or production static build serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
