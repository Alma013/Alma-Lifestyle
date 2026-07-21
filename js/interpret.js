// Harta · plain-English interpretation of readings and labs.
// Built on published reference ranges, named at the bottom of every card.
// The line it never crosses: ranges explained is not a person diagnosed;
// treatment decisions stay with the doctor, and urgent numbers say so loudly.

// history: prior readings of the same type (newest first) for personal trends
export function personalGlucose(v, ctx, history) {
  const out = {};
  const line = ctx === "post" ? 7.8 : 5.4;
  const d = Math.round((v - line) * 10) / 10;
  out.headline = d > 0
    ? `Your reading is ${v} mmol/L: ${d} above the ${ctx === "post" ? "typical after-meal ceiling of 7.8" : "typical fasting ceiling of 5.4"}.`
    : `Your reading is ${v} mmol/L: inside the typical ${ctx === "post" ? "after-meal" : "fasting"} range, with ${Math.abs(d)} to spare.`;
  const same = (history || []).filter((r) => r.type === "glucose" && (r.ctx || "fasting") === (ctx || "fasting"));
  const wk = same.slice(0, 7), prior = same.slice(7, 14);
  const avg = (a) => a.length ? Math.round((a.reduce((x, y) => x + y.v, 0) / a.length) * 10) / 10 : null;
  if (wk.length >= 3) {
    const a1 = avg(wk), a0 = avg(prior);
    out.trend = a0
      ? `Your last ${wk.length} ${ctx === "post" ? "after-meal" : "morning"} readings average ${a1}, ${a1 < a0 ? "down from" : a1 > a0 ? "up from" : "level with"} ${a0} the week before` + (a1 < a0 ? ": the direction is winning." : a1 > a0 ? ": worth watching, kindly." : ".")
      : `Your last ${wk.length} readings of this kind average ${a1}.`;
  }
  return out;
}

