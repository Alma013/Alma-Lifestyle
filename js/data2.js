// Harta · v2 content: passages, experts, soundscapes, fasting, keto recipes, prompts.
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
  { text: "De veți avea credință cât un grăunte de muștar, nimic nu va fi cu neputință vouă. If you have faith the size of a mustard seed, nothing will be impossible for you.", ref: "Matei · Matthew 17:20" },
  { text: "When you feel completely finished, you are not. The body keeps deep reserves it rarely opens: blood banked in the spleen, strength the mind reaches long before the muscles do. Feeling done and being done are different things.", ref: "a truth from physiology" },
  { text: "I lift up my eyes to the hills. From where does my help come? My help comes from the Lord, who made heaven and earth.", ref: "Psalm 121:1-2" },
  { text: "Do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.", ref: "Isaiah 41:10" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", ref: "Marcus Aurelius, Meditations" },
  { text: "Difficulties strengthen the mind, as labour does the body.", ref: "Seneca" },
  { text: "I am the master of my fate, I am the captain of my soul.", ref: "W. E. Henley, Invictus" },
  { text: "If you can force your heart and nerve and sinew to serve your turn long after they are gone, and so hold on when there is nothing in you except the will which says to them: hold on.", ref: "Rudyard Kipling, If" },
  { text: "Fall seven times, stand up eight.", ref: "Japanese proverb" },
  { text: "Apa trece, pietrele rămân. The water passes, the stones remain.", ref: "Romanian proverb" },
];

export const EVENING_PASSAGES = [
  { text: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.", ref: "Psalm 4:8" },
  { text: "He who watches over you will not slumber.", ref: "Psalm 121:3" },
  { text: "When you lie down, you will not be afraid; when you lie down, your sleep will be sweet.", ref: "Proverbs 3:24" },
  { text: "Let the day be content to end. What was done was enough; what was not done has a tomorrow.", ref: "an evening thought" },
  { text: "Sufficient unto the day. Put it down now; it will be lighter in the morning.", ref: "after Matthew 6:34" },
  { text: "Retire into yourself as often as you can; a quiet mind is the last kindness of the day.", ref: "after Marcus Aurelius" },
  { text: "Noaptea e un sfetnic bun. The night is a good counsellor: sleep on it.", ref: "Romanian proverb" },
  { text: "The day is done, and the body did its best. Thank it, and let it rest.", ref: "an evening thought" },
];
export function eveningPassageForToday(dateISO) {
  const seed = dateISO.split("-").reduce((a, b) => a + Number(b), 0);
  return EVENING_PASSAGES[seed % EVENING_PASSAGES.length];
}

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
  { id: "deep-432", name: "Deep tone", sub: "432 Hz warm pad", engine: "pad", base: 108 },
  { id: "glow-528", name: "Golden tone", sub: "528 Hz slow swell", engine: "pad", base: 132 },
  { id: "morning-light", name: "Morning light", sub: "a brighter lift, majors and air", engine: "pad", base: 165, bright: true },
  { id: "open-sky", name: "Open sky", sub: "wide, hopeful, unhurried", engine: "pad", base: 220, bright: true },
  { id: "piano", name: "Piano", sub: "slow cinematic piano, felt and warm", engine: "piano" },
  { id: "bowls", name: "Singing bowls", sub: "bronze rings that breathe", engine: "bowls" },
  { id: "kalimba", name: "Kalimba", sub: "thumb-piano, bright and kind", engine: "kalimba" },
  { id: "chimes", name: "Wind chimes", sub: "sparse bells on a soft breeze", engine: "chimes" },
];


