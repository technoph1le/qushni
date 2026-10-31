// Launch-period privacy policy and terms of service. Replace with lawyer-reviewed text when available.
import { COMPANY } from '../config';
import type { Lang } from '../types';

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const C = COMPANY;
const contact = { email: C.email, tg: `@${C.telegram}` };

export const PRIVACY: Record<Lang, LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    intro: `This policy explains what personal data ${C.product} collects, why we collect it and how we protect it. ${C.product} (${C.website}) is operated by ${C.name}. By using the site you agree to this policy.`,
    sections: [
      {
        id: 'who',
        heading: 'Who we are',
        paragraphs: [
          `${C.product} is an online platform for finding roommates and rooms in Uzbekistan, operated by ${C.name}, ${C.city.en}. You can reach us at ${contact.email} or on Telegram at ${contact.tg}.`,
        ],
      },
      {
        id: 'data',
        heading: 'Data we collect',
        paragraphs: ['We collect only what is needed to run the service:'],
        list: [
          'Account: your name; your email address and profile photo if you sign in with Google; your phone number, Telegram user ID and Telegram username if you confirm your number through our Telegram bot.',
          'Listings: everything you add to a listing — text, price, photos, where the people living there are from, and the address and map point if you give them.',
          'Usage: how many times your listing is viewed and how many times its phone number is shown, and which signed-in users opened a listing’s contacts.',
          'Payments (once paid plans launch): the plan, amount and status of your orders. Card details are entered on Payme or Click pages; we never see or store them.',
          'On your device: your language, saved listings and sign-in session are kept in your browser’s local storage.',
        ],
      },
      {
        id: 'use',
        heading: 'How we use your data',
        paragraphs: ['We use your data to:'],
        list: [
          'create and protect your account, including confirming that your phone number is a real Uzbek (+998) number;',
          'publish your listings and let people contact you about them;',
          'provide paid access to contacts once paid plans launch;',
          'keep the platform safe: prevent fraud, investigate complaints and remove listings that break our terms;',
          'improve the service using aggregated statistics.',
        ],
      },
      {
        id: 'visible',
        heading: 'What other people can see',
        paragraphs: [
          'Anyone can see a listing’s public details, the host’s name, the date they joined and an approximate area of about 500 metres around the home.',
          'The exact address and the host’s phone number are shown only to people allowed to see contacts: during the free launch period that is every visitor; once paid plans launch, only signed-in users with an active plan. Your email address is never shown to other users.',
          'We do not sell personal data and do not use it for third-party advertising.',
        ],
      },
      {
        id: 'providers',
        heading: 'Service providers',
        paragraphs: ['We share data only with providers that help us run the service, and only for that purpose:'],
        list: [
          'Supabase — database, file storage and sign-in (servers in the European Union);',
          'Google — sign-in with a Google account;',
          'Telegram — delivering phone confirmation codes;',
          'Payme and Click — payments, once paid plans launch;',
          'Vercel and Railway — hosting of the website and server.',
        ],
      },
      {
        id: 'retention',
        heading: 'How long we keep data',
        paragraphs: [
          'Account data is kept while your account exists. Listings are kept until you delete them or your account. Unused sign-in attempts are deleted within a day. Payment records are kept as long as tax and accounting law requires.',
        ],
      },
      {
        id: 'rights',
        heading: 'Your rights',
        paragraphs: [
          'You can view and change your name, listings and photos in your account, and delete your listings at any time.',
          `To get a copy of your data, correct it or delete your account and all related data, write to ${contact.email} or ${contact.tg}. We reply within 30 days.`,
        ],
      },
      {
        id: 'security',
        heading: 'Security',
        paragraphs: [
          'All connections are encrypted (HTTPS). Database rules prevent exact addresses and phone numbers from being read directly. Confirmation codes are stored only in hashed form and expire after 10 minutes. No system is perfectly secure, so tell us right away if you notice suspicious activity on your account.',
        ],
      },
      {
        id: 'age',
        heading: 'Age',
        paragraphs: [`${C.product} is intended for people aged 18 and over.`],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        paragraphs: [
          'We may update this policy. The date at the top shows the current version. If changes are significant, we will show a notice on the site.',
        ],
      },
    ],
  },

  uz: {
    title: 'Maxfiylik siyosati',
    intro: `Ushbu siyosat ${C.product} qanday shaxsiy ma’lumotlarni yig‘ishi, nima uchun yig‘ishi va ularni qanday himoya qilishini tushuntiradi. ${C.product} (${C.website}) xizmatini ${C.name} boshqaradi. Saytdan foydalanish orqali siz ushbu siyosatga rozilik bildirasiz.`,
    sections: [
      {
        id: 'who',
        heading: 'Biz kimmiz',
        paragraphs: [
          `${C.product} — O‘zbekistonda sherik va xona topish uchun onlayn platforma, uni ${C.name} (${C.city.uz}) boshqaradi. Biz bilan ${contact.email} yoki Telegram’dagi ${contact.tg} orqali bog‘lanishingiz mumkin.`,
        ],
      },
      {
        id: 'data',
        heading: 'Qanday ma’lumotlarni yig‘amiz',
        paragraphs: ['Biz faqat xizmat ishlashi uchun zarur bo‘lgan ma’lumotlarni yig‘amiz:'],
        list: [
          'Akkaunt: ismingiz; Google orqali kirsangiz — email manzilingiz va profil rasmingiz; raqamingizni Telegram botimiz orqali tasdiqlasangiz — telefon raqamingiz, Telegram ID va Telegram foydalanuvchi nomingiz.',
          'E’lonlar: e’longa qo‘shgan barcha ma’lumotlar — matn, narx, rasmlar, u yerda yashovchilar qaysi viloyatdan ekani, ko‘rsatsangiz — manzil va xaritadagi nuqta.',
          'Foydalanish: e’loningiz necha marta ko‘rilgani, telefon raqami necha marta ochilgani va qaysi akkauntga kirgan foydalanuvchilar e’lon kontaktlarini ochgani.',
          'To‘lovlar (pullik tariflar ishga tushgach): buyurtmalaringizning tarifi, summasi va holati. Karta ma’lumotlari Payme yoki Click sahifalarida kiritiladi; biz ularni ko‘rmaymiz va saqlamaymiz.',
          'Qurilmangizda: tanlangan til, saqlangan e’lonlar va kirish seansi brauzeringiz xotirasida saqlanadi.',
        ],
      },
      {
        id: 'use',
        heading: 'Ma’lumotlardan qanday foydalanamiz',
        paragraphs: ['Ma’lumotlaringizdan quyidagilar uchun foydalanamiz:'],
        list: [
          'akkauntingizni yaratish va himoya qilish, jumladan telefon raqamingiz haqiqiy O‘zbekiston (+998) raqami ekanini tasdiqlash;',
          'e’lonlaringizni joylashtirish va odamlar siz bilan bog‘lana olishi;',
          'pullik tariflar ishga tushgach, kontaktlarga pullik kirishni ta’minlash;',
          'platforma xavfsizligi: firibgarlikning oldini olish, shikoyatlarni ko‘rib chiqish va qoidalarni buzgan e’lonlarni o‘chirish;',
          'umumlashtirilgan statistika asosida xizmatni yaxshilash.',
        ],
      },
      {
        id: 'visible',
        heading: 'Boshqalar nimani ko‘radi',
        paragraphs: [
          'E’lonning ochiq ma’lumotlari, uy egasining ismi, ro‘yxatdan o‘tgan sanasi va uy atrofidagi taxminan 500 metrlik hudud hammaga ko‘rinadi.',
          'Aniq manzil va uy egasining telefon raqami faqat kontaktlarni ko‘rishga ruxsati borlarga ko‘rsatiladi: bepul ishga tushirish davrida — barcha tashrif buyuruvchilarga; pullik tariflar ishga tushgach — faqat faol tarifga ega, akkauntga kirgan foydalanuvchilarga. Email manzilingiz boshqa foydalanuvchilarga hech qachon ko‘rsatilmaydi.',
          'Biz shaxsiy ma’lumotlarni sotmaymiz va uchinchi tomon reklamasi uchun ishlatmaymiz.',
        ],
      },
      {
        id: 'providers',
        heading: 'Xizmat ko‘rsatuvchilar',
        paragraphs: ['Ma’lumotlarni faqat xizmatni ishlatishga yordam beradigan provayderlar bilan va faqat shu maqsadda ulashamiz:'],
        list: [
          'Supabase — ma’lumotlar bazasi, fayllar va kirish tizimi (serverlar Yevropa Ittifoqida);',
          'Google — Google akkaunti orqali kirish;',
          'Telegram — telefonni tasdiqlash kodlarini yetkazish;',
          'Payme va Click — pullik tariflar ishga tushgach, to‘lovlar;',
          'Vercel va Railway — sayt va server hostingi.',
        ],
      },
      {
        id: 'retention',
        heading: 'Ma’lumotlarni qancha saqlaymiz',
        paragraphs: [
          'Akkaunt ma’lumotlari akkauntingiz mavjud ekan saqlanadi. E’lonlar siz ularni yoki akkauntingizni o‘chirmaguningizcha saqlanadi. Foydalanilmagan kirish urinishlari bir kun ichida o‘chiriladi. To‘lov yozuvlari soliq va buxgalteriya qonunchiligi talab qiladigan muddatda saqlanadi.',
        ],
      },
      {
        id: 'rights',
        heading: 'Sizning huquqlaringiz',
        paragraphs: [
          'Akkauntingizda ismingiz, e’lonlaringiz va rasmlaringizni ko‘rishingiz, o‘zgartirishingiz va e’lonlarni istalgan vaqtda o‘chirishingiz mumkin.',
          `Ma’lumotlaringiz nusxasini olish, ularni tuzatish yoki akkauntingiz va unga bog‘liq barcha ma’lumotlarni o‘chirish uchun ${contact.email} yoki ${contact.tg} ga yozing. 30 kun ichida javob beramiz.`,
        ],
      },
      {
        id: 'security',
        heading: 'Xavfsizlik',
        paragraphs: [
          'Barcha ulanishlar shifrlangan (HTTPS). Ma’lumotlar bazasi qoidalari aniq manzil va telefon raqamlarini to‘g‘ridan-to‘g‘ri o‘qishga yo‘l qo‘ymaydi. Tasdiqlash kodlari faqat xeshlangan holda saqlanadi va 10 daqiqada eskiradi. Hech bir tizim mutlaqo xavfsiz emas, shuning uchun akkauntingizda shubhali harakatni sezsangiz, darhol bizga xabar bering.',
        ],
      },
      {
        id: 'age',
        heading: 'Yosh chegarasi',
        paragraphs: [`${C.product} 18 yosh va undan katta foydalanuvchilar uchun mo‘ljallangan.`],
      },
      {
        id: 'changes',
        heading: 'Siyosatdagi o‘zgarishlar',
        paragraphs: [
          'Biz ushbu siyosatni yangilashimiz mumkin. Yuqoridagi sana amaldagi versiyani ko‘rsatadi. Muhim o‘zgarishlar bo‘lsa, saytda xabar beramiz.',
        ],
      },
    ],
  },

  ru: {
    title: 'Политика конфиденциальности',
    intro: `Эта политика объясняет, какие персональные данные собирает ${C.product}, зачем и как мы их защищаем. Сервисом ${C.product} (${C.website}) управляет ${C.name}. Пользуясь сайтом, вы соглашаетесь с этой политикой.`,
    sections: [
      {
        id: 'who',
        heading: 'Кто мы',
        paragraphs: [
          `${C.product} — онлайн-платформа для поиска соседей и комнат в Узбекистане, которой управляет ${C.name} (${C.city.ru}). Связаться с нами можно по адресу ${contact.email} или в Telegram: ${contact.tg}.`,
        ],
      },
      {
        id: 'data',
        heading: 'Какие данные мы собираем',
        paragraphs: ['Мы собираем только то, что нужно для работы сервиса:'],
        list: [
          'Аккаунт: ваше имя; email и фото профиля, если вы входите через Google; номер телефона, Telegram ID и имя пользователя Telegram, если вы подтверждаете номер через наш Telegram-бот.',
          'Объявления: всё, что вы добавляете в объявление, — текст, цену, фото, откуда люди, которые там живут, а также адрес и точку на карте, если вы их указали.',
          'Использование: сколько раз ваше объявление просмотрели и сколько раз открыли номер телефона, а также какие вошедшие пользователи открыли контакты объявления.',
          'Платежи (после запуска платных тарифов): тариф, сумма и статус заказов. Данные карты вводятся на страницах Payme или Click; мы их не видим и не храним.',
          'На вашем устройстве: язык, избранные объявления и сеанс входа хранятся в памяти браузера.',
        ],
      },
      {
        id: 'use',
        heading: 'Как мы используем данные',
        paragraphs: ['Мы используем ваши данные, чтобы:'],
        list: [
          'создавать и защищать ваш аккаунт, в том числе подтверждать, что номер телефона — настоящий узбекский (+998);',
          'публиковать ваши объявления и давать людям возможность связаться с вами;',
          'предоставлять платный доступ к контактам после запуска платных тарифов;',
          'обеспечивать безопасность: предотвращать мошенничество, рассматривать жалобы и удалять объявления, нарушающие правила;',
          'улучшать сервис на основе обобщённой статистики.',
        ],
      },
      {
        id: 'visible',
        heading: 'Что видят другие',
        paragraphs: [
          'Всем видны открытые данные объявления, имя хозяина, дата регистрации и примерный район радиусом около 500 метров вокруг жилья.',
          'Точный адрес и номер телефона хозяина видят только те, кому разрешён доступ к контактам: в бесплатный период запуска — все посетители; после запуска платных тарифов — только вошедшие пользователи с активным тарифом. Ваш email никогда не показывается другим пользователям.',
          'Мы не продаём персональные данные и не используем их для сторонней рекламы.',
        ],
      },
      {
        id: 'providers',
        heading: 'Поставщики услуг',
        paragraphs: ['Мы передаём данные только поставщикам, которые помогают нам обеспечивать работу сервиса, и только для этой цели:'],
        list: [
          'Supabase — база данных, хранение файлов и вход (серверы в Европейском союзе);',
          'Google — вход через аккаунт Google;',
          'Telegram — доставка кодов подтверждения телефона;',
          'Payme и Click — платежи после запуска платных тарифов;',
          'Vercel и Railway — хостинг сайта и сервера.',
        ],
      },
      {
        id: 'retention',
        heading: 'Сколько мы храним данные',
        paragraphs: [
          'Данные аккаунта хранятся, пока существует аккаунт. Объявления хранятся, пока вы не удалите их или аккаунт. Неиспользованные попытки входа удаляются в течение суток. Платёжные записи хранятся столько, сколько требует налоговое и бухгалтерское законодательство.',
        ],
      },
      {
        id: 'rights',
        heading: 'Ваши права',
        paragraphs: [
          'В аккаунте вы можете просматривать и менять имя, объявления и фото, а также удалять объявления в любой момент.',
          `Чтобы получить копию данных, исправить их или удалить аккаунт со всеми связанными данными, напишите на ${contact.email} или ${contact.tg}. Мы ответим в течение 30 дней.`,
        ],
      },
      {
        id: 'security',
        heading: 'Безопасность',
        paragraphs: [
          'Все соединения зашифрованы (HTTPS). Правила базы данных не позволяют напрямую читать точные адреса и номера телефонов. Коды подтверждения хранятся только в хешированном виде и действуют 10 минут. Ни одна система не защищена полностью, поэтому сразу сообщите нам, если заметите подозрительную активность в аккаунте.',
        ],
      },
      {
        id: 'age',
        heading: 'Возраст',
        paragraphs: [`${C.product} предназначен для пользователей от 18 лет.`],
      },
      {
        id: 'changes',
        heading: 'Изменения политики',
        paragraphs: [
          'Мы можем обновлять эту политику. Дата вверху показывает действующую версию. О существенных изменениях мы сообщим на сайте.',
        ],
      },
    ],
  },
};

