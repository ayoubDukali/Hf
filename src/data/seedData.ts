/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Part } from "../types";

export const SEED_PARTS: Part[] = [
  {
    id: "part-1",
    name: "فحمات فرامل أمامية",
    aliases: ["قماشات أمامية", "بريكات أمامية", "فحمات فرامل", "قماشات فرملة", "Front Brake Pads"],
    partNumber: "04465-33480",
    altNumbers: ["04465-06150", "D1914", "SP2134"],
    compatibleCars: [
      { brand: "تويوتا", model: "كامري", years: "2018-2024", engine: "2.5L" },
      { brand: "تويوتا", model: "أفالون", years: "2019-2022", engine: "3.5L" },
      { brand: "لكزس", model: "ES350", years: "2019-2023", engine: "3.5L" }
    ],
    sellingPrice: 185,
    buyingPrice: 130,
    quantity: 14,
    location: "الرف A-03",
    category: "فرامل",
    notes: "جودة أصلية يابانية عالية التحمل، ينصح بخرط الهوبات عند التركيب.",
    image: "brake_pads"
  },
  {
    id: "part-2",
    name: "فلتر زيت المحرك",
    aliases: ["سيفون مكينة", "فلتر زيت", "مصفي زيت", "سيفون", "Oil Filter"],
    partNumber: "90915-YZZD2",
    altNumbers: ["90915-10001", "90915-YZZN1", "90915-10003"],
    compatibleCars: [
      { brand: "تويوتا", model: "كورولا", years: "2010-2022", engine: "1.6L / 1.8L" },
      { brand: "تويوتا", model: "يارس", years: "2008-2023", engine: "1.3L / 1.5L" },
      { brand: "تويوتا", model: "هايلكس", years: "2016-2024", engine: "2.7L" }
    ],
    sellingPrice: 25,
    buyingPrice: 15,
    quantity: 45,
    location: "الرف B-01",
    category: "فلاتر",
    notes: "فلتر زيت أصلي من تويوتا، ينصح بتغييره مع كل غيار زيت محرك (5,000 كم).",
    image: "oil_filter"
  },
  {
    id: "part-3",
    name: "بواجي ليزر إيريديوم",
    aliases: ["شمعات احتراق", "بواجي", "بوجي", "Spark Plugs"],
    partNumber: "FK20HR11",
    altNumbers: ["90919-01247", "3444", "SC20HR11"],
    compatibleCars: [
      { brand: "تويوتا", model: "كامري", years: "2012-2020", engine: "2.5L" },
      { brand: "تويوتا", model: "راف فور", years: "2013-2021", engine: "2.5L" },
      { brand: "تويوتا", model: "كورولا", years: "2014-2019", engine: "2.0L" }
    ],
    sellingPrice: 190, // طقم 4 حبات
    buyingPrice: 140,
    quantity: 20,
    location: "الرف C-04",
    category: "محرك",
    notes: "طقم كامل مكون من 4 بواجي إيريديوم ليزر عمرها الافتراضي 100,000 كم.",
    image: "spark_plugs"
  },
  {
    id: "part-4",
    name: "مساعد أمامي يمين",
    aliases: ["مساعدات أمامية", "مساعد يمين", "مساعد أمامي", "جامبين يمين", "Front Right Shock Absorber"],
    partNumber: "48510-80842",
    altNumbers: ["48510-09Y10", "339242", "NST5689R"],
    compatibleCars: [
      { brand: "تويوتا", model: "كورولا", years: "2014-2019", engine: "1.6L / 2.0L" }
    ],
    sellingPrice: 240,
    buyingPrice: 175,
    quantity: 6,
    location: "الرف E-10",
    category: "مساعدات",
    notes: "مساعد ياباني ماركة KYB متوافق مع قيادة الطرق الوعرة والمدينة.",
    image: "shock"
  },
  {
    id: "part-5",
    name: "فلتر هواء المكيف",
    aliases: ["فلتر مكيف", "مصفي مكيف", "فلتر مروحة", "Cabin Air Filter"],
    partNumber: "87139-50100",
    altNumbers: ["87139-30040", "CF10285", "WP9290"],
    compatibleCars: [
      { brand: "تويوتا", model: "كامري", years: "2007-2017", engine: "2.4L / 2.5L" },
      { brand: "تويوتا", model: "أوريون", years: "2007-2015", engine: "3.5L" },
      { brand: "لكزس", model: "ES350", years: "2007-2018", engine: "3.5L" },
      { brand: "تويوتا", model: "لاندكروزر", years: "2008-2021", engine: "4.6L / 5.7L" }
    ],
    sellingPrice: 45,
    buyingPrice: 28,
    quantity: 32,
    location: "الرف B-05",
    category: "فلاتر",
    notes: "فلتر كربوني نشط يمنع الروائح الكريهة والغبار من الدخول لمقصورة السيارة.",
    image: "cabin_filter"
  },
  {
    id: "part-6",
    name: "سير المحرك الخارجي",
    aliases: ["سير مكينة", "سير دينمو", "سير خارجي", "سير مروحة", "Serpentine Belt"],
    partNumber: "7PK2090",
    altNumbers: ["90916-02705", "5070823", "7PK2095"],
    compatibleCars: [
      { brand: "تويوتا", model: "كامري", years: "2012-2017", engine: "2.5L" },
      { brand: "تويوتا", model: "راف فور", years: "2013-2018", engine: "2.5L" }
    ],
    sellingPrice: 85,
    buyingPrice: 55,
    quantity: 11,
    location: "الرف D-02",
    category: "سيور",
    notes: "ماركة BANDO اليابانية الشهيرة، مقاوم لدرجات الحرارة العالية والتشققات.",
    image: "belt"
  },
  {
    id: "part-7",
    name: "فلتر زيت جيربوكس",
    aliases: ["فلتر قير", "فلتر جير", "سيفون قير", "مصفي قير", "Transmission Filter"],
    partNumber: "35330-12040",
    altNumbers: ["58013", "JT494", "35330-0W010"],
    compatibleCars: [
      { brand: "تويوتا", model: "كورولا", years: "2009-2016", engine: "1.6L / 1.8L (4 Speed Automatic)" },
      { brand: "تويوتا", model: "يارس", years: "2006-2014", engine: "1.3L / 1.5L" }
    ],
    sellingPrice: 120,
    buyingPrice: 80,
    quantity: 8,
    location: "الرف B-03",
    category: "فلاتر",
    notes: "يأتي مع وجه كرتير القير الأصلي، ينصح بتغييره كل 80,000 كم.",
    image: "transmission_filter"
  },
  {
    id: "part-8",
    name: "فحمات فرامل خلفية",
    aliases: ["قماشات خلفية", "بريكات خلفية", "قماشات فرامل خلفية", "Rear Brake Pads"],
    partNumber: "58101-H8A00",
    altNumbers: ["58101-G6A00", "SP4320", "D2130"],
    compatibleCars: [
      { brand: "هيونداي", model: "إلنترا", years: "2016-2020", engine: "1.6L / 2.0L" },
      { brand: "هيونداي", model: "أكسنت", years: "2018-2023", engine: "1.4L / 1.6L" },
      { brand: "كيا", model: "سيراتو", years: "2019-2022", engine: "1.6L / 2.0L" }
    ],
    sellingPrice: 140,
    buyingPrice: 95,
    quantity: 15,
    location: "الرف A-04",
    category: "فرامل",
    notes: "فحمات خلفية كورية أصلية ماركة SANGSHIN (Hi-Q)، عمر خدمة طويل وهدوء تام.",
    image: "brake_pads"
  },
  {
    id: "part-9",
    name: "فلتر هواء المحرك",
    aliases: ["فلتر هواء مكينة", "فلتر المكينة", "مصفي هواء", "Engine Air Filter"],
    partNumber: "28113-F2000",
    altNumbers: ["CA12053", "WA10344", "28113-F2100"],
    compatibleCars: [
      { brand: "هيونداي", model: "إلنترا", years: "2016-2020", engine: "1.6L / 2.0L" },
      { brand: "كيا", model: "سيراتو", years: "2017-2021", engine: "1.6L / 2.0L" }
    ],
    sellingPrice: 40,
    buyingPrice: 24,
    quantity: 25,
    location: "الرف B-02",
    category: "فلاتر",
    notes: "يحمي المحرك من دخول ذرات الغبار، يفضل نفخه بالهواء كل 5000 كم وتغييره كل 20000 كم.",
    image: "air_filter"
  }
];