// ---------- steadying: for pain and strong emotions ----------
// Every technique names its evidence honestly. None replace care; the intro
// in the app says so, kindly.
export const STEADY_TECHNIQUES = [
  {
    id: "physio-sigh",
    name: "The physiological sigh",
    when: "Acute stress, panic rising, before hard conversations",
    steps: ["Breathe in through the nose.", "Without exhaling, take a second short sniff on top, right to the brim.", "Let it all out through the mouth, long and slow.", "Repeat one to three times. That is the whole technique."],
    why: "The double inhale pops collapsed air sacs and the long exhale slows the heart. In a Stanford trial it lowered anxiety faster than meditation, minute for minute.",
    strength: "emerging",
    source: "Balban et al., Cell Reports Medicine (2023)",
  },
  {
    id: "grounding-54321",
    name: "5-4-3-2-1 grounding",
    when: "Spiralling thoughts, flashback edges, waiting-room dread",
    steps: ["Name five things you can see.", "Four you can feel against your skin.", "Three you can hear.", "Two you can smell.", "One you can taste. Speak them, slowly, out loud if you can."],
    why: "The senses can only report the present, so walking through them pulls attention out of the feared future and back into the room.",
    strength: "thin",
    source: "Widely used in clinical practice for acute anxiety; little formal trial data",
  },
  {
    id: "cold-water",
    name: "Cool water on the face",
    when: "Emotion so hot you cannot think",
    steps: ["Fill a basin or cup your hands with genuinely cool water.", "Hold your breath and put your face in, or press a cold, wet cloth over eyes and cheeks.", "Stay for twenty to thirty seconds. Feel the body downshift."],
    why: "Cold on the face while holding your breath triggers the mammalian dive reflex, which slows the heart within seconds. Clinicians teach it as the fastest body-first brake there is.",
    strength: "emerging",
    source: "DBT distress-tolerance skills (Linehan); dive-reflex physiology",
  },
  {
    id: "paced-pain",
    name: "Slow breathing through pain",
    when: "Managed, understood pain that flares",
    steps: ["Sit or lie where the pain is loudest.", "Breathe in through the nose for four, out through soft lips for six.", "On each exhale, let the muscles around the pain unclench, jaw first.", "Stay ten breaths before you judge whether it helped."],
    why: "Slow breathing measurably dampens pain perception in laboratory studies, partly by calming the same arousal systems that amplify hurt. It does not remove pain; it turns the volume down.",
    strength: "emerging",
    source: "Zautra et al., Pain (2010); paced-breathing analgesia studies",
  },
  {
    id: "attention-gate",
    name: "The gate, and where you point your mind",
    when: "Long evenings with a body that aches",
    steps: ["Choose something genuinely absorbing: a film that demands you, music with words you love, a call with someone funny.", "Give it your full attention on purpose, as a treatment rather than a distraction.", "Notice afterwards, not during, what the pain did."],
    why: "Gate-control theory is one of the oldest solid findings in pain science: the spinal cord passes less pain signal when attention is genuinely elsewhere. Absorption is not denial; it is neurology.",
    strength: "strong",
    source: "Melzack and Wall, Science (1965); attention-analgesia literature",
  },
  {
    id: "wave",
    name: "Riding the wave",
    when: "Grief surges, anger spikes, cravings",
    steps: ["Name it: this is a wave, and waves crest.", "Set a timer for ten minutes and make no decisions until it rings.", "Breathe slowly and watch the feeling like weather, with curiosity instead of argument.", "When the timer rings, notice the water line has moved."],
    why: "Strong emotional surges are physiologically self-limiting; they crest and fall within minutes when they are not re-fed. Watching instead of wrestling lets the wave complete.",
    strength: "thin",
    source: "Urge-surfing practice from acceptance-based therapies (Marlatt)",
  },
  {
    id: "muscle-release",
    name: "Tense and release",
    when: "A body that will not unclench, nights before scans",
    steps: ["Starting at the feet, tense one muscle group hard for five seconds.", "Release completely and feel the difference for ten.", "Move up the body: calves, thighs, hands, shoulders, face.", "Finish with three slow breaths in the loosened body."],
    why: "Progressive muscle relaxation has decades of trial evidence for stress and sleep, and it works even when the mind refuses to cooperate, because it starts with the body.",
    strength: "strong",
    source: "Cochrane and meta-analytic reviews of progressive muscle relaxation",
  },
];
// ---------- the achiever's mindset: getting to the state ----------
export const ACHIEVER_TECHNIQUES = [
  {
    id: "implementation",
    name: "Decide once: when X, I will Y",
    when: "Goals that keep dissolving into good intentions",
    steps: ["Take the thing you keep meaning to do.", "Write it as: when [specific cue], I will [specific action]. When I pour the morning coffee, I will book the walk.", "Say it once out loud. The decision is now made; the moment only has to arrive."],
    why: "Implementation intentions are one of the most replicated effects in behaviour science: pre-deciding the cue-action pair roughly doubles follow-through because the choice no longer happens in the tired moment.",
    strength: "strong",
    source: "Gollwitzer and Sheeran, meta-analysis of 94 studies (2006)",
  },
  {
    id: "rehearsal",
    name: "Run the film first",
    when: "Before anything you want to do well: a scan day, a hard conversation, a return to training",
    steps: ["Close your eyes and run the event once as a film: where you stand, what you say, how your hands feel.", "Run it again at real speed, including the one moment you fear, going fine.", "Open your eyes and do the first small physical step immediately."],
    why: "Mental rehearsal measurably improves execution in sport, surgery and public performance; the brain treats vivid rehearsal as practice. It does not replace practice; it primes it.",
    strength: "emerging",
    source: "Motor-imagery meta-analyses (e.g. Driskell et al.; surgical training RCTs)",
  },
  {
    id: "distanced-talk",
    name: "Coach yourself by name",
    when: "Nerves, self-doubt, the inner critic getting loud",
    steps: ["Switch the inner voice from I to your own name or you.", "Ask: what does [your name] need to do in the next five minutes?", "Answer as the coach would: specific, warm, brief. Then do that one thing."],
    why: "Distanced self-talk recruits the brain's regulation circuits with surprisingly little effort: people reason about themselves more wisely from one step back.",
    strength: "emerging",
    source: "Kross et al., Journal of Personality and Social Psychology (2014)",
  },
  {
    id: "move-first",
    name: "Move before you decide how you feel",
    when: "Flat mornings, dread before tasks, the couch's gravity",
    steps: ["Two minutes of brisk anything: stairs, fast walk, twenty slow squats.", "Only then ask how you feel and what is next.", "Ride the raised state into the first small task."],
    why: "A short burst of movement reliably lifts arousal and mood within minutes; it is the fastest legal state-changer there is, and the decision made after it is made by a different chemistry.",
    strength: "strong",
    source: "Acute-exercise and mood meta-analyses (Sports Medicine)",
  },
  {
    id: "smallest-win",
    name: "Bank the smallest win",
    when: "Big goals that feel far away",
    steps: ["Shrink today's contribution until it is almost embarrassing: one paragraph, one phone call, one vegetable.", "Do it early and mark it done somewhere you can see.", "Let the day be a success at 9 am; anything more is bonus."],
    why: "The strongest single driver of motivation across hundreds of workdays studied was visible progress on meaningful work, however small. Momentum is built from wins you can see, not wins you can brag about.",
    strength: "emerging",
    source: "Amabile and Kramer, The Progress Principle (2011)",
  },
  {
    id: "reserve",
    name: "The reserve is real",
    when: "The moment you decide you are finished",
    steps: ["Notice the thought: I have nothing left.", "Recall the physiology: the mind signals empty long before the body is; there are reserves you have not touched.", "Negotiate one more small unit: one more minute, one more length, one more honest sentence. Then decide again."],
    why: "Fatigue research suggests the sense of exhaustion is a protective forecast by the brain, not a fuel gauge reading zero; trained people routinely find more when the forecast is renegotiated. Feeling done and being done are different things.",
    strength: "thin",
    source: "Noakes, central governor model, British Journal of Sports Medicine (2012); anticipatory-regulation literature",
  },
];
export const ACHIEVER_NOTE = "State first, then the task. None of this is hustle; it is the same gentleness as the rest of Harta, pointed forward.";