export const TERMS: Record<Lang, LegalDoc> = {
  en: {
    title: 'Terms of Service',
    intro: `These terms govern your use of ${C.product} (${C.website}), operated by ${C.name}. By using the site or creating an account, you accept them.`,
    sections: [
      {
        id: 'service',
        heading: `What ${C.product} is`,
        paragraphs: [
          `${C.product} is a listing platform that connects people who have a free room or bed with people looking for one. ${C.name} is not a party to any agreement between users, is not a real-estate agent, and does not own, inspect or manage the homes listed.`,
        ],
      },
      {
        id: 'accounts',
        heading: 'Accounts',
        paragraphs: [
          'You must be at least 18 years old to use the service. To post listings you need an Uzbek (+998) phone number confirmed through our Telegram bot. One person may have one account. Keep your sign-in secure — you are responsible for what happens in your account.',
        ],
      },
      {
        id: 'listings',
        heading: 'Listings',
        paragraphs: ['When you post a listing, you confirm that:'],
        list: [
          'you have the right to rent out the room — you are the owner or have the owner’s permission;',
          'the information is true and current: real photos of the place, the actual price and address;',
          'you have your housemates’ consent to mention them;',
          'you will pause or delete the listing when the place is no longer available.',
        ],
      },
      {
        id: 'prohibited',
        heading: 'What is not allowed',
        paragraphs: [],
        list: [
          'fake, duplicate or misleading listings, including bait prices;',
          'asking for prepayment or a deposit before the person has seen the room;',
          'fraud, phishing or collecting other users’ data;',
          'discriminatory, offensive or illegal content;',
          'advertising or spam unrelated to finding housing or roommates;',
          'scraping, automated access, or attempts to get around security or paid access.',
        ],
      },
      {
        id: 'safety',
        heading: 'Safety',
        paragraphs: [
          'Always see the room in person before paying anything, and check the documents of the person you rent from. Never share sign-in codes. Report suspicious listings to us.',
          'We confirm phone numbers, but we do not check identity, property ownership or the accuracy of listings unless a host is marked “Verified”.',
        ],
      },
      {
        id: 'fees',
        heading: 'Fees and paid plans',
        paragraphs: [
          'Posting listings and browsing are free. During the launch period, contacts are free as well.',
          'Later, people searching for a room may need a paid plan (7 days, 10 days or 1 month) to see phone numbers and exact addresses. The price is shown before payment; payment is made through Payme or Click. A plan starts right after payment and does not renew automatically. Because access is given immediately, payments are non-refundable, except where the law requires a refund or a technical problem on our side prevented access.',
        ],
      },
      {
        id: 'content',
        heading: 'Your content',
        paragraphs: [
          `You keep ownership of your text and photos. You give ${C.name} a free, non-exclusive right to show them on ${C.product} and to promote your listing while it is published.`,
        ],
      },
      {
        id: 'liability',
        heading: 'Liability',
        paragraphs: [
          `The service is provided “as is”. To the extent permitted by law, ${C.name} is not responsible for disputes, losses or damage arising from agreements between users, inaccurate listings or the behaviour of other users. For paid services, our total liability is limited to the amount you paid in the previous 3 months.`,
        ],
      },
      {
        id: 'suspension',
        heading: 'Suspension',
        paragraphs: [
          'We may hide listings and suspend or delete accounts that break these terms or harm other users — without notice in serious cases. You can stop using the service and ask us to delete your account at any time.',
        ],
      },
      {
        id: 'law',
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by the laws of the Republic of Uzbekistan. We will first try to resolve any dispute through negotiation; otherwise it will be settled by the courts of Tashkent.',
        ],
      },
      {
        id: 'changes',
        heading: 'Changes and contact',
        paragraphs: [
          `We may update these terms; the date at the top shows the current version. Questions: ${contact.email} or ${contact.tg}.`,
        ],
      },
    ],
  },

  uz: {
    title: 'Foydalanish shartlari',
    intro: `Ushbu shartlar ${C.name} boshqaradigan ${C.product} (${C.website}) xizmatidan foydalanishni tartibga soladi. Saytdan foydalanish yoki akkaunt yaratish orqali siz ularni qabul qilasiz.`,
    sections: [
      {
        id: 'service',
        heading: `${C.product} nima`,
        paragraphs: [
          `${C.product} — bo‘sh xonasi yoki joyi bor odamlarni joy qidirayotganlar bilan bog‘laydigan e’lonlar platformasi. ${C.name} foydalanuvchilar o‘rtasidagi kelishuvlarning tarafi emas, ko‘chmas mulk agenti emas va e’lon qilingan uylarga egalik qilmaydi, ularni tekshirmaydi yoki boshqarmaydi.`,
        ],
      },
      {
        id: 'accounts',
        heading: 'Akkauntlar',
        paragraphs: [
          'Xizmatdan foydalanish uchun kamida 18 yoshda bo‘lishingiz kerak. E’lon berish uchun Telegram botimiz orqali tasdiqlangan O‘zbekiston (+998) telefon raqami kerak. Bir kishi bitta akkauntga ega bo‘lishi mumkin. Kirish ma’lumotlaringizni himoya qiling — akkauntingizda sodir bo‘ladigan harakatlar uchun siz javobgarsiz.',
        ],
      },
      {
        id: 'listings',
        heading: 'E’lonlar',
        paragraphs: ['E’lon joylashtirganingizda quyidagilarni tasdiqlaysiz:'],
        list: [
          'xonani ijaraga berishga haqqingiz bor — siz egasisiz yoki egasining ruxsati bor;',
          'ma’lumotlar to‘g‘ri va dolzarb: joyning haqiqiy rasmlari, haqiqiy narx va manzil;',
          'sheriklaringiz ular haqida yozishingizga rozi;',
          'joy bo‘shamay qolsa, e’lonni to‘xtatasiz yoki o‘chirasiz.',
        ],
      },
      {
        id: 'prohibited',
        heading: 'Nimalar taqiqlangan',
        paragraphs: [],
        list: [
          'soxta, takroriy yoki chalg‘ituvchi e’lonlar, jumladan aldamchi narxlar;',
          'odam xonani ko‘rmasdan oldin oldindan to‘lov yoki zaklad so‘rash;',
          'firibgarlik, fishing yoki boshqa foydalanuvchilar ma’lumotlarini yig‘ish;',
          'kamsituvchi, haqoratli yoki noqonuniy kontent;',
          'uy yoki sherik topishga aloqasi yo‘q reklama va spam;',
          'avtomatik ma’lumot yig‘ish yoki xavfsizlik va pullik kirishni chetlab o‘tishga urinish.',
        ],
      },
      {
        id: 'safety',
        heading: 'Xavfsizlik',
        paragraphs: [
          'Biror narsa to‘lashdan oldin xonani doim o‘z ko‘zingiz bilan ko‘ring va ijaraga beruvchining hujjatlarini tekshiring. Kirish kodlarini hech kimga bermang. Shubhali e’lonlar haqida bizga xabar bering.',
          'Biz telefon raqamlarini tasdiqlaymiz, ammo uy egasi «Tekshirilgan» deb belgilanmagan bo‘lsa, shaxsni, mulk egaligini yoki e’lon to‘g‘riligini tekshirmaymiz.',
        ],
      },
      {
        id: 'fees',
        heading: 'To‘lovlar va pullik tariflar',
        paragraphs: [
          'E’lon berish va e’lonlarni ko‘rish bepul. Ishga tushirish davrida kontaktlar ham bepul.',
          'Keyinchalik xona qidirayotganlar telefon raqamlari va aniq manzillarni ko‘rish uchun pullik tarif (7 kun, 10 kun yoki 1 oy) tanlashi kerak bo‘lishi mumkin. Narx to‘lovdan oldin ko‘rsatiladi; to‘lov Payme yoki Click orqali amalga oshiriladi. Tarif to‘lovdan so‘ng darhol boshlanadi va avtomatik uzaytirilmaydi. Kirish darhol berilgani sababli to‘lovlar qaytarilmaydi, qonun talab qilgan hollar yoki bizning tomondagi texnik nosozlik kirishga to‘sqinlik qilgan hollar bundan mustasno.',
        ],
      },
      {
        id: 'content',
        heading: 'Sizning kontentingiz',
        paragraphs: [
          `Matn va rasmlaringiz sizga tegishli bo‘lib qoladi. E’lon joylashtirilgan davrda ularni ${C.product}’da ko‘rsatish va e’loningizni targ‘ib qilish uchun ${C.name}’ga bepul, eksklyuziv bo‘lmagan huquq berasiz.`,
        ],
      },
      {
        id: 'liability',
        heading: 'Javobgarlik',
        paragraphs: [
          `Xizmat «boricha» taqdim etiladi. Qonun ruxsat bergan darajada ${C.name} foydalanuvchilar o‘rtasidagi kelishuvlar, noto‘g‘ri e’lonlar yoki boshqa foydalanuvchilarning xatti-harakatlaridan kelib chiqqan nizolar, yo‘qotishlar yoki zarar uchun javobgar emas. Pullik xizmatlar bo‘yicha umumiy javobgarligimiz oxirgi 3 oyda to‘lagan summangiz bilan cheklanadi.`,
        ],
      },
      {
        id: 'suspension',
        heading: 'Bloklash',
        paragraphs: [
          'Ushbu shartlarni buzgan yoki boshqa foydalanuvchilarga zarar yetkazgan e’lonlarni yashirishimiz, akkauntlarni bloklashimiz yoki o‘chirishimiz mumkin — jiddiy holatlarda ogohlantirishsiz. Siz istalgan vaqtda xizmatdan foydalanishni to‘xtatib, akkauntingizni o‘chirishni so‘rashingiz mumkin.',
        ],
      },
      {
        id: 'law',
        heading: 'Amaldagi qonunchilik',
        paragraphs: [
          'Ushbu shartlar O‘zbekiston Respublikasi qonunchiligiga bo‘ysunadi. Har qanday nizoni avval muzokaralar yo‘li bilan hal qilishga harakat qilamiz; aks holda u Toshkent shahri sudlarida ko‘rib chiqiladi.',
        ],
      },
      {
        id: 'changes',
        heading: 'O‘zgarishlar va aloqa',
        paragraphs: [
          `Biz ushbu shartlarni yangilashimiz mumkin; yuqoridagi sana amaldagi versiyani ko‘rsatadi. Savollar uchun: ${contact.email} yoki ${contact.tg}.`,
        ],
      },
    ],
  },

  ru: {
    title: 'Условия использования',
    intro: `Эти условия регулируют использование сервиса ${C.product} (${C.website}), которым управляет ${C.name}. Пользуясь сайтом или создавая аккаунт, вы их принимаете.`,
    sections: [
      {
        id: 'service',
        heading: `Что такое ${C.product}`,
        paragraphs: [
          `${C.product} — площадка объявлений, которая соединяет людей со свободной комнатой или местом с теми, кто ищет жильё. ${C.name} не является стороной соглашений между пользователями, не является риелтором и не владеет, не проверяет и не управляет размещёнными жилищами.`,
        ],
      },
      {
        id: 'accounts',
        heading: 'Аккаунты',
        paragraphs: [
          'Пользоваться сервисом можно с 18 лет. Для размещения объявлений нужен узбекский (+998) номер телефона, подтверждённый через наш Telegram-бот. У одного человека может быть один аккаунт. Берегите данные для входа — вы отвечаете за всё, что происходит в вашем аккаунте.',
        ],
      },
      {
        id: 'listings',
        heading: 'Объявления',
        paragraphs: ['Размещая объявление, вы подтверждаете, что:'],
        list: [
          'имеете право сдавать комнату — вы владелец или у вас есть разрешение владельца;',
          'информация правдива и актуальна: настоящие фото жилья, реальные цена и адрес;',
          'соседи согласны, чтобы вы о них упоминали;',
          'вы приостановите или удалите объявление, когда место будет занято.',
        ],
      },
      {
        id: 'prohibited',
        heading: 'Что запрещено',
        paragraphs: [],
        list: [
          'фальшивые, повторяющиеся или вводящие в заблуждение объявления, в том числе заманчиво заниженные цены;',
          'требовать предоплату или залог до того, как человек увидел комнату;',
          'мошенничество, фишинг или сбор данных других пользователей;',
          'дискриминационный, оскорбительный или незаконный контент;',
          'реклама и спам, не связанные с поиском жилья или соседей;',
          'автоматический сбор данных и попытки обойти защиту или платный доступ.',
        ],
      },
      {
        id: 'safety',
        heading: 'Безопасность',
        paragraphs: [
          'Всегда осматривайте комнату лично, прежде чем что-либо платить, и проверяйте документы арендодателя. Никому не сообщайте коды входа. Сообщайте нам о подозрительных объявлениях.',
          'Мы подтверждаем номера телефонов, но не проверяем личность, право собственности и достоверность объявлений, если хозяин не отмечен как «Проверено».',
        ],
      },
      {
        id: 'fees',
        heading: 'Оплата и платные тарифы',
        paragraphs: [
          'Размещение и просмотр объявлений бесплатны. В период запуска контакты тоже бесплатны.',
          'Позже тем, кто ищет жильё, может понадобиться платный тариф (7 дней, 10 дней или 1 месяц), чтобы видеть номера телефонов и точные адреса. Цена показывается до оплаты; оплата проходит через Payme или Click. Тариф начинает действовать сразу после оплаты и не продлевается автоматически. Поскольку доступ предоставляется сразу, оплата не возвращается, кроме случаев, когда возврат требуется по закону или техническая проблема с нашей стороны помешала доступу.',
        ],
      },
      {
        id: 'content',
        heading: 'Ваш контент',
        paragraphs: [
          `Ваши тексты и фото остаются вашими. Пока объявление опубликовано, вы предоставляете ${C.name} бесплатное неисключительное право показывать их на ${C.product} и продвигать ваше объявление.`,
        ],
      },
      {
        id: 'liability',
        heading: 'Ответственность',
        paragraphs: [
          `Сервис предоставляется «как есть». В пределах, допустимых законом, ${C.name} не отвечает за споры, убытки или ущерб, возникшие из соглашений между пользователями, недостоверных объявлений или поведения других пользователей. По платным услугам наша общая ответственность ограничена суммой, оплаченной вами за последние 3 месяца.`,
        ],
      },
      {
        id: 'suspension',
        heading: 'Блокировка',
        paragraphs: [
          'Мы можем скрывать объявления, блокировать или удалять аккаунты, нарушающие эти условия или вредящие другим пользователям, — в серьёзных случаях без предупреждения. Вы можете в любой момент прекратить пользоваться сервисом и попросить удалить аккаунт.',
        ],
      },
      {
        id: 'law',
        heading: 'Применимое право',
        paragraphs: [
          'Эти условия регулируются законодательством Республики Узбекистан. Сначала мы постараемся решить любой спор путём переговоров; иначе он будет рассмотрен судами города Ташкента.',
        ],
      },
      {
        id: 'changes',
        heading: 'Изменения и контакты',
        paragraphs: [
          `Мы можем обновлять эти условия; дата вверху показывает действующую версию. Вопросы: ${contact.email} или ${contact.tg}.`,
        ],
      },
    ],
  },
};
