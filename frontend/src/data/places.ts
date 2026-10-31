import type { Lang } from '../types';

type Names = Record<Lang, string>;

export interface City {
  id: string;
  name: Names;
  lat: number;
  lng: number;
  districts: { id: string; name: Names }[];
  metro: string[];
}

const same = (s: string, ru: string): Names => ({ uz: s, en: s, ru });

/** The only entry for cities without a district list; the form then skips the district question. */
const centre = { id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } };
const regionalCentre = (id: string, name: Names, lat: number, lng: number): City => ({ id, name, lat, lng, districts: [centre], metro: [] });

export const CITIES: City[] = [
  {
    id: 'tashkent',
    name: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    lat: 41.3111,
    lng: 69.2797,
    districts: [
      { id: 'chilonzor', name: same('Chilonzor', 'Чиланзар') },
      { id: 'yunusobod', name: same('Yunusobod', 'Юнусабад') },
      { id: 'mirzo-ulugbek', name: same("Mirzo Ulug'bek", 'Мирзо-Улугбек') },
      { id: 'yakkasaroy', name: same('Yakkasaroy', 'Яккасарай') },
      { id: 'mirobod', name: same('Mirobod', 'Мирабад') },
      { id: 'shayxontohur', name: same('Shayxontohur', 'Шайхантахур') },
      { id: 'olmazor', name: same('Olmazor', 'Алмазар') },
      { id: 'uchtepa', name: same('Uchtepa', 'Учтепа') },
      { id: 'yashnobod', name: same('Yashnobod', 'Яшнабад') },
      { id: 'sergeli', name: same('Sergeli', 'Сергели') },
      { id: 'bektemir', name: same('Bektemir', 'Бектемир') },
      { id: 'yangihayot', name: same('Yangihayot', 'Янгихаёт') },
    ],
    metro: [
      'Amir Temur xiyoboni', 'Mustaqillik maydoni', 'Paxtakor', 'Alisher Navoiy', "O'zbekiston",
      'Kosmonavtlar', 'Oybek', 'Toshkent', 'Mashinasozlar', "Do'stlik", 'Chilonzor', 'Novza',
      "Mirzo Ulug'bek", 'Olmazor', 'Bunyodkor', 'Milliy bog\'', 'Minor', 'Bodomzor', 'Shahriston',
      'Yunus Rajabiy', 'Abdulla Qodiriy', 'Toshkent shahar', 'Chorsu', "G'afur G'ulom", 'Beruniy',
      'Tinchlik', 'Buyuk Ipak Yo\'li', 'Hamid Olimjon', 'Pushkin', 'Yashnobod', 'Sergeli',
    ],
  },
  {
    id: 'samarkand',
    name: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
    lat: 39.6542,
    lng: 66.9597,
    districts: [
      { id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } },
      { id: 'registon', name: same('Registon', 'Регистан') },
      { id: 'sattepo', name: same("Sattepo", 'Саттепо') },
      { id: 'universitet', name: { uz: 'Universitet xiyoboni', ru: 'Университетский бульвар', en: 'University Blvd' } },
    ],
    metro: [],
  },
  {
    id: 'bukhara',
    name: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' },
    lat: 39.7681,
    lng: 64.4556,
    districts: [
      { id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } },
      { id: 'gijduvon-yoli', name: same("G'ijduvon yo'li", 'Гиждуванская') },
    ],
    metro: [],
  },
  {
    id: 'namangan',
    name: { uz: 'Namangan', ru: 'Наманган', en: 'Namangan' },
    lat: 40.9983,
    lng: 71.6726,
    districts: [{ id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } }],
    metro: [],
  },
  {
    id: 'andijan',
    name: { uz: 'Andijon', ru: 'Андижан', en: 'Andijan' },
    lat: 40.7821,
    lng: 72.3442,
    districts: [{ id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } }],
    metro: [],
  },
  {
    id: 'fergana',
    name: { uz: "Farg'ona", ru: 'Фергана', en: 'Fergana' },
    lat: 40.3864,
    lng: 71.7864,
    districts: [{ id: 'markaz', name: { uz: 'Markaz', ru: 'Центр', en: 'Centre' } }],
    metro: [],
  },
  // The remaining regional centres, so every region has a city to post in.
  regionalCentre('navoi', { uz: 'Navoiy', ru: 'Навои', en: 'Navoi' }, 40.1039, 65.3739),
  regionalCentre('karshi', { uz: 'Qarshi', ru: 'Карши', en: 'Karshi' }, 38.8606, 65.7891),
  regionalCentre('termez', { uz: 'Termiz', ru: 'Термез', en: 'Termez' }, 37.2242, 67.2783),
  regionalCentre('jizzakh', { uz: 'Jizzax', ru: 'Джизак', en: 'Jizzakh' }, 40.1158, 67.8422),
  regionalCentre('gulistan', { uz: 'Guliston', ru: 'Гулистан', en: 'Gulistan' }, 40.4897, 68.7842),
  regionalCentre('urgench', { uz: 'Urganch', ru: 'Ургенч', en: 'Urgench' }, 41.5506, 60.6317),
  regionalCentre('nukus', { uz: 'Nukus', ru: 'Нукус', en: 'Nukus' }, 42.46, 59.6103),
  regionalCentre('nurafshon', { uz: 'Nurafshon', ru: 'Нурафшан', en: 'Nurafshon' }, 41.04, 69.36),
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);

