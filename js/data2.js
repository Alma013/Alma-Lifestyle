// Alma · v2 content: passages, experts, soundscapes, fasting, keto recipes, prompts.
// Scripture renderings follow public-domain translations. Every health claim
// carries its source and an honest strength label. Australian English.

// ---------- daily passages (the threshold) ----------
// mix: psalms and other scripture, then wisdom for the soul. Rotated by day.
export const PASSAGES = [
  { text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures; he leads me beside still waters. He restores my soul.", ref: "Psalm 23:1-3" },
  { text: "This is the day the Lord has made; let us rejoice and be glad in it.", ref: "Psalm 118:24" },
  { text: "He gives strength to the weary and increases the power of the weak. Those who hope in the Lord will renew their strength.", ref: "Isaiah 40:29-31" },
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "I praise you, for I am fearfully and wonderfully made. Wonderful are your works; my soul knows it very well.", ref: "Psalm 139:14" },
  { text: "Weeping may stay for the night, but joy comes in the morning.", ref: "Psalm 30:5" },
  { text: "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life.", ref: "Psalm 27:1" },
  { text: "Cast your burden on the Lord, and he will sustain you.", ref: "Psalm 55:22" },
  { text: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever.", ref: "Psalm 73:26" },
  { text: "He heals the broken-hearted and binds up their wounds.", ref: "Psalm 147:3" },
  { text: "Trust in the Lord with all your heart, and lean not on your own understanding. In all your ways acknowledge him, and he will make your paths straight.", ref: "Proverbs 3:5-6" },
  { text: "For everything there is a season, and a time for every purpose under heaven.", ref: "Ecclesiastes 3:1" },
  { text: "A cheerful heart is good medicine.", ref: "Proverbs 17:22" },
  { text: "Do not be anxious about tomorrow, for tomorrow will be anxious for itself. Each day has enough of its own.", ref: "Matthew 6:34" },
  { text: "You have power over your mind, not outside events. Realise this, and you will find strength.", ref: "Marcus Aurelius, Meditations" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", ref: "Marcus Aurelius, Meditations" },
  { text: "It is not that we have a short time to live, but that we waste much of it. Life is long, if you know how to use it.", ref: "Seneca, On the Shortness of Life" },
  { text: "No man is free who is not master of himself.", ref: "Epictetus" },
  { text: "Nature does not hurry, yet everything is accomplished.", ref: "Lao Tzu" },
  { text: "A tree with strong roots laughs at storms.", ref: "proverb" },
  { text: "The wound is the place where the light enters you.", ref: "attributed to Rumi" },
  { text: "Începutul este jumătatea oricărei lucrări. To begin is half of any work.", ref: "Romanian proverb" },
];

export function passageForToday(dateISO) {
  const seed = dateISO.split("-").reduce((a, b) => a + Number(b), 0);
  return PASSAGES[seed % PASSAGES.length];
}

// ---------- inner-power prompts (discovering yourself through what was hard) ----------
export const PROMPTS = [
  "What did the hardest season of your life make undeniably clear about what you value?",
  "Write about a strength you discovered only because you had no choice but to find it.",
  "What would you tell the version of you from one year ago, in three sentences?",
  "What is one thing your body carried you through that you have never properly thanked it for?",
  "Which small daily moment felt sacred this week? Describe it slowly.",
  "What are you no longer willing to spend your energy on? What freed that space?",
  "Describe a person who showed up for you. What exactly did they do?",
  "If your energy were a garden, what is growing right now? What needs weeding?",
  "What do you know now that you could only have learned the hard way?",
  "Write the sentence you needed to hear on your worst day. You are allowed to be the one who says it.",
];

// ---------- soundscapes (synthesised on device, honest about the evidence) ----------
export const SOUNDSCAPES = [
  { id: "deep-432", name: "Deep tone", sub: "432 Hz warm pad", engine: "pad", base: 108, detune: 432 },
  { id: "glow-528", name: "Golden tone", sub: "528 Hz slow swell", engine: "pad", base: 132, detune: 528 },
  { id: "ocean", name: "Ocean air", sub: "slow waves of breath", engine: "ocean" },
  { id: "night-rain", name: "Night rain", sub: "soft, steady, close", engine: "rain" },
];
export const SOUND_HONESTY = "The calm these tones bring is real and worth having. Claims that specific frequencies heal the body are not supported by good evidence, so Alma promises presence, not medicine.";

// ---------- fasting ----------
export const FAST_PROTOCOLS = [
  { id: "12-12", label: "12:12", fastH: 12, sub: "The gentle default: finish dinner, keep the kitchen closed until breakfast.", level: "everyday" },
  { id: "14-10", label: "14:10", fastH: 14, sub: "A later breakfast. Most of the fast happens while you sleep.", level: "everyday" },
  { id: "16-8", label: "16:8", fastH: 16, sub: "The classic eating window. Best worked up to, not started at.", level: "experienced" },
];
export const FASTING_SAFETY = {
  title: "Read first: who should not fast",
  lines: [
    "Fasting is not for everyone, and longer is not better. Do not fast if you are pregnant or breastfeeding, if you are underweight, or if you have any history of disordered eating: for you, the kitchen staying open is the healthy choice.",
    "If you live with diabetes, take blood-pressure or glucose-lowering medication, or are in active treatment of any kind, fasting changes how your medication behaves. It needs your doctor's yes before your first skipped meal, not after.",
    "Water-only fasting beyond about 24 hours belongs under medical supervision, full stop. Alma will keep you company through an overnight or time-restricted fast; the long ones belong to you and your care team.",
    "Children and teenagers should never fast for health reasons.",
  ],
};

// ---------- the voices (experts), with honest labels ----------
// strength: strong | emerging | thin | contested. "Take" is what earns its place;
// "hold" is what to hold lightly, so trust in the app stays deserved.
export const EXPERTS = [
  {
    id: "li",
    name: "Dr William Li",
    mono: "WL",
    field: "Physician, angiogenesis researcher",
    idea: "Food is not only fuel; certain foods feed the body's own defence systems: blood-vessel regulation, regeneration, the microbiome, DNA protection and immunity.",
    take: "Eat deliberately from the foods his research catalogues: tomatoes, dark leafy greens, berries, legumes, nuts, olive oil, tea, mushrooms, fermented foods. It overlaps almost perfectly with the Mediterranean pattern this app already plans.",
    hold: "Individual foods are not medicines, and single-food headlines outrun the data. The pattern carries the evidence; no tomato ever cured anyone.",
    strength: "emerging",
    source: "William Li, Eat to Beat Disease (2019)",
  },
  {
    id: "inchauspe",
    name: "Jessie Inchauspé",
    mono: "JI",
    field: "Biochemist, author (the Glucose Goddess)",
    idea: "The order and company of carbohydrates changes the glucose curve they produce: vegetables and protein first, carbs last, flatter curve, steadier energy.",
    take: "Her hacks are free and low-risk: eat vegetables first, prefer a savoury breakfast, dress carbs with fibre, protein or vinegar, and move for ten minutes after meals. Alma's after-dinner-walk nudge is exactly this.",
    hold: "Most evidence comes from small studies and CGM self-experiments; effects are real but modest. Glucose spikes in healthy people are not emergencies, and chasing a perfectly flat line is its own trap.",
    strength: "emerging",
    source: "Jessie Inchauspé, Glucose Revolution (2022)",
  },
  {
    id: "boz",
    name: "Dr Annette Bosworth (Dr Boz)",
    mono: "AB",
    field: "Internal-medicine physician",
    idea: "Metabolic health can be coached with simple numbers. Her Dr Boz ratio (morning glucose in mg/dL divided by blood ketones in mmol/L) tracks how deeply the body is in fat-burning.",
    take: "If you measure ketones, her ratio gives the numbers a shape: under 80 is deep therapeutic territory, under 40 deeper still. Alma computes it automatically when you log both readings.",
    hold: "The ratio is a coaching tool from clinical practice, not a validated outcome marker. Useful for trends, not for verdicts.",
    strength: "thin",
    source: "Annette Bosworth, ketoCONTINUUM (2020)",
  },
  {
    id: "fung",
    name: "Dr Jason Fung",
    mono: "JF",
    field: "Nephrologist, fasting clinician",
    idea: "Insulin sits at the centre of metabolic disease, and giving the body regular breaks from eating (time-restricted and intermittent fasting) lowers the insulin load.",
    take: "His practical protocols are the backbone of Alma's fasting timers: start with 12:12, earn 16:8, break fasts gently, salt and water matter, and hunger comes in waves that pass.",
    hold: "Trials show intermittent fasting works about as well as continuous calorie reduction, not magically better. The insulin model is contested among researchers, and his stronger claims outrun the trial data.",
    strength: "emerging",
    source: "Jason Fung, The Obesity Code (2016); The Complete Guide to Fasting (2016)",
  },
  {
    id: "seyfried",
    name: "Dr Thomas Seyfried",
    mono: "TS",
    field: "Cancer metabolism researcher",
    idea: "Cancer can be understood partly as a metabolic disease: many tumour cells depend heavily on glucose and glutamine, so pressing on metabolism (ketogenic diets, the glucose-ketone index) might make some cancers more treatable.",
    take: "The glucose-ketone index (GKI) he proposed is computable from readings you may already take, and Alma shows it. The metabolic view of cancer is a genuinely interesting research frontier.",
    hold: "This is the most important label in this app: ketogenic metabolic therapy for cancer is research-stage and contested, tested mostly in small trials and case series. It is discussed as an adjunct under an oncology team, never instead of treatment. Anyone who sells it as a cure is selling a mirage, and Alma does not.",
    strength: "contested",
    source: "Thomas Seyfried, Cancer as a Metabolic Disease (2012); GKI: Meidenbauer et al., Nutrition & Metabolism (2015)",
  },
];

// ---------- how to choose food (the methodology, in one place) ----------
export const METHOD_CARD = {
  title: "How Alma chooses food, and how you can",
  steps: [
    ["The base is the pattern", "Whole foods, mostly plants, olive oil, fish, legumes, nuts: the Mediterranean pattern holds the strongest all-cause evidence in nutrition (PREDIMED; Australian Dietary Guidelines)."],
    ["Add by defence", "When choosing between vegetables, rotate variety and lean on Li's defence-system foods: greens, tomatoes, mushrooms, berries, ferments."],
    ["Order and company", "Plate order matters more than carb fear: vegetables first, protein next, carbs last and dressed with fibre or vinegar (Inchauspé)."],
    ["Personalise with data", "If you wear a sensor or prick-test, let your own curves promote or demote foods. Your glucose response to rice is yours, not the average's."],
    ["Ketosis is a tool, not a religion", "Ketogenic eating is a legitimate clinical tool (epilepsy: strong; weight and type 2 diabetes: moderate; cancer: research-stage) that deserves supervision, planning and an exit strategy."],
    ["Exclude honestly", "Foods you exclude for allergy, faith, treatment or choice are simply removed from planning, no drama. Temporary exclusions get review dates so they do not silently become forever."],
  ],
};

// ---------- extra why-cards for v2 ----------
export const WHY_CARDS_V2 = [
  {
    id: "keto-evidence",
    title: "Keto, honestly ranked",
    oneLiner: "One diet, three very different evidence levels depending on what it's for.",
    body: "For drug-resistant epilepsy, ketogenic diets are established medicine with decades of use. For weight loss and type 2 diabetes, trials show real benefit over 6 to 12 months, comparable to other well-kept diets, with adherence the deciding factor. For cancer, it is research-stage: intriguing mechanisms, small trials, no proof of survival benefit yet. Same diet, three honesty levels.",
    action: "If you switch Alma to keto mode, tell your GP, especially if you take any medication.",
    strength: "emerging",
    source: "Cochrane review (epilepsy, 2020); Virta Health 2-year trial (T2D, 2019); reviews of ketogenic metabolic therapy in oncology",
  },
  {
    id: "fasting-evidence",
    title: "What fasting can and cannot do",
    oneLiner: "Time-restricted eating helps some people eat less and feel steadier. It is not magic.",
    body: "Randomised trials find intermittent fasting produces similar weight and metabolic results to ordinary calorie reduction; its real advantage is that some people find it far easier to keep. Longer fasts amplify risks faster than benefits. Autophagy headlines run ahead of human data.",
    action: "If eating windows suit you, start at 12:12 for two weeks before narrowing anything.",
    strength: "emerging",
    source: "Varady et al., Annual Review of Nutrition (2021); NEJM review of intermittent fasting (2019)",
  },
  {
    id: "gki",
    title: "GKI and the Dr Boz ratio",
    oneLiner: "Two ways of reading glucose and ketones together, useful for trends.",
    body: "The glucose-ketone index divides glucose (mmol/L) by ketones (mmol/L); researchers use it to describe how deeply someone is in therapeutic ketosis, with values under 3 discussed in research settings. The Dr Boz ratio is the same idea in American units. Both are trend tools from research and clinical practice, not diagnoses, and neither has proven outcome targets outside epilepsy research.",
    action: "Log a morning glucose and ketone reading together and Alma will chart both ratios.",
    strength: "thin",
    source: "Meidenbauer et al., Nutrition & Metabolism (2015); Bosworth, ketoCONTINUUM (2020)",
  },
  {
    id: "cgm",
    title: "Wearing a sensor without wearing it as a verdict",
    oneLiner: "A CGM shows your food responses in real time. Its best use is curiosity, not judgement.",
    body: "Continuous glucose monitors were built for diabetes and are now used by curious healthy people. They genuinely personalise food choices: the same meal produces different curves in different people. But healthy glucose varies, spikes are normal physiology, and chasing flatness can turn eating anxious. Alma reads your numbers for patterns and keeps the tone kind.",
    action: "Import a fortnight of data, then look at patterns by meal, not single readings.",
    strength: "emerging",
    source: "Zeevi et al., Cell (2015), personalised glucose responses",
  },
];
