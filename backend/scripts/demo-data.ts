// Sample hosts and rooms for demos and the pitch deck. Loaded by seed-demo.ts — see that file for how to run it.
// Covers every city in frontend/src/data/places.ts and every origin region, all three room types, all genders,
// and prices on both sides of each budget preset (1M / 1.5M / 2M / 3M so'm), so every filter has something to show.
// Descriptions are a deliberate mix of Uzbek and Russian, like real posts.

export interface DemoHost {
  key: string;
  name: string;
  verified: boolean;
  /** How long ago the account was created, in months (shown as "host since"). */
  monthsAgo: number;
}

export interface DemoListing {
  host: string;
  city: string;
  district: string;
  /** Exact point (private); the database derives the public, approximate one. */
  lat: number;
  lng: number;
  address: string;
  metro?: string;
  roomType: 'private' | 'shared' | 'studio';
  price: number;
  spots: number;
  gender: 'male' | 'female' | 'any';
  origin: string | null;
  utilities: boolean;
  amenities: string[];
  title: string;
  description: string;
  photos: number[]; // indexes into PHOTOS
  daysAgo: number;
  views: number;
  contacts: number;
}

// Hosts get phone numbers with the unused operator code 00 (+998 00 …), so no real person can be called.
export const HOSTS: DemoHost[] = [
  { key: 'dilnoza', name: 'Dilnoza Karimova', verified: true, monthsAgo: 14 },
  { key: 'jasur', name: 'Jasur Rahimov', verified: false, monthsAgo: 5 },
  { key: 'malika', name: 'Malika Yusupova', verified: true, monthsAgo: 9 },
  { key: 'otabek', name: 'Otabek Nazarov', verified: false, monthsAgo: 2 },
  { key: 'nodira', name: 'Nodira Aliyeva', verified: true, monthsAgo: 20 },
  { key: 'sardor', name: 'Sardor Tursunov', verified: true, monthsAgo: 7 },
];

// Interior and apartment-block photos from Unsplash (free licence). Checked to load and to look like
// ordinary flats, not villas.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
export const PHOTOS = [
  /* 0 bedroom       */ u('1505693416388-ac5ce068fe85'),
  /* 1 bedroom       */ u('1540518614846-7eded433c457'),
  /* 2 bedroom       */ u('1595526114035-0d45ed16cfbf'),
  /* 3 bedroom       */ u('1616594039964-ae9021a400a0'),
  /* 4 bedroom       */ u('1617325247661-675ab4b64ae2'),
  /* 5 bedroom       */ u('1631049307264-da0ec9d70304'),
  /* 6 bunk beds     */ u('1555854877-bab0e564b8d5'),
  /* 7 living room   */ u('1493809842364-78817add7ffb'),
  /* 8 living room   */ u('1501183638710-841dd1904471'),
  /* 9 living room   */ u('1502672260266-1c1ef2d93688'),
  /* 10 living room  */ u('1505691938895-1758d7feb511'),
  /* 11 living room  */ u('1513694203232-719a280e022f'),
  /* 12 living room  */ u('1522708323590-d24dbb6b0267'),
  /* 13 living room  */ u('1536376072261-38c75010e6c9'),
  /* 14 living room  */ u('1554995207-c18c203602cb'),
  /* 15 living room  */ u('1560448204-e02f11c3d0e2'),
  /* 16 living room  */ u('1583847268964-b28dc8f51f92'),
  /* 17 living room  */ u('1586023492125-27b2c045efd7'),
  /* 18 living room  */ u('1598928506311-c55ded91a20c'),
  /* 19 living room  */ u('1600607687939-ce8a6c25118c'),
  /* 20 living room  */ u('1618221195710-dd6b41faaea6'),
  /* 21 kitchen      */ u('1484154218962-a197022b5858'),
  /* 22 kitchen      */ u('1507089947368-19c1da9775ae'),
  /* 23 kitchen      */ u('1556911220-bff31c812dba'),
  /* 24 bathroom     */ u('1521783593447-5702b9bfd267'),
  /* 25 bathroom     */ u('1595515106969-1ce29566ff1c'),
  /* 26 building     */ u('1460317442991-0ec209397118'),
  /* 27 building     */ u('1545324418-cc1a3fa10c00'),
  /* 28 building     */ u('1574362848149-11496d93a7c7'),
];

