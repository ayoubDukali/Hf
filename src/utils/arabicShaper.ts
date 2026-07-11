// Arabic character shaping and text reversing for thermal printer ESC/POS display
// Helps basic thermal printers display Arabic text from right to left with correct ligatures

interface ArabicCharForms {
  isolated: number;
  final: number;
  medial: number;
  initial: number;
}

const ARABIC_MAP: Record<number, ArabicCharForms> = {
  0x0621: { isolated: 0xFE80, final: 0xFE80, medial: 0xFE80, initial: 0xFE80 }, // ء
  0x0622: { isolated: 0xFE81, final: 0xFE82, medial: 0xFE82, initial: 0xFE81 }, // آ
  0x0623: { isolated: 0xFE83, final: 0xFE84, medial: 0xFE84, initial: 0xFE83 }, // أ
  0x0624: { isolated: 0xFE85, final: 0xFE86, medial: 0xFE86, initial: 0xFE85 }, // ؤ
  0x0625: { isolated: 0xFE87, final: 0xFE88, medial: 0xFE88, initial: 0xFE87 }, // إ
  0x0626: { isolated: 0xFE89, final: 0xFE8A, medial: 0xFE8C, initial: 0xFE8B }, // ئ
  0x0627: { isolated: 0xFE8D, final: 0xFE8E, medial: 0xFE8E, initial: 0xFE8D }, // ا
  0x0628: { isolated: 0xFE8F, final: 0xFE90, medial: 0xFE92, initial: 0xFE91 }, // ب
  0x0629: { isolated: 0xFE93, final: 0xFE94, medial: 0xFE94, initial: 0xFE93 }, // ة
  0x062A: { isolated: 0xFE95, final: 0xFE96, medial: 0xFE98, initial: 0xFE97 }, // ت
  0x062B: { isolated: 0xFE99, final: 0xFE9A, medial: 0xFE9C, initial: 0xFE9B }, // ث
  0x062C: { isolated: 0xFE9D, final: 0xFE9E, medial: 0xFEA0, initial: 0xFE9F }, // ج
  0x062D: { isolated: 0xFEA1, final: 0xFEA2, medial: 0xFEA4, initial: 0xFEA3 }, // ح
  0x062E: { isolated: 0xFEA5, final: 0xFEA6, medial: 0xFEA8, initial: 0xFEA7 }, // خ
  0x062F: { isolated: 0xFEA9, final: 0xFEAA, medial: 0xFEAA, initial: 0xFEA9 }, // د
  0x0630: { isolated: 0xFEAB, final: 0xFEAC, medial: 0xFEAC, initial: 0xFEAB }, // ذ
  0x0631: { isolated: 0xFEAD, final: 0xFEAE, medial: 0xFEAE, initial: 0xFEAD }, // ر
  0x0632: { isolated: 0xFEAF, final: 0xFEB0, medial: 0xFEB0, initial: 0xFEAF }, // ز
  0x0633: { isolated: 0xFEB1, final: 0xFEB2, medial: 0xFEB4, initial: 0xFEB3 }, // س
  0x0634: { isolated: 0xFEB5, final: 0xFEB6, medial: 0xFEB8, initial: 0xFEB7 }, // ش
  0x0635: { isolated: 0xFEB9, final: 0xFEBA, medial: 0xFEBC, initial: 0xFEBB }, // ص
  0x0636: { isolated: 0xFEBD, final: 0xFEBE, medial: 0xFEC0, initial: 0xFEBF }, // ض
  0x0637: { isolated: 0xFEC1, final: 0xFEC2, medial: 0xFEC4, initial: 0xFEC3 }, // ط
  0x0638: { isolated: 0xFEC5, final: 0xFEC6, medial: 0xFEC8, initial: 0xFEC7 }, // ظ
  0x0639: { isolated: 0xFEC9, final: 0xFECA, medial: 0xFECC, initial: 0xFECB }, // ع
  0x063A: { isolated: 0xFECD, final: 0xFECE, medial: 0xFED0, initial: 0xFECF }, // غ
  0x0641: { isolated: 0xFED1, final: 0xFED2, medial: 0xFED4, initial: 0xFED3 }, // ف
  0x0642: { isolated: 0xFED5, final: 0xFED6, medial: 0xFED8, initial: 0xFED7 }, // ق
  0x0643: { isolated: 0xFED9, final: 0xFEDA, medial: 0xFEDC, initial: 0xFEDB }, // ك
  0x0644: { isolated: 0xFEDD, final: 0xFEDE, medial: 0xFEE0, initial: 0xFEDF }, // ل
  0x0645: { isolated: 0xFEE1, final: 0xFEE2, medial: 0xFEE4, initial: 0xFEE3 }, // م
  0x0646: { isolated: 0xFEE5, final: 0xFEE6, medial: 0xFEE8, initial: 0xFEE7 }, // ن
  0x0647: { isolated: 0xFEE9, final: 0xFEEA, medial: 0xFEEC, initial: 0xFEEB }, // ه
  0x0648: { isolated: 0xFEED, final: 0xFEEE, medial: 0xFEEE, initial: 0xFEED }, // و
  0x0649: { isolated: 0xFEEF, final: 0xFEF0, medial: 0xFEF0, initial: 0xFEEF }, // ى
  0x064A: { isolated: 0xFEF1, final: 0xFEF2, medial: 0xFEF4, initial: 0xFEF3 }, // ي
};

// Letters that do not connect to the left/next character
const SELFISH_CHARS = new Set([
  0x0621, // ء
  0x0622, // آ
  0x0623, // أ
  0x0624, // ؤ
  0x0625, // إ
  0x0627, // ا
  0x062F, // د
  0x0630, // ذ
  0x0631, // ر
  0x0632, // ز
  0x0648, // و
  0x0629, // ة
]);