export function interpretGlucose(vMmol, ctx) {
  const v = vMmol;
  const out = { actions: [], source: "RACGP and Diabetes Australia general ranges; ADA classification thresholds" };
  if (v < 3) {
    out.band = "Very low";
    out.urgent = true;
    out.plain = "Below 3 mmol/L is genuinely low blood glucose. If you feel shaky, sweaty, confused or faint, treat it now.";
    out.actions = ["Take fast sugar now: juice, jellybeans, honey, then something more solid.", "If you take insulin or glucose-lowering tablets, this needs your doctor promptly: medication doses may need review.", "If confusion or fainting is near, this is an emergency, not a wait-and-see."];
  } else if (v < 4) {
    out.band = "Low";
    out.plain = "Under 4 mmol/L sits below the usual range. Occasional dips happen, especially when fasting; repeated ones are information your doctor should have.";
    out.actions = ["Eat something balanced soon.", "If you fast, shorten the window for now.", "Note it with context (fasting? after exercise?) so the pattern is visible."];
  } else if (ctx === "post") {
    if (v < 7.8) { out.band = "Typical after a meal"; out.plain = "Under 7.8 mmol/L an hour or two after eating is where healthy metabolism usually lands. This meal and your body got along."; out.actions = ["Nothing to fix. Notice what the meal was; it earns repeating."]; }
    else if (v < 11.1) { out.band = "Higher than typical after a meal"; out.plain = "Between 7.8 and 11 mmol/L after a meal is above the typical response. One reading means little; a pattern of these is worth your GP's eyes, and it is also the range where food order genuinely helps.";
      out.why = ["A rise this size usually tells you about the meal more than about you: refined carbs first or alone, a big portion, a sweet drink, or eating fast.", "The same meal spikes higher on short sleep, high stress, or when you sit still straight afterwards."];
      out.avoid = ["Naked carbs: bread, rice or fruit alone hit hardest; dressed with protein, fat or fibre they land softer.", "The couch straight after eating: the first twenty minutes decide the curve.", "Guilt: this is mechanics, not morality."];
      out.actions = ["Vegetables first, carbs last, at the next similar meal.", "A ten-minute walk after eating reliably softens this curve.", "If most post-meal readings land here, book the GP conversation rather than wondering."]; }
    else { out.band = "High after a meal"; out.plain = "Over 11 mmol/L after eating is the threshold laboratories treat as diagnostic territory for diabetes when confirmed properly. A finger-prick or sensor is not a diagnosis, but this number has earned a real lab test.";
      out.why = ["Sensors over-read during rapid rises and compression; a single high can be artefact.", "If it repeats across meals, the body is struggling to clear glucose: insulin is either short or unheard, and only a lab can say which."];
      out.avoid = ["Self-diagnosing or crash-dieting off one reading.", "Delaying the GP visit out of fear: this number is at its most fixable early."];
      out.actions = ["Do not panic and do not self-diagnose: sensors can read high.", "Book a GP visit and ask for fasting glucose and HbA1c.", "Until then, the gentle levers: whole foods, carbs dressed with fibre and protein, movement after meals."]; }
  } else { // fasting or unspecified
    if (v <= 5.4) { out.band = "Typical fasting range"; out.plain = "Between 4 and 5.4 mmol/L fasting is the healthy resting range. Your overnight metabolism is doing its quiet job."; out.actions = ["Nothing to fix. Keep the pattern that produced it."]; }
    else if (v < 7) { out.band = "Above typical fasting"; out.plain = "Fasting readings between 5.5 and 6.9 mmol/L sit in what guidelines call impaired fasting glucose territory: not diabetes, but the early stretch of the road that can lead there, and the stretch where lifestyle changes work best.";
      out.why = ["Morning glucose has more suspects than food alone: the dawn hormone surge (cortisol wakes glucose with you), a late or carb-heavy dinner the night before, a short or broken night's sleep, a stressful season, some medications, or simply the liver being generous.", "One high morning after a bad night means little; a month of them is a pattern with a cause worth finding."];
      out.avoid = ["Avoid sugary or white-carb breakfasts on these mornings: they stack a spike on an already-raised base.", "Avoid reacting to single readings; react to weekly averages.", "Avoid late heavy dinners and alcohol in the evening while you watch this: both push the next morning up."];
      out.actions = ["This range responds well: fibre at breakfast, the after-dinner walk, earlier dinners, strength work twice a week.", "Repeated readings here deserve an HbA1c at your next GP visit; say the numbers out loud there.", "Sleep is a quiet lever: short nights raise morning glucose."]; }
    else { out.band = "High fasting"; out.plain = "Fasting at 7 mmol/L or more is the level laboratories use as diagnostic territory for diabetes when confirmed on proper testing. One home reading is not a verdict; it is a clear instruction to get the real test."; out.actions = ["Book the GP and ask for a formal fasting glucose and HbA1c.", "Bring your Harta readings; the pattern helps the doctor more than one number.", "Keep eating whole and moving daily meanwhile; none of that waits for results."]; }
    if (v >= 15) { out.urgent = true; out.band = "Very high"; out.plain = "Fifteen mmol/L or more, especially with thirst, tiredness or nausea, needs a doctor today rather than a diary entry."; out.actions = ["Contact your GP today, or urgent care if you feel unwell.", "If you also measure blood ketones above 1.5 while this high, that combination needs urgent medical attention."]; }
  }
  return out;
}

export function personalKetone(v, history) {
  const out = {};
  if (v < 0.5) out.headline = `Your reading is ${v} mmol/L: ${Math.round((0.5 - v) * 10) / 10} below the ketosis threshold of 0.5.`;
  else if (v < 1.5) out.headline = `Your reading is ${v} mmol/L: inside light nutritional ketosis (0.5 to 1.5).`;
  else if (v <= 3) out.headline = `Your reading is ${v} mmol/L: in the deeper range (1.5 to 3).`;
  else out.headline = `Your reading is ${v} mmol/L: ${Math.round((v - 3) * 10) / 10} above the 3.0 line where attention is due.`;
  const same = (history || []).filter((r) => r.type === "ketone");
  const wk = same.slice(0, 7), prior = same.slice(7, 14);
  const avg = (a) => a.length ? Math.round((a.reduce((x, y) => x + y.v, 0) / a.length) * 100) / 100 : null;
  if (wk.length >= 3) {
    const a1 = avg(wk), a0 = avg(prior);
    out.trend = a0
      ? `Your last ${wk.length} readings average ${a1}, ${a1 > a0 ? "up from" : a1 < a0 ? "down from" : "level with"} ${a0} before` + (a1 > a0 ? ": ketosis is deepening." : a1 < a0 ? ": the door is easing shut; check the quiet carbs." : ".")
      : `Your last ${wk.length} readings average ${a1}.`;
  }
  return out;
}