export const LISTINGS: DemoListing[] = [
  // ------------------------------------------------------------------ Tashkent
  {
    host: 'jasur', city: 'tashkent', district: 'chilonzor', lat: 41.2756, lng: 69.2034,
    address: 'Chilonzor-9 mavzesi, 14-uy', metro: 'Chilonzor',
    roomType: 'shared', price: 950_000, spots: 2, gender: 'male', origin: 'surkhandarya', utilities: true,
    amenities: ['wifi', 'washer', 'kitchen', 'fridge', 'heating', 'metro'],
    title: "Surxondaryolik talabalar uchun joy, Chilonzor metrosi yonida",
    description:
      "4 xonali kvartirada 2 ta bo'sh joy. Hozir 3 nafar Surxondaryolik talaba yashaydi (TATU, TDIU). " +
      "Metrogacha 5 daqiqa piyoda. Kommunal to'lovlar narxga kiritilgan, internet tez. Chekmaydigan, tartibli yigitlar kerak.",
    photos: [6, 12, 21], daysAgo: 1, views: 312, contacts: 27,
  },
  {
    host: 'dilnoza', city: 'tashkent', district: 'yunusobod', lat: 41.364, lng: 69.287,
    address: 'Yunusobod 4-kvartal, 22-uy', metro: 'Shahriston',
    roomType: 'private', price: 2_200_000, spots: 1, gender: 'female', origin: 'samarkand', utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'furniture', 'kitchen', 'fridge', 'elevator', 'balcony', 'metro'],
    title: 'Qizlar uchun alohida xona, yangi remont',
    description:
      "Yunusobodda 3 xonali kvartiradan alohida xona. Kvartirada Samarqandlik 2 nafar qiz yashaydi, ikkalasi ham ishlaydi. " +
      "Xonada konditsioner, shkaf va ish stoli bor. Kommunal alohida, oyiga taxminan 150 ming. Uzoq muddatga.",
    photos: [0, 7, 23, 24], daysAgo: 2, views: 488, contacts: 41,
  },
  {
    host: 'malika', city: 'tashkent', district: 'mirzo-ulugbek', lat: 41.326, lng: 69.335,
    address: 'ул. Буюк Ипак Йули, 81', metro: "Buyuk Ipak Yo'li",
    roomType: 'studio', price: 5_500_000, spots: 2, gender: 'any', origin: null, utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'parking', 'elevator', 'tv', 'security', 'metro'],
    title: 'Студия в новостройке, Мирзо-Улугбек',
    description:
      "Сдаётся студия 38 м² в новом жилом комплексе с охраной и подземной парковкой. Полностью меблирована, есть вся техника. " +
      "Подойдёт паре или одному человеку. Метро «Буюк Ипак Йули» — 7 минут пешком. Без животных.",
    photos: [19, 5, 22, 25], daysAgo: 3, views: 655, contacts: 38,
  },
  {
    host: 'sardor', city: 'tashkent', district: 'yakkasaroy', lat: 41.29, lng: 69.255,
    address: "Shota Rustaveli ko'chasi, 30-uy", metro: 'Oybek',
    roomType: 'private', price: 2_800_000, spots: 1, gender: 'male', origin: 'khorezm', utilities: true,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'elevator', 'metro'],
    title: "IT sohasida ishlaydigan yigitlarga xona",
    description:
      "Markazga yaqin 3 xonali kvartira. Xorazmlik 2 nafar dasturchi yashaydi, uyda tinch, ish uchun qulay. " +
      "Xona keng, alohida stol va kreslo bor. Hamma kommunal va 100 Mbit internet narxga kiritilgan.",
    photos: [3, 13, 21], daysAgo: 4, views: 271, contacts: 19,
  },
  {
    host: 'nodira', city: 'tashkent', district: 'olmazor', lat: 41.35, lng: 69.215,
    address: 'Talabalar shaharchasi yonida, 7-uy', metro: 'Olmazor',
    roomType: 'shared', price: 1_200_000, spots: 3, gender: 'female', origin: 'fergana', utilities: true,
    amenities: ['wifi', 'washer', 'heating', 'kitchen', 'fridge', 'bus', 'metro'],
    title: "Farg'onalik qizlar xonadoni, Milliy universitet yaqinida",
    description:
      "O'zMU ga 10 daqiqa. Ikki kishilik xonalarda 3 ta bo'sh joy. Uyda Farg'onadan kelgan talaba qizlar yashaydi, " +
      "uy egasi qo'shni xonadonda turadi. Kommunal narxga kirgan. Faqat qizlar uchun.",
    photos: [1, 9, 23], daysAgo: 6, views: 402, contacts: 33,
  },
  {
    host: 'otabek', city: 'tashkent', district: 'sergeli', lat: 41.227, lng: 69.221,
    address: "Sergeli-6, hovli uy, Yangi Sergeli ko'chasi",
    roomType: 'private', price: 1_500_000, spots: 2, gender: 'male', origin: 'kashkadarya', utilities: true,
    amenities: ['wifi', 'washer', 'heating', 'kitchen', 'fridge', 'parking', 'bus'],
    title: "Hovli uyda xona, mashina qo'yish joyi bor",
    description:
      "Sergelida hovli uy, 2 kishilik alohida xona. Qashqadaryolik ishchi yigitlar yashaydi. Hovlida mashina qo'yish mumkin, " +
      "avtobus bekati yaqin. Qishda gaz bilan isitiladi. Narx bir kishi uchun.",
    photos: [8, 16, 21], daysAgo: 8, views: 154, contacts: 12,
  },
  {
    host: 'jasur', city: 'tashkent', district: 'yashnobod', lat: 41.296, lng: 69.336,
    address: "Yashnobod, Aviasozlar-2, 5-uy", metro: 'Yashnobod',
    roomType: 'shared', price: 800_000, spots: 4, gender: 'male', origin: 'karakalpakstan', utilities: true,
    amenities: ['wifi', 'heating', 'kitchen', 'fridge', 'metro', 'bus'],
    title: "Arzon joy, Qoraqalpog'istonlik yigitlar uchun",
    description:
      "Eng arzon variant: 4 xonali kvartirada 4 ta yotoq joyi. Nukus va Xo'jayli yigitlari yashaydi, hammasi ishlaydi. " +
      "Kommunal va internet narxda. Metro 10 daqiqa. Kirish uchun depozit yo'q.",
    photos: [6, 28, 24], daysAgo: 10, views: 590, contacts: 52,
  },
  {
    host: 'malika', city: 'tashkent', district: 'mirobod', lat: 41.295, lng: 69.28,
    address: 'ул. Мирабад, 12', metro: 'Kosmonavtlar',
    roomType: 'studio', price: 4_200_000, spots: 1, gender: 'female', origin: 'tashkent-city', utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'elevator', 'balcony', 'security', 'metro'],
    title: 'Уютная студия для девушки в центре',
    description:
      "Небольшая студия рядом с метро «Космонавтлар», 5 этаж, с балконом. Сдаю девушке, желательно работающей. " +
      "Хозяйка живёт в этом же доме. Коммунальные платежи по счётчикам.",
    photos: [17, 4, 22], daysAgo: 12, views: 233, contacts: 15,
  },
  {
    host: 'sardor', city: 'tashkent', district: 'shayxontohur', lat: 41.326, lng: 69.248,
    address: "Chorsu yonida, eski shahar mahallasi", metro: 'Chorsu',
    roomType: 'private', price: 2_500_000, spots: 2, gender: 'any', origin: 'namangan', utilities: false,
    amenities: ['wifi', 'washer', 'heating', 'furniture', 'kitchen', 'fridge', 'tv', 'metro'],
    title: "Eski shaharda yosh oilaga xona",
    description:
      "Chorsu bozoriga yaqin mahallada katta xona. Namanganlik oila bilan birga yashash, oshxona umumiy. " +
      "Yosh oila yoki ikki aka-uka uchun mos. Mahalla tinch, hammasi yaqin.",
    photos: [18, 2], daysAgo: 15, views: 98, contacts: 6,
  },

  // ------------------------------------------------------------------ Samarkand, Bukhara
  {
    host: 'nodira', city: 'samarkand', district: 'universitet', lat: 39.6505, lng: 66.9608,
    address: 'Universitet xiyoboni, 15-uy',
    roomType: 'shared', price: 750_000, spots: 2, gender: 'female', origin: 'surkhandarya', utilities: true,
    amenities: ['wifi', 'washer', 'heating', 'kitchen', 'fridge', 'bus'],
    title: "SamDU talabalari uchun qizlar xonadoni",
    description:
      "Universitet xiyobonida 3 xonali kvartira. Surxondaryolik talaba qizlar bilan birga, xonada 2 kishi. " +
      "SamDU ga piyoda 7 daqiqa. Kommunal va internet narxga kirgan.",
    photos: [10, 0, 23], daysAgo: 1, views: 176, contacts: 14,
  },
  {
    host: 'otabek', city: 'samarkand', district: 'registon', lat: 39.6548, lng: 66.9757,
    address: "Registon ko'chasi, 40-uy",
    roomType: 'private', price: 1_400_000, spots: 1, gender: 'male', origin: 'jizzakh', utilities: false,
    amenities: ['wifi', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'balcony'],
    title: "Registon yaqinida alohida xona",
    description:
      "Turizm sohasida ishlaydigan yigitga alohida xona. Jizzaxlik ikki yigit bilan birga. " +
      "Konditsioner, balkon bor. Kommunal alohida to'lanadi.",
    photos: [3, 20], daysAgo: 5, views: 120, contacts: 8,
  },
  {
    host: 'malika', city: 'bukhara', district: 'markaz', lat: 39.7747, lng: 64.4286,
    address: 'ул. Накшбанди, 9',
    roomType: 'studio', price: 2_500_000, spots: 2, gender: 'any', origin: null, utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'furniture', 'kitchen', 'fridge', 'tv'],
    title: 'Студия в старом городе Бухары',
    description:
      "Отремонтированная студия в 10 минутах от Ляби-Хауза. Подойдёт для сотрудников туристической сферы или пары. " +
      "Летом прохладно — есть кондиционер. Минимальный срок — 3 месяца.",
    photos: [15, 5, 21], daysAgo: 9, views: 207, contacts: 11,
  },
  {
    host: 'dilnoza', city: 'bukhara', district: 'gijduvon-yoli', lat: 39.789, lng: 64.47,
    address: "G'ijduvon yo'li, 18-uy",
    roomType: 'private', price: 1_100_000, spots: 1, gender: 'female', origin: 'navoi', utilities: true,
    amenities: ['wifi', 'heating', 'furniture', 'kitchen', 'fridge', 'bus'],
    title: "Navoiylik qiz uchun xona, BuxDU ga yaqin",
    description:
      "Hovli uyda alohida xona, uy egasi oilasi bilan yashaydi. Navoiydan kelgan talaba qizga beriladi. " +
      "Kommunal narxga kirgan, ovqat qilish mumkin.",
    photos: [14, 2], daysAgo: 20, views: 64, contacts: 4,
  },

  // ------------------------------------------------------------------ Fergana valley
  {
    host: 'sardor', city: 'namangan', district: 'markaz', lat: 41.0011, lng: 71.6683,
    address: "Namangan, Uychi ko'chasi, 3-uy",
    roomType: 'shared', price: 600_000, spots: 3, gender: 'male', origin: 'namangan', utilities: true,
    amenities: ['wifi', 'heating', 'kitchen', 'fridge', 'bus'],
    title: "Tumanlardan kelgan yigitlar uchun arzon joy",
    description:
      "Chust, Pop va Kosonsoydan kelgan talaba yigitlar yashaydigan uy. 3 ta bo'sh joy. " +
      "NamDU ga avtobusda 10 daqiqa. Hammasi narxda.",
    photos: [6, 11], daysAgo: 3, views: 143, contacts: 17,
  },
  {
    host: 'nodira', city: 'andijan', district: 'markaz', lat: 40.7836, lng: 72.3506,
    address: "Andijon, Bobur shoh ko'chasi, 27-uy",
    roomType: 'private', price: 1_000_000, spots: 1, gender: 'female', origin: 'andijan', utilities: false,
    amenities: ['wifi', 'washer', 'heating', 'furniture', 'kitchen', 'fridge', 'balcony'],
    title: "Tibbiyot institutiga yaqin, qizlarga xona",
    description:
      "ADTI ga piyoda 12 daqiqa. Andijon tumanlaridan kelgan qizlar yashaydi. Xona yorug', balkonli. " +
      "Kommunal oyiga 80–100 ming atrofida.",
    photos: [16, 4, 23], daysAgo: 7, views: 89, contacts: 9,
  },
  {
    host: 'jasur', city: 'fergana', district: 'markaz', lat: 40.3842, lng: 71.7843,
    address: "Farg'ona, Mustaqillik ko'chasi, 60-uy",
    roomType: 'studio', price: 2_200_000, spots: 2, gender: 'any', origin: 'fergana', utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'parking', 'tv'],
    title: "Markazda bir xonali kvartira",
    description:
      "To'liq jihozlangan bir xonali kvartira, yangi remont. Yosh oila yoki ikki kishi uchun. " +
      "Hovlida mashina joyi bor. Uzoq muddatga beriladi.",
    photos: [7, 0, 22], daysAgo: 11, views: 118, contacts: 7,
  },

  // ------------------------------------------------------------------ Centre and south
  {
    host: 'malika', city: 'navoi', district: 'markaz', lat: 40.1, lng: 65.379,
    address: 'Навои, ул. Галаба, 14',
    roomType: 'private', price: 1_600_000, spots: 1, gender: 'male', origin: 'bukhara', utilities: true,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge'],
    title: 'Комната для работников НГМК',
    description:
      "Комната в трёхкомнатной квартире, живут ребята из Бухары, работают вахтой на комбинате. " +
      "Все коммунальные включены. Остановка служебного автобуса рядом с домом.",
    photos: [13, 1], daysAgo: 4, views: 76, contacts: 5,
  },
  {
    host: 'otabek', city: 'karshi', district: 'markaz', lat: 38.861, lng: 65.795,
    address: "Qarshi, Nasaf ko'chasi, 11-uy",
    roomType: 'shared', price: 650_000, spots: 2, gender: 'male', origin: 'kashkadarya', utilities: true,
    amenities: ['wifi', 'heating', 'kitchen', 'fridge', 'bus'],
    title: "QarDU talabalari uchun joy",
    description:
      "Qashqadaryo tumanlaridan kelgan yigitlar uchun. Xonada 2 kishi. Universitetga avtobusda 15 daqiqa. " +
      "Kommunal narxda, oshxonada ovqat qilish mumkin.",
    photos: [9, 12], daysAgo: 13, views: 58, contacts: 6,
  },
  {
    host: 'dilnoza', city: 'termez', district: 'markaz', lat: 37.2265, lng: 67.2745,
    address: "Termiz, At-Termiziy ko'chasi, 5-uy",
    roomType: 'private', price: 900_000, spots: 1, gender: 'female', origin: 'surkhandarya', utilities: false,
    amenities: ['wifi', 'ac', 'furniture', 'kitchen', 'fridge'],
    title: "Konditsionerli xona, TerDU yonida",
    description:
      "Yozda issiq bo'lgani uchun xonada yangi konditsioner o'rnatilgan. Surxondaryo tumanlaridan kelgan qizlar yashaydi. " +
      "TerDU ga piyoda 5 daqiqa.",
    photos: [10, 5], daysAgo: 16, views: 47, contacts: 3,
  },
  {
    host: 'sardor', city: 'jizzakh', district: 'markaz', lat: 40.1194, lng: 67.8394,
    address: "Jizzax, Sharof Rashidov ko'chasi, 22-uy",
    roomType: 'shared', price: 550_000, spots: 3, gender: 'male', origin: 'jizzakh', utilities: true,
    amenities: ['wifi', 'heating', 'kitchen', 'bus'],
    title: "Politexnika talabalariga arzon joy",
    description:
      "JizPI ga yaqin hovli uy. Jizzax tumanlaridan kelgan 3 nafar yigit yashaydi, yana 3 ta joy bor. " +
      "Hamma to'lovlar narxda, eng arzon variant.",
    photos: [6, 27], daysAgo: 18, views: 102, contacts: 13,
  },
  {
    host: 'nodira', city: 'gulistan', district: 'markaz', lat: 40.4911, lng: 68.7814,
    address: "Guliston, Bunyodkor ko'chasi, 9-uy",
    roomType: 'private', price: 800_000, spots: 2, gender: 'any', origin: 'syrdarya', utilities: false,
    amenities: ['wifi', 'heating', 'furniture', 'kitchen', 'fridge', 'parking'],
    title: "Ikki kishilik xona, hovlili uy",
    description:
      "Hovlili uyda 2 kishilik xona. Sirdaryo tumanlaridan kelgan aka-uka yoki opa-singillar uchun mos. " +
      "Uy egasi alohida uyda yashaydi.",
    photos: [11, 3], daysAgo: 22, views: 39, contacts: 2,
  },

  // ------------------------------------------------------------------ West and Tashkent region
  {
    host: 'malika', city: 'urgench', district: 'markaz', lat: 41.5534, lng: 60.6248,
    address: "Urganch, Al-Xorazmiy ko'chasi, 33-uy",
    roomType: 'studio', price: 1_800_000, spots: 1, gender: 'female', origin: 'khorezm', utilities: false,
    amenities: ['wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'elevator'],
    title: "Ishlaydigan qizga bir xonali kvartira",
    description:
      "Yangi uyda bir xonali kvartira, 4-qavat, lift bor. Hamma jihozlar bilan. " +
      "Xorazmlik, ishlaydigan qizga beriladi. Kommunal hisoblagich bo'yicha.",
    photos: [19, 0, 25], daysAgo: 6, views: 81, contacts: 5,
  },
  {
    host: 'jasur', city: 'nukus', district: 'markaz', lat: 42.4619, lng: 59.6166,
    address: "Nukus, Doslıq guzarı, 4-uy",
    roomType: 'shared', price: 700_000, spots: 2, gender: 'female', origin: 'karakalpakstan', utilities: true,
    amenities: ['wifi', 'washer', 'heating', 'kitchen', 'fridge'],
    title: "QDU talaba qizlari uchun joy",
    description:
      "Qoraqalpog'iston tumanlaridan kelgan talaba qizlar yashaydigan kvartira. Xonada 2 kishi. " +
      "Qishda markaziy isitish, kommunal narxda.",
    photos: [14, 1], daysAgo: 25, views: 44, contacts: 4,
  },
  {
    host: 'otabek', city: 'nurafshon', district: 'markaz', lat: 41.0424, lng: 69.3571,
    address: "Nurafshon, Toshkent yo'li, 2-uy",
    roomType: 'private', price: 1_300_000, spots: 1, gender: 'male', origin: 'tashkent', utilities: true,
    amenities: ['wifi', 'washer', 'heating', 'furniture', 'kitchen', 'fridge', 'parking', 'bus'],
    title: "Yangi binoda xona, Toshkentga avtobus bor",
    description:
      "Nurafshon markazida yangi qurilgan uy. Toshkent viloyatidan kelgan yigitlar bilan birga. " +
      "Toshkentga to'g'ridan-to'g'ri avtobus 40 daqiqa. Hamma to'lovlar narxda.",
    photos: [26, 15, 21], daysAgo: 30, views: 61, contacts: 3,
  },
];