export const STEADY_NOTE = "These tools are for living alongside managed pain and big feelings. Pain that is new, severe or frightening is a same-day doctor conversation, not a breathing exercise. And if the dark ever gets heavy, Lifeline is there around the clock on 13 11 14.";

// ---------- the counsel: strategy for difficult situations ----------
// Frameworks with real evidence or deep clinical use, composed on-device.
export const COUNSEL_WHO = [
  ["child", "My child"], ["partner", "My partner"], ["family", "Family"], ["colleague", "A colleague"],
  ["boss", "A manager"], ["friend", "A friend"], ["medical", "A doctor or the system"], ["myself", "Myself"],
];
export const COUNSEL_WANT = [
  ["repair", "Protect the relationship"], ["outcome", "Reach an outcome"], ["boundary", "Hold a boundary"],
  ["understood", "Be understood"], ["deescalate", "Cool it down first"],
];
export const COUNSEL_PLAYS = {
  child: {
    name: "With a child",
    principle: "Connect before you correct. A child in a storm cannot hear a lesson; a child who feels felt can.",
    steps: [
      "Regulate yourself first: one slow exhale, drop your shoulders, lower your voice below theirs.",
      "Name what you see without judgement: \u201CYou are really angry that the game ended.\u201D Feeling named is feeling tamed.",
      "Hold the limit warmly: the boundary stays, the love is loud. \u201CI won\u2019t let you hit. You can be angry.\u201D",
      "Offer two acceptable choices, both of which you can live with. Choice returns dignity.",
      "Repair later, in calm: ask what happened for them, tell them what happened for you, plan together for next time.",
    ],
    say: ["\u201CYou wanted\u2026 and it did not happen. That is genuinely hard.\u201D", "\u201CI\u2019m on your side, and the answer is still no.\u201D", "\u201CDo you want to do it now, or after dinner? You choose.\u201D"],
    avoid: "Reasoning mid-meltdown, sarcasm, comparing them to siblings, winning. The goal is a child who trusts you with their worst moments.",
    source: "Faber and Mazlish, How to Talk So Kids Will Listen (1980); Siegel, The Whole-Brain Child (2011); Gottman's emotion coaching",
  },
  partner: {
    name: "With a partner",
    principle: "Soft start-up decides the fight. How a conversation begins predicts how it ends better than what it is about.",
    steps: [
      "Start with I, a feeling and a specific event: never \u201Cyou always\u201D.",
      "One issue only. The archive stays closed.",
      "Listen to understand and prove it: say their side back until they say \u201Cyes, that\u2019s it\u201D before you answer it.",
      "Accept influence: find the part of their view that is right and say so first.",
      "If either of you floods, pause by agreement (twenty minutes, named return time), not by walking out.",
    ],
    say: ["\u201CWhen X happened, I felt Y, because Z matters to me. What I need is\u2026\u201D", "\u201CLet me check I have you: you\u2019re saying\u2026 did I get it?\u201D", "\u201CYou\u2019re right that\u2026 And I\u2019d add\u2026\u201D"],
    avoid: "Criticism of character, contempt in any costume, defensiveness, the silent wall. These four predict the end of relationships more reliably than conflict itself.",
    source: "Gottman and Silver, The Seven Principles (1999); Rosenberg, Nonviolent Communication (2003)",
  },
  work: {
    name: "At work",
    principle: "Separate the person from the problem, and interests from positions. Ask what they need, not what they demand.",
    steps: [
      "Before the room: write your objective in one sentence and your walk-away line. Clarity in, clarity out.",
      "Open with shared purpose: name the goal you both hold before the point where you differ.",
      "State facts first, story second, and label your story as a story: \u201CHere is what I observed\u2026 the story I\u2019m telling myself is\u2026\u201D",
      "Ask a real question and stop talking. Silence does the heavy lifting.",
      "Close by naming who does what by when, out loud. Vague endings undo good conversations.",
    ],
    say: ["\u201CWe both want this project to land well. Where I see a risk is\u2026\u201D", "\u201CHelp me understand what matters most on your side.\u201D", "\u201CSo we\u2019re agreed: I\u2019ll\u2026 you\u2019ll\u2026 by Friday.\u201D"],
    avoid: "Arguing positions instead of interests, email for anything hot, sarcasm in writing, agreeing in the room and disagreeing in the corridor.",
    source: "Fisher and Ury, Getting to Yes (1981); Patterson et al., Crucial Conversations (2002)",
  },
  boundary: {
    name: "Holding a boundary",
    principle: "A boundary is a sentence about what you will do, not a debate about what they should do.",
    steps: [
      "Describe the situation in one neutral sentence.",
      "Express the effect on you, briefly, without accusation.",
      "Assert the ask in one clear sentence. One.",
      "Reinforce: name what saying yes makes possible for both of you.",
      "Stay: repeat the same sentence calmly as often as needed. No new arguments; the broken-record is the technique.",
    ],
    say: ["\u201CI\u2019m not available for that.\u201D", "\u201CI want to help, and I can do X. I can\u2019t do Y.\u201D", "\u201CAs I said, that doesn\u2019t work for me.\u201D"],
    avoid: "Over-explaining (each reason is a handle to pull), apologising for existing, yes-then-resentment. A kind no beats a bitter yes every time.",
    source: "DEAR MAN, DBT interpersonal effectiveness (Linehan); assertiveness training literature",
  },
  deescalate: {
    name: "Cooling it down",
    principle: "Nobody reasons at 140 beats per minute. The first strategic move in any hot moment is temperature, not content.",
    steps: [
      "Body first: exhale long, feet on the floor, voice slower and lower than theirs.",
      "Acknowledge the feeling without conceding the point: \u201CI can see this really matters to you.\u201D",
      "Ask one open question and genuinely listen. Attacked people expect defence; curiosity disarms.",
      "If you caused hurt, own your piece cleanly and specifically. Partial apologies reignite.",
      "If heat keeps rising, postpone with respect and a named time: retreat with a return date is strategy, not surrender.",
    ],
    say: ["\u201CYou might be right. Tell me more.\u201D", "\u201CI want to get this right rather than fast. Can we pick it up at four?\u201D", "\u201CThe part I got wrong was\u2026 I\u2019m sorry for that part.\u201D"],
    avoid: "\u201CCalm down\u201D (it never has), matching volume, audience battles: move any hot conversation away from onlookers.",
    source: "Verbal de-escalation practice (crisis intervention literature); Stone, Patton and Heen, Difficult Conversations (1999)",
  },
};