export function interpretKetone(vMmol, hasDiabetes) {
  const v = vMmol;
  const out = { actions: [], source: "Nutritional-ketosis ranges (Volek and Phinney); DKA thresholds from diabetes guidance" };
  if (v < 0.5) { out.band = "Not in ketosis"; out.plain = "Below 0.5 mmol/L the body is running mostly on glucose. If ketosis is your aim, the door is not open yet; if it is not your aim, this is simply normal.";
    out.why = ["The usual suspects when keto eating still reads low: quiet carbs (sauces, milk in coffees, fruit portions), a recent meal (ketones dip after eating), or simply the first days of adaptation.", "Hard exercise the day before can temporarily lower a morning reading too."];
    out.avoid = ["Cutting deeper on the strength of one reading.", "Urine strips as the referee after the first weeks: they fade as the body starts using ketones rather than spilling them."];
    out.actions = ["If you are chasing ketosis: it usually takes two to four consistent days under about 20 to 50 g carbs.", "Measure at a consistent hour, mornings before food tell the truest story.", "If you are not chasing it: nothing to do."]; }
  else if (v < 1.5) { out.band = "Light nutritional ketosis"; out.plain = "Between 0.5 and 1.5 mmol/L is light nutritional ketosis: the range most keto eaters live in, day to day.";
    out.why = ["This is what steady low-carb eating produces once the body has switched fuel lines; the number breathes with meals, sleep and exercise, which is normal."];
    out.avoid = ["Chasing higher numbers for their own sake: depth has no proven bonus for everyday goals, and the chase invites needless restriction."];
    out.actions = ["This is the working range; consistency matters more than depth.", "Salt, water and vegetables keep this range comfortable."]; }
  else if (v <= 3) { out.band = "Deeper nutritional ketosis"; out.plain = "Between 1.5 and 3 mmol/L is the deeper range often targeted in therapeutic contexts. Fine when it is intentional, fed and supervised."; out.actions = ["If this depth is intentional, keep your care team in the loop.", "Hydration and electrolytes matter more down here."]; }
  else { out.band = "High"; out.urgent = true; out.plain = "Above 3 mmol/L deserves attention. In people with diabetes, high ketones with high glucose can signal ketoacidosis, which is an emergency. In prolonged fasting without diabetes it can still mean the body is under real strain.";
    out.why = ["Ketones climb this high when the body has had almost no carbohydrate or insulin signal for a long stretch: deep fasting, illness with poor eating, or insulin deficiency.", "Dehydration concentrates the reading further."];
    out.avoid = ["Pushing the fast on. Whatever the goal was, this number has met it.", "Ignoring thirst, nausea or deep sighing breaths: those symptoms plus this number are an emergency, not a data point."];
    out.actions = ["If you have diabetes, or feel sick, breathless or foggy: urgent medical care now.", "If you are deep-fasting: this is the moment to break the fast gently and reassess with a professional."]; }
  return out;
}

export function interpretGKI(gki) {
  const out = { actions: [], source: "Meidenbauer et al., Nutrition and Metabolism (2015)" };
  if (gki >= 9) { out.band = "Low ketosis"; out.plain = "A GKI of nine or more means glucose still dominates the fuel mix."; }
  else if (gki >= 6) { out.band = "Mild ketosis"; out.plain = "Between six and nine the balance is beginning to shift toward fat and ketones."; }
  else if (gki >= 3) { out.band = "Moderate ketosis"; out.plain = "Between three and six is a solid metabolic shift, the range steady keto eaters see."; }
  else { out.band = "Deep ketosis"; out.plain = "Under three is the deep zone discussed in research on therapeutic ketosis. Deliberate territory: it belongs alongside a professional, not instead of one."; }
  out.actions = ["The GKI is a trend tool from research, not a target with proven outcomes outside epilepsy work. Watch its direction week to week rather than chasing a number."];
  return out;
}