export const cityName = (id: string, lang: Lang) => cityById(id)?.name[lang] ?? id;

export const districtName = (cityId: string, districtId: string, lang: Lang) =>
  cityById(cityId)?.districts.find((d) => d.id === districtId)?.name[lang] ?? districtId;

/** Where people are from — the 14 regions of Uzbekistan. `from` is the ready-made "from X" phrase per language. */
export interface Region {
  id: string;
  name: Names;
  from: Names;
}

export const REGIONS: Region[] = [
  { id: 'tashkent-city', name: { uz: 'Toshkent shahri', ru: 'Ташкент (город)', en: 'Tashkent city' }, from: { uz: 'Toshkent shahridan', ru: 'Из Ташкента', en: 'From Tashkent city' } },
  { id: 'tashkent', name: { uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent region' }, from: { uz: 'Toshkent viloyatidan', ru: 'Из Ташкентской области', en: 'From Tashkent region' } },
  { id: 'andijan', name: { uz: 'Andijon', ru: 'Андижан', en: 'Andijan' }, from: { uz: 'Andijondan', ru: 'Из Андижана', en: 'From Andijan' } },
  { id: 'bukhara', name: { uz: 'Buxoro', ru: 'Бухара', en: 'Bukhara' }, from: { uz: 'Buxorodan', ru: 'Из Бухары', en: 'From Bukhara' } },
  { id: 'fergana', name: { uz: "Farg'ona", ru: 'Фергана', en: 'Fergana' }, from: { uz: "Farg'onadan", ru: 'Из Ферганы', en: 'From Fergana' } },
  { id: 'jizzakh', name: { uz: 'Jizzax', ru: 'Джизак', en: 'Jizzakh' }, from: { uz: 'Jizzaxdan', ru: 'Из Джизака', en: 'From Jizzakh' } },
  { id: 'khorezm', name: { uz: 'Xorazm', ru: 'Хорезм', en: 'Khorezm' }, from: { uz: 'Xorazmdan', ru: 'Из Хорезма', en: 'From Khorezm' } },
  { id: 'namangan', name: { uz: 'Namangan', ru: 'Наманган', en: 'Namangan' }, from: { uz: 'Namangandan', ru: 'Из Намангана', en: 'From Namangan' } },
  { id: 'navoi', name: { uz: 'Navoiy', ru: 'Навои', en: 'Navoi' }, from: { uz: 'Navoiydan', ru: 'Из Навои', en: 'From Navoi' } },
  { id: 'kashkadarya', name: { uz: 'Qashqadaryo', ru: 'Кашкадарья', en: 'Kashkadarya' }, from: { uz: 'Qashqadaryodan', ru: 'Из Кашкадарьи', en: 'From Kashkadarya' } },
  { id: 'karakalpakstan', name: { uz: "Qoraqalpog'iston", ru: 'Каракалпакстан', en: 'Karakalpakstan' }, from: { uz: "Qoraqalpog'istondan", ru: 'Из Каракалпакстана', en: 'From Karakalpakstan' } },
  { id: 'samarkand', name: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' }, from: { uz: 'Samarqanddan', ru: 'Из Самарканда', en: 'From Samarkand' } },
  { id: 'syrdarya', name: { uz: 'Sirdaryo', ru: 'Сырдарья', en: 'Syrdarya' }, from: { uz: 'Sirdaryodan', ru: 'Из Сырдарьи', en: 'From Syrdarya' } },
  { id: 'surkhandarya', name: { uz: 'Surxondaryo', ru: 'Сурхандарья', en: 'Surkhandarya' }, from: { uz: 'Surxondaryodan', ru: 'Из Сурхандарьи', en: 'From Surkhandarya' } },
];

export const regionById = (id: string | null | undefined) => (id ? REGIONS.find((r) => r.id === id) : undefined);