// ---------- speak: the craft of being heard ----------
export const SPEAK_LESSONS = [
  { id: "prep", title: "Land the point in four moves", one: "Point, reason, example, point. The oldest structure that still wins rooms.",
    body: "Say the point first, in one sentence. Give the reason. Make it real with one concrete example. Then say the point again in fresh words. Listeners forgive almost anything except not knowing what you are asking of them.",
    practice: "Take something you want this week and say it aloud in PREP form, under thirty seconds.", strength: "strong", source: "Classical rhetoric; toastmasters and speechcraft practice" },
  { id: "concrete", title: "Speak in things, not abstractions", one: "\u201C204 days\u201D beats \u201Ca long time\u201D. Specifics are what memory keeps.",
    body: "Abstract words slide off; concrete ones stick and travel. \u201CImprove communication\u201D is fog; \u201Canswer within a day, even if the answer is \u2018not yet\u2019\u201D is a sentence people can repeat to someone else, which is the real test of impact.",
    practice: "Catch one abstraction in your own speech today and replace it with a number, an object or a moment.", strength: "strong", source: "Heath and Heath, Made to Stick (2007); concreteness effects in memory research" },
  { id: "pause", title: "The pause is the power", one: "Silence after your point is confidence made audible.",
    body: "Rushing signals doubt; the pause signals weight. Stop fully at the end of a sentence. Let the silence sit while the point lands. In negotiation and in parenting alike, whoever is comfortable with silence holds the room.",
    practice: "In your next conversation, finish one sentence and count two full beats before the next.", strength: "emerging", source: "Speech pacing research; negotiation practice" },
  { id: "story", title: "Carry the point inside a story", one: "A person, a struggle, a turn. Stories are the packaging attention accepts.",
    body: "Data convinces the convinced; story reaches the rest. The smallest working story has a person the listener can see, a difficulty they can feel and a turn that carries your point. Ten seconds is enough: \u201CLast Tuesday a patient asked me\u2026\u201D",
    practice: "Find one ten-second story that carries the point you make most often.", strength: "strong", source: "Narrative persuasion research; Heath and Heath (2007)" },
  { id: "influence", title: "Influence as illumination", one: "Show people clearly, and let the seeing do the moving. Influence that needs hiding is not influence you want.",
    body: "The classic levers of influence are real: people follow those they trust, reciprocate care, honour their own commitments, move with those like them, and act when things are scarce or urgent. Use them in the open: show your credentials by being useful, invite small commitments honestly, name real deadlines only. The test is simple: would the influence survive the other person knowing exactly what you are doing? If yes, it is illumination. If no, it is manipulation, and it costs you the only currency that compounds: being believed next time.",
    practice: "Before your next ask, write the one sentence you would be comfortable with the other person reading over your shoulder.", strength: "strong", source: "Cialdini, Influence (1984), held to the illumination standard" },
  { id: "ask", title: "Ask so it can be given", one: "Clear, specific, one sentence, then quiet.",
    body: "Most asks fail by being fog: too hedged to refuse or grant. Name exactly what you want, from whom, by when, and why it serves the shared goal. Then stop. The person who keeps talking after the ask is negotiating against themselves.",
    practice: "Write your biggest current ask as one sentence with a name and a date in it.", strength: "strong", source: "DEAR MAN (Linehan); negotiation literature" },
  { id: "listen", title: "Listening is the fastest way to be heard", one: "People cannot take in your point while theirs is still unheld.",
    body: "Prove you heard before you answer: say their view back until they agree you have it. This is not conceding; it is clearing the channel. In hard conversations the sequence is always the same: their point held, then yours lands.",
    practice: "Once today, answer with their point first: \u201CSo what matters to you here is\u2026\u201D and only then your own.", strength: "strong", source: "Motivational interviewing evidence; Rogers; Crucial Conversations (2002)" },
  { id: "voice", title: "The breath under the voice", one: "A supported breath is a steady voice. The sanctuary and the boardroom use the same muscle.",
    body: "Nerves live in the breath: shallow air makes a thin, fast, high voice. Before speaking, one slow exhale, then speak on the top of a full breath, ending sentences downward rather than upward. Downward endings sound like conclusions; upward ones sound like questions asked of your own point.",
    practice: "Read one paragraph aloud ending every sentence with a falling tone. Feel the difference in authority.", strength: "emerging", source: "Voice pedagogy; speech-production research" },
];
export const SPEAK_NOTE = "Everything here obeys one rule from the house constitution: illuminate, never manipulate. Impact that survives daylight.";

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
    "Water-only fasting beyond about 24 hours belongs under medical supervision, full stop. Harta will keep you company through an overnight or time-restricted fast; the long ones belong to you and your care team.",
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
    take: "Her hacks are free and low-risk: eat vegetables first, prefer a savoury breakfast, dress carbs with fibre, protein or vinegar, and move for ten minutes after meals. Harta's after-dinner-walk nudge is exactly this.",
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
    take: "If you measure ketones, her ratio gives the numbers a shape: under 80 is deep therapeutic territory, under 40 deeper still. Harta computes it automatically when you log both readings.",
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
    take: "His practical protocols are the backbone of Harta's fasting timers: start with 12:12, earn 16:8, break fasts gently, salt and water matter, and hunger comes in waves that pass.",
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
    take: "The glucose-ketone index (GKI) he proposed is computable from readings you may already take, and Harta shows it. The metabolic view of cancer is a genuinely interesting research frontier.",
    hold: "This is the most important label in this app: ketogenic metabolic therapy for cancer is research-stage and contested, tested mostly in small trials and case series. It is discussed as an adjunct under an oncology team, never instead of treatment. Anyone who sells it as a cure is selling a mirage, and Harta does not.",
    strength: "contested",
    source: "Thomas Seyfried, Cancer as a Metabolic Disease (2012); GKI: Meidenbauer et al., Nutrition & Metabolism (2015)",
  },
];

