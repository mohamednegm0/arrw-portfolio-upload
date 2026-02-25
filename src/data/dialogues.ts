// ============================================
// Arrw Portfolio — Dialogue Scripts
// Bilingual EN/AR for each level
// ============================================

import type { DialogueLine } from '../store/gameStore'

export interface LevelData {
  id: number
  zoneId: string
  name: string
  nameAr: string
  subtitle: string
  subtitleAr: string
  landmark: string
  color: string
  dialogues: DialogueLine[]
}

export const LEVELS: LevelData[] = [
  // ── Level 0: Alexandria ──────────────
  {
    id: 0,
    zoneId: 'alex',
    name: 'Alexandria',
    nameAr: 'الإسكندرية',
    subtitle: 'The Origin Story',
    subtitleAr: 'قصة البداية',
    landmark: 'Bibliotheca Alexandrina',
    color: '#4299E1',
    dialogues: [
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: 'Alexandria. This is where it all started. The sea, the hustle... the Nissan Sunny fleet.',
        textAr: 'إسكندرية. هنا بدأ كل حاجة. البحر، والشغل... وأسطول النيسان صني.',
      },
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: 'يا صنايعية — we built this city ride by ride. Alhamdulillah.',
        textAr: 'يا صنايعية — بنينا المدينة دي رحلة رحلة. الحمد لله.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'The data says Alex has an 8.2km average trip with 3.1km dead miles. That\'s a 37% dead-mile ratio.',
        textAr: 'البيانات بتقول إن متوسط الرحلة في إسكندرية ٨.٢ كم وميل الدد ٣.١ كم. نسبة ٣٧٪.',
      },
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: 'Cut those dead miles, and we\'ll see real margin. يا رب. That\'s your first mission.',
        textAr: 'قلل الميل الفاضية دي، وهنشوف هامش حقيقي. يا رب. دي أول مهمة ليك.',
      },
    ],
  },

  // ── Level 1: 6th October ─────────────
  {
    id: 1,
    zoneId: '6oct',
    name: '6th October City',
    nameAr: 'مدينة ٦ أكتوبر',
    subtitle: 'Suburban Expansion',
    subtitleAr: 'التوسع في الضواحي',
    landmark: 'Dream Park',
    color: '#48BB78',
    dialogues: [
      {
        speaker: 'Hassan El-Shourbagi',
        speakerAr: 'حسن الشوربجي',
        text: '6th October is tricky. Huge area, spread-out demand. Dead miles are killing us at 4.2km.',
        textAr: '٦ أكتوبر صعبة. مساحة كبيرة والطلب متفرق. الميل الفاضية بتقتلنا — ٤.٢ كم.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'What if we create demand hubs? Cluster drivers near malls and universities.',
        textAr: 'لو عملنا مراكز طلب؟ نجمع السواقين قرب المولات والجامعات.',
      },
      {
        speaker: 'Hassan El-Shourbagi',
        speakerAr: 'حسن الشوربجي',
        text: 'Smart. We can test that with 32 drivers. Let\'s see the numbers.',
        textAr: 'فكرة ذكية. ممكن نجرب بـ ٣٢ سواق. خلينا نشوف الأرقام.',
      },
    ],
  },

  // ── Level 2: Ring Road ───────────────
  {
    id: 2,
    zoneId: 'ring_road',
    name: 'Ring Road',
    nameAr: 'الطريق الدائري',
    subtitle: 'The Corridor Play',
    subtitleAr: 'لعبة الممرات',
    landmark: 'Ring Road Interchange',
    color: '#ECC94B',
    dialogues: [
      {
        speaker: 'Adel Mamdouh',
        speakerAr: 'عادل ممدوح',
        text: 'The Ring Road is Egypt\'s economic artery. Longer trips, higher fares — but the surge logic needs work.',
        textAr: 'الدائري شريان مصر الاقتصادي. رحلات أطول، أسعار أعلى — بس منطق السيرج محتاج شغل.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'At 15km average trips and 1.2x surge, the unit economics are actually better per-trip than Alex.',
        textAr: 'بمتوسط ١٥ كم والسيرج ١.٢، اقتصاديات الوحدة فعلاً أحسن من إسكندرية لكل رحلة.',
      },
      {
        speaker: 'Adel Mamdouh',
        speakerAr: 'عادل ممدوح',
        text: 'Show me the LTV:CAC ratio when we factor in highway driver acquisition costs.',
        textAr: 'ورّيني نسبة LTV:CAC لما نحسب تكلفة اكتساب سواقين الطريق السريع.',
      },
    ],
  },

  // ── Level 3: 5th Settlement ──────────
  {
    id: 3,
    zoneId: '5th_settlement',
    name: '5th Settlement',
    nameAr: 'التجمع الخامس',
    subtitle: 'Premium Territory',
    subtitleAr: 'منطقة بريميوم',
    landmark: 'AUC New Cairo',
    color: '#9F7AEA',
    dialogues: [
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: '5th Settlement — الناس هنا بتدفع. Premium customers, premium service, premium fare.',
        textAr: 'التجمع الخامس — الناس هنا بتدفع. عملاء بريميوم، خدمة بريميوم، سعر بريميوم.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'Base fare of 18 EGP with 4 EGP/km. Shortest dead miles at 2.8km. This zone is a goldmine.',
        textAr: 'سعر أساسي ١٨ جنيه و ٤ جنيه/كم. أقل ميل فاضي ٢.٨ كم. المنطقة دي منجم دهب.',
      },
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: 'الحمد لله. Now optimize it. Show Adel the numbers that make him say yes.',
        textAr: 'الحمد لله. دلوقتي حسّنها. ورّي عادل الأرقام اللي تخليه يقول أيوه.',
      },
    ],
  },

  // ── Level 4: New Cairo ───────────────
  {
    id: 4,
    zoneId: 'new_cairo',
    name: 'New Cairo',
    nameAr: 'القاهرة الجديدة',
    subtitle: 'Scale & Compete',
    subtitleAr: 'التوسع والمنافسة',
    landmark: 'Cairo Festival City',
    color: '#ED8936',
    dialogues: [
      {
        speaker: 'Adel Mamdouh',
        speakerAr: 'عادل ممدوح',
        text: 'New Cairo is where the competition gets fierce. Uber, Careem, InDriver — everyone wants this market.',
        textAr: 'القاهرة الجديدة — المنافسة هنا شرسة. أوبر، كريم، إن درايفر — الكل عايز السوق ده.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'Our edge: lower CAC through word-of-mouth in compound communities. And Nissan Sunny fleet = lower vehicle costs.',
        textAr: 'ميزتنا: تكلفة اكتساب أقل عن طريق الكلام في الكمبوندات. وأسطول النيسان صني = تكلفة مركبات أقل.',
      },
      {
        speaker: 'Hassan El-Shourbagi',
        speakerAr: 'حسن الشوربجي',
        text: 'I\'ve mapped the compound gates. If we pre-position 5 drivers at each gate during peak hours...',
        textAr: 'رسمت خريطة بوابات الكمبوندات. لو وضعنا ٥ سواقين عند كل بوابة في أوقات الذروة...',
      },
    ],
  },

  // ── Level 5: Downtown Cairo ──────────
  {
    id: 5,
    zoneId: 'downtown',
    name: 'Downtown Cairo',
    nameAr: 'وسط البلد',
    subtitle: 'The Final Boss',
    subtitleAr: 'المعركة الأخيرة',
    landmark: 'Tahrir Square',
    color: '#F56565',
    dialogues: [
      {
        speaker: 'Adel Mamdouh',
        speakerAr: 'عادل ممدوح',
        text: 'Downtown. Dense, chaotic, highest surge at 1.8x — but payout at 68%. This is the ultimate test.',
        textAr: 'وسط البلد. مزدحمة، فوضوية، أعلى سيرج ١.٨ — بس العائد ٦٨٪. دا الاختبار النهائي.',
      },
      {
        speaker: 'Mohamed Nagaty',
        speakerAr: 'محمد ناجاتي',
        text: 'وسط البلد مش بتاعة الضعفاء. You crack this, you crack Egypt. يا رب.',
        textAr: 'وسط البلد مش بتاعة الضعفاء. لو فتحتها، فتحت مصر. يا رب.',
      },
      {
        speaker: 'Mohamed Negm',
        speakerAr: 'محمد نجم',
        text: 'Short trips at 3.2km, but 4.5 EGP/km. The math works IF we keep utilization above 75%.',
        textAr: 'رحلات قصيرة ٣.٢ كم، بس ٤.٥ جنيه/كم. الحساب يمشي لو خلينا الاستغلال فوق ٧٥٪.',
      },
      {
        speaker: 'Adel Mamdouh',
        speakerAr: 'عادل ممدوح',
        text: 'Prove it. Run the simulation. Show me the dashboard that justifies this expansion.',
        textAr: 'اثبتها. شغّل المحاكاة. ورّيني الداشبورد اللي يبرر التوسع ده.',
      },
    ],
  },
]

/**
 * Get level data by index
 */
export function getLevel(index: number): LevelData | undefined {
  return LEVELS[index]
}

/**
 * Get all available level names
 */
export function getLevelNames(): { id: number; name: string; nameAr: string }[] {
  return LEVELS.map(l => ({ id: l.id, name: l.name, nameAr: l.nameAr }))
}