function isArabic(charCode: number): boolean {
  return charCode in ARABIC_MAP;
}

/**
 * Applies Arabic character shaping (ligatures) to raw Arabic characters.
 */
export function shapeArabic(text: string): string {
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const code = char.charCodeAt(0);

    if (!isArabic(code)) {
      result.push(char);
      continue;
    }

    // Determine if we can connect with the right (previous character in standard reading order, i.e., index i-1)
    let connectsRight = false;
    if (i > 0) {
      const prevCode = chars[i - 1].charCodeAt(0);
      if (isArabic(prevCode) && !SELFISH_CHARS.has(prevCode)) {
        connectsRight = true;
      }
    }

    // Determine if we can connect with the left (next character in standard reading order, i.e., index i+1)
    let connectsLeft = false;
    if (i < chars.length - 1) {
      const nextCode = chars[i + 1].charCodeAt(0);
      if (isArabic(nextCode) && !SELFISH_CHARS.has(code)) {
        connectsLeft = true;
      }
    }

    const forms = ARABIC_MAP[code];
    let shapedChar = char;

    if (forms) {
      if (connectsRight && connectsLeft) {
        shapedChar = String.fromCharCode(forms.medial);
      } else if (connectsRight) {
        shapedChar = String.fromCharCode(forms.final);
      } else if (connectsLeft) {
        shapedChar = String.fromCharCode(forms.initial);
      } else {
        shapedChar = String.fromCharCode(forms.isolated);
      }
    }

    result.push(shapedChar);
  }

  // Handle Arabic Lam-Alef ligatures (لا)
  const finalResult: string[] = [];
  for (let i = 0; i < result.length; i++) {
    const code = result[i].charCodeAt(0);
    if (code === 0xFEDF || code === 0xFEE0) { // Lam Initial or Medial
      if (i + 1 < result.length) {
        const nextCode = result[i + 1].charCodeAt(0);
        if (nextCode === 0xFE8D || nextCode === 0xFE8E) { // Alef Isolated or Final
          // Combine to Lam-Alef ligature
          finalResult.push(String.fromCharCode(0xFEFB)); // لا isolated
          i++;
          continue;
        } else if (nextCode === 0xFE81 || nextCode === 0xFE82) { // Alef Madda
          finalResult.push(String.fromCharCode(0xFEF5)); // لآ
          i++;
          continue;
        } else if (nextCode === 0xFE83 || nextCode === 0xFE84) { // Alef Hamza Above
          finalResult.push(String.fromCharCode(0xFEF7)); // لأ
          i++;
          continue;
        } else if (nextCode === 0xFE87 || nextCode === 0xFE88) { // Alef Hamza Below
          finalResult.push(String.fromCharCode(0xFEF9)); // لإ
          i++;
          continue;
        }
      }
    }
    finalResult.push(result[i]);
  }

  return finalResult.join("");
}

/**
 * Reverses RTL (Arabic) segments in a string while preserving LTR (numbers, English) segments.
 * This ensures standard thermal printers draw them in the correct spatial order.
 */
export function reverseArabicText(text: string): string {
  // We need to split text into runs of Arabic vs runs of non-Arabic (numbers, English words, punctuation).
  // Arabic characters are usually in range [0x0600 - 0x06FF] or [0xFE70 - 0xFEFF] (presentation forms)
  const isArabicRun = (char: string) => {
    const c = char.charCodeAt(0);
    return (c >= 0x0600 && c <= 0x06FF) || (c >= 0xFE70 && c <= 0xFEFF) || c === 0x200F; // RTL mark
  };

  const runs: { isAr: boolean; str: string }[] = [];
  let currentRun = "";
  let currentAr = false;

  for (const char of text) {
    const ar = isArabicRun(char);
    if (currentRun === "") {
      currentRun = char;
      currentAr = ar;
    } else if (ar === currentAr) {
      currentRun += char;
    } else {
      runs.push({ isAr: currentAr, str: currentRun });
      currentRun = char;
      currentAr = ar;
    }
  }
  if (currentRun !== "") {
    runs.push({ isAr: currentAr, str: currentRun });
  }

  // To print correctly, we reverse Arabic runs, and reverse the entire list of runs so that the line flows RTL overall!
  const processedRuns = runs.map(run => {
    if (run.isAr) {
      // Reverse Arabic letters inside the run
      return Array.from(run.str).reverse().join("");
    }
    return run.str;
  });

  // Reverse the runs order because of RTL
  return processedRuns.reverse().join("");
}

/**
 * Shapes and reverses an Arabic line, then pads or truncates to fit exactly within a column width.
 * Useful for 58mm (32 chars) or 80mm (48 chars).
 */
export function formatPrinterLine(text: string, width: number, align: "right" | "center" | "left" = "right"): string {
  // First, shape the Arabic characters in the input
  const shaped = shapeArabic(text);
  
  // Reverse Arabic segments so they render correctly RTL
  const reversed = reverseArabicText(shaped);

  // If text is longer than width, truncate it
  if (reversed.length >= width) {
    return reversed.substring(0, width);
  }

  const padding = width - reversed.length;
  if (align === "center") {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return " ".repeat(leftPad) + reversed + " ".repeat(rightPad);
  } else if (align === "left") {
    // Left aligned in original view is printed as-is, meaning padding on the right
    return reversed + " ".repeat(padding);
  } else {
    // Right aligned (default for Arabic)
    return " ".repeat(padding) + reversed;
  }
}