// ---------- Dr Li's defence-systems table (Eat to Beat Disease, 2019) ----------
// Representative foods per system, as popularised in his book; not exhaustive.
export const LI_TABLE = {
  title: "The five defence systems, and foods that feed them",
  intro: "Dr William Li's framework: the body already runs five health-defence systems, and specific foods support each. His 5x5x5 habit: from the foods you already love, eat for five systems, five foods a day, across your meals.",
  systems: [
    ["Angiogenesis", "Keeps blood-vessel growth balanced: starves what should not grow, feeds what should heal", ["Cooked tomatoes", "Soy", "Green tea", "Coffee", "Berries", "Dark chocolate", "Extra-virgin olive oil"]],
    ["Regeneration", "Stem cells that repair and rebuild tissue", ["Dark chocolate", "Black and green tea", "Wholegrains", "Olive oil", "Oily fish", "Turmeric", "Mango"]],
    ["Microbiome", "The gut bacteria that train immunity and make short-chain fats", ["Sauerkraut", "Kimchi", "Yoghurt", "Kefir", "Aged cheese", "Sourdough", "Pomegranate", "High-fibre vegetables"]],
    ["DNA protection", "Repair enzymes and antioxidant shielding for the genome", ["Broccoli and the cruciferous family", "Berries", "Walnuts and mixed nuts", "Kiwifruit", "Carrots", "Citrus", "Turmeric"]],
    ["Immunity", "Surveillance that finds and clears what should not be there", ["Mushrooms", "Garlic, especially aged", "Broccoli sprouts", "Blueberries", "Chilli", "Citrus", "Extra-virgin olive oil"]],
  ],
  source: "William Li, Eat to Beat Disease (2019); Eat to Beat Your Diet (2023)",
};

