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
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);

export const cityName = (id: string, lang: Lang) => cityById(id)?.name[lang] ?? id;

export const districtName = (cityId: string, districtId: string, lang: Lang) =>
  cityById(cityId)?.districts.find((d) => d.id === districtId)?.name[lang] ?? districtId;