// Labs: general adult reference ranges, plainly told. The lab report's own range wins.
export const LAB_GUIDE = {
  "HbA1c": {
    unit: "%", bands: [[0, 5.7, "Typical"], [5.7, 6.5, "Prediabetes range"], [6.5, 99, "Diabetes range"]],
    plain: "HbA1c is your average glucose over about three months, written into your red blood cells. It cannot be flattered by one good week, which is why doctors trust it.",
    low: "Below range is uncommon and usually fine; very low with symptoms is a doctor question.",
    high: "The prediabetes range is the most reversible station on the line: fibre, movement after meals, strength work and sleep all move this number in three-month steps.",
    source: "ADA classification; RACGP guidelines",
  },
  "Fasting glucose": { unit: "mmol/L", bands: [[0, 4, "Low"], [4, 5.5, "Typical"], [5.5, 7, "Impaired fasting range"], [7, 99, "Diabetes range"]],
    plain: "Glucose after an overnight fast shows your baseline, before food has its say.",
    low: "Under 4 repeatedly deserves a conversation, especially alongside medication.",
    high: "Between 5.5 and 7 is the early, most changeable stretch. Seven or more on a proper lab test is diagnostic territory: your doctor takes it from there.",
    source: "RACGP; Diabetes Australia" },
  "LDL": { unit: "mmol/L", bands: [[0, 2.0, "At general target"], [2.0, 3.5, "Above general target"], [3.5, 99, "High"]],
    plain: "LDL carries cholesterol toward the arteries; lower is generally better, and your personal target depends on your overall risk, which only your doctor can set.",
    low: "Low LDL is rarely a problem in itself.",
    high: "The food levers with real evidence: soluble fibre (oats, legumes, psyllium), nuts, olive oil in place of butter, less processed meat. Statin questions belong to the GP; take your numbers with you.",
    source: "Heart Foundation (Australia) general guidance" },
  "HDL": { unit: "mmol/L", bands: [[0, 1.0, "Low"], [1.0, 99, "Typical or better"]],
    plain: "HDL is the return-transport for cholesterol; higher generally reads as protective.",
    low: "Movement is the honest lever: regular exercise raises HDL more reliably than any food.",
    high: "Generally good news.", source: "Heart Foundation (Australia)" },
  "Triglycerides": { unit: "mmol/L", bands: [[0, 1.7, "Typical"], [1.7, 99, "Raised"]],
    plain: "Triglycerides are blood fats that rise with sugar, alcohol and refined carbs more than with eaten fat.",
    low: "Not usually meaningful.",
    high: "The levers are specific: less added sugar and alcohol, fewer refined carbs, more oily fish. This number often falls fast when those change.",
    source: "Heart Foundation (Australia)" },
  "CRP": { unit: "mg/L", bands: [[0, 3, "Low"], [3, 10, "Raised"], [10, 999, "High"]],
    plain: "CRP is a general inflammation signal: it says something is inflamed, never what.",
    low: "Quiet, as hoped.",
    high: "A cold, a sore tooth or training can raise it; persistent elevation without a reason is a doctor conversation, not a supplement plan.",
    source: "General pathology reference ranges" },
  "Vitamin D": { unit: "nmol/L", bands: [[0, 30, "Deficient"], [30, 50, "Insufficient"], [50, 999, "Sufficient"]],
    plain: "Vitamin D serves bones, muscles and immunity; in Australia the sun does most of the honest work.",
    low: "Deficiency is common and fixable: sensible sun and, if your doctor agrees, supplementation at a dose they set.",
    high: "Sufficiency is the goal; megadoses have no proven bonus.",
    source: "RACGP position on vitamin D" },
  "Ferritin": { unit: "µg/L", bands: [[0, 30, "Low"], [30, 200, "Typical"], [200, 9999, "Raised"]],
    plain: "Ferritin is the body's iron pantry. Low explains tiredness surprisingly often, especially in women.",
    low: "Low ferritin with low energy is worth treating properly: cause first (ask why it is low), then iron under guidance.",
    high: "Raised ferritin can be inflammation rather than iron; interpretation genuinely needs the doctor.",
    source: "General pathology reference ranges" },
  "TSH": { unit: "mIU/L", bands: [[0, 0.4, "Low"], [0.4, 4.0, "Typical"], [4.0, 999, "Raised"]],
    plain: "TSH is the pituitary's thermostat signal to the thyroid: high TSH usually means the thyroid is running slow, low means fast.",
    low: "Worth a doctor's interpretation alongside symptoms.",
    high: "A slightly raised TSH with tiredness or cold intolerance is a common, treatable finding; the GP will usually re-test and add thyroid hormone levels.",
    source: "General endocrine reference ranges" },
};

export function interpretLab(name, value) {
  const g = LAB_GUIDE[name];
  if (!g) return null;
  const band = g.bands.find(([lo, hi]) => value >= lo && value < hi);
  const label = band ? band[2] : "Outside listed ranges";
  const isHigh = band && band === g.bands[g.bands.length - 1];
  const isLow = band && band === g.bands[0] && g.bands.length > 2;
  return {
    band: label,
    plain: g.plain,
    actions: [isHigh ? g.high : isLow ? g.low : "Inside the general range: nothing here asks for action.",
      "Your own lab report's reference range outranks these general ones; if they disagree, the report wins.",
      "Treatment decisions stay with your doctor; take the trend, not just today's number."],
    source: g.source,
  };
}