// ---------- how to choose food (the methodology, in one place) ----------
export const METHOD_CARD = {
  title: "How Harta chooses food, and how you can",
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
    id: "sweetness",
    title: "Sweetness without the sugar",
    oneLiner: "When a recipe needs sweet, Harta reaches for allulose, pure stevia or pure monk fruit.",
    body: "These three earn their place differently to the old artificial sweeteners: allulose is a rare sugar that tastes and bakes like sugar with almost no glucose effect; stevia and monk fruit are plant extracts used for centuries with good safety records. Two honest cautions: buy them pure (many blends are padded with maltodextrin, which is just fast glucose wearing a costume), and let overall sweetness drift down over time, because the quiet goal is a palate that no longer asks.",
    action: "Check the label: the ingredient list should say allulose, steviol glycosides or monk fruit extract, and nothing else.",
    strength: "emerging",
    source: "FDA GRAS reviews; allulose glycaemic studies (Journal of Nutrition, 2018)",
  },
  {
    id: "sound-calm",
    title: "Why the sanctuary works",
    oneLiner: "Slow breath and soft sound settle the nervous system. That is the whole claim, and it is enough.",
    body: "Slow breathing at around six breaths a minute is one of the best-studied relaxation practices there is: it steadies the heart and eases the stress response, and a settled evening is the soil better dinners and better sleep grow from. The tones are tuned low and warm because that is what most people find calming, not because a particular frequency heals the body; that claim has no good evidence behind it, so Harta simply does not make it. The calm is real, and it is yours either way.",
    action: "Three quiet minutes tonight before dinner. Notice what your shoulders do.",
    strength: "strong",
    source: "Reviews of slow-paced breathing and heart-rate variability (Frontiers in Human Neuroscience, 2018); the relaxation-response literature",
  },
  {
    id: "keto-evidence",
    title: "Keto, honestly ranked",
    oneLiner: "One diet, three very different evidence levels depending on what it's for.",
    body: "For drug-resistant epilepsy, ketogenic diets are established medicine with decades of use. For weight loss and type 2 diabetes, trials show real benefit over 6 to 12 months, comparable to other well-kept diets, with adherence the deciding factor. For cancer, it is research-stage: intriguing mechanisms, small trials, no proof of survival benefit yet. Same diet, three honesty levels.",
    action: "If you switch Harta to keto mode, tell your GP, especially if you take any medication.",
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
    action: "Log a morning glucose and ketone reading together and Harta will chart both ratios.",
    strength: "thin",
    source: "Meidenbauer et al., Nutrition & Metabolism (2015); Bosworth, ketoCONTINUUM (2020)",
  },
  {
    id: "cgm",
    title: "Wearing a sensor without wearing it as a verdict",
    oneLiner: "A CGM shows your food responses in real time. Its best use is curiosity, not judgement.",
    body: "Continuous glucose monitors were built for diabetes and are now used by curious healthy people. They genuinely personalise food choices: the same meal produces different curves in different people. But healthy glucose varies, spikes are normal physiology, and chasing flatness can turn eating anxious. Harta reads your numbers for patterns and keeps the tone kind.",
    action: "Import a fortnight of data, then look at patterns by meal, not single readings.",
    strength: "emerging",
    source: "Zeevi et al., Cell (2015), personalised glucose responses",
  },
];
