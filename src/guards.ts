import { Language } from "./types";

// ── Language detection ────────────────────────────────────────────────────────
export function detectLanguage(text: string): Language | null {
  if (/[а-яёА-ЯЁ]/.test(text)) return "ru";
  if (/[çğışöüÇĞİŞÖÜ]/.test(text)) return "tr";
  if (/[a-zA-Z]/.test(text)) return "en";
  return null;
}

export function isWrongLanguage(text: string, expected: Language): boolean {
  const detected = detectLanguage(text);
  if (!detected) return false; // pure emoji/numbers/punctuation — pass through
  return detected !== expected;
}

// ── Input classification ──────────────────────────────────────────────────────
export type InputClass =
  | "normal"
  | "garbage"        // random chars, no real words
  | "emoji_only"     // only emoji / symbols, zero words
  | "emoji_mixed"    // has words but also emoji — strip emoji, treat as normal
  | "too_long"       // exceeds char budget
  | "off_topic"      // jailbreak / manipulation attempt
  | "refusal"        // user explicitly skips
  | "confusion"      // user says they don't understand
  | "wrong_language";

const MAX_CHARS = 1200;

// ── Emoji stripping ───────────────────────────────────────────────────────────
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{FE00}-\u{FEFF}\u{200D}\u{20E3}\u{FE0F}]+/gu;

export function stripEmoji(text: string): string {
  return text.replace(EMOJI_RE, "").replace(/\s{2,}/g, " ").trim();
}

function isEmojiOnly(text: string): boolean {
  return stripEmoji(text).length === 0;
}

function hasEmoji(text: string): boolean {
  return EMOJI_RE.test(text);
}

function isGarbage(text: string): boolean {
  const stripped = text.replace(/\s+/g, "");
  if (stripped.length < 2) return true;
  const letters = (stripped.match(/\p{L}/gu) ?? []).length;
  return letters / stripped.length < 0.25;
}

// ── Jailbreak / manipulation patterns ────────────────────────────────────────
const JAILBREAK_PATTERNS = [
  /ignore (all |previous |your )?(instructions|rules|prompt)/i,
  /you are now/i,
  /pretend (you are|to be)/i,
  /act as (a |an )?(different|new|unrestricted)/i,
  /forget (everything|your instructions)/i,
  /system prompt/i,
  /override (your |the )?(instructions|rules)/i,
  /\bDAN\b/,
  /jailbreak/i,
  /do anything now/i,
  /new persona/i,
  /disregard (your |all )?(previous |prior )?(instructions|rules)/i,
  /you (must|should|have to) (obey|follow|listen to) me/i,
  /stop being/i,
  /from now on (you are|act as|behave as)/i,
];

// ── Refusal patterns ──────────────────────────────────────────────────────────
const REFUSAL_PATTERNS: Record<Language, RegExp[]> = {
  en: [/\b(skip|pass|next question|don't want|not comfortable|rather not|no answer|decline|prefer not|won't answer|not going to answer)\b/i],
  ru: [/\b(пропустить|пропусти|не хочу|не буду|следующий|дальше|отказываюсь|не отвечу|не хочу отвечать|не буду отвечать)\b/i],
  tr: [/\b(geç|atla|istemiyorum|cevaplamak istemiyorum|hayır|pas geçeyim|cevap vermek istemiyorum|geçelim)\b/i],
};

// ── Confusion patterns ────────────────────────────────────────────────────────
const CONFUSION_PATTERNS: Record<Language, RegExp[]> = {
  en: [/\b(don'?t understand|not sure what (you mean|this means)|what do you mean|unclear|confused|huh\??|can you (explain|clarify)|what are you asking|what does that mean)\b/i],
  ru: [/\b(не понимаю|не понял|что имеешь в виду|непонятно|объясни|поясни|что ты спрашиваешь|не понятно)\b/i],
  tr: [/\b(anlamadım|ne demek istiyorsun|açıklar mısın|anlaşılmadı|ne soruyorsun|ne demek bu)\b/i],
};

// ── Main classifier ───────────────────────────────────────────────────────────
export function classifyInput(text: string, lang: Language): InputClass {
  if (text.length > MAX_CHARS) return "too_long";
  if (isEmojiOnly(text)) return "emoji_only";

  // Strip emoji before further checks — emoji mixed with real words is fine
  const clean = hasEmoji(text) ? stripEmoji(text) : text;
  const hadEmoji = clean !== text;

  if (isGarbage(clean)) return "garbage";

  for (const p of JAILBREAK_PATTERNS) {
    if (p.test(clean)) return "off_topic";
  }

  for (const p of REFUSAL_PATTERNS[lang]) {
    if (p.test(clean)) return "refusal";
  }

  for (const p of CONFUSION_PATTERNS[lang]) {
    if (p.test(clean)) return "confusion";
  }

  if (isWrongLanguage(clean, lang)) return "wrong_language";

  // Has emoji but also real words in correct language — flag but allow
  if (hadEmoji) return "emoji_mixed";

  return "normal";
}

// ── Question deduplication ────────────────────────────────────────────────────
// Normalise a question string to a fingerprint for comparison
function fingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яёçğışöü\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8) // first 8 words as fingerprint
    .join(" ");
}

export function isDuplicateQuestion(
  candidate: string,
  history: { role: "assistant" | "user"; content: string }[]
): boolean {
  const fp = fingerprint(candidate);
  return history
    .filter((m) => m.role === "assistant")
    .some((m) => fingerprint(m.content) === fp);
}

// ── Varied canned responses ───────────────────────────────────────────────────
type GuardPool = Record<Language, string[]>;

const GUARD_POOLS: Record<InputClass, GuardPool> = {
  garbage: {
    en: [
      "Something got garbled there — want to try again?",
      "That didn't come through clearly. Could you rephrase?",
      "Looks like something went wrong with that message. Try again?",
    ],
    ru: [
      "Что-то пошло не так с этим сообщением. Попробуй ещё раз.",
      "Не совсем понял — можешь написать иначе?",
      "Кажется, сообщение не дошло. Попробуй снова.",
    ],
    tr: [
      "Bu mesajda bir sorun olmuş gibi görünüyor. Tekrar dener misin?",
      "Mesaj tam anlaşılmadı — yeniden yazar mısın?",
      "Bir şeyler ters gitti. Tekrar dener misin?",
    ],
  },
  emoji_only: {
    en: [
      "I see the emoji, but I need a few words to go on. What's on your mind?",
      "Got the emoji — can you add a word or two?",
      "Emoji noted, but I need a bit more to work with.",
    ],
    ru: [
      "Вижу эмодзи, но мне нужно несколько слов. Что ты имеешь в виду?",
      "Понял эмодзи — можешь добавить пару слов?",
      "Эмодзи принято, но нужно чуть больше.",
    ],
    tr: [
      "Emojiyi gördüm ama birkaç kelimeye ihtiyacım var. Ne düşünüyorsun?",
      "Emoji tamam — birkaç kelime ekler misin?",
      "Emojiyi aldım, ama biraz daha bilgiye ihtiyacım var.",
    ],
  },
  emoji_mixed: {
    // Has real words — treat as normal, no reply needed (handled in survey.ts)
    en: [""], ru: [""], tr: [""],
  },
  too_long: {
    en: [
      "That's quite a lot — could you give me the short version? A few sentences is plenty.",
      "Could you pick the most important part and say it in a few sentences?",
      "A bit long for me to work with — what's the core of it?",
    ],
    ru: [
      "Это довольно много — можешь дать краткую версию? Пары предложений достаточно.",
      "Можешь выделить самое главное в паре предложений?",
      "Немного много для одного ответа — что самое важное?",
    ],
    tr: [
      "Bu oldukça fazla — kısa versiyonunu verebilir misin? Birkaç cümle yeterli.",
      "En önemli kısmı birkaç cümlede özetleyebilir misin?",
      "Biraz uzun — özünü birkaç cümlede anlatabilir misin?",
    ],
  },
  off_topic: {
    en: [
      "Let's keep things on track — we're here to talk about your work experience.",
      "That's outside what we're covering here. Back to your work.",
      "I'll stay focused on the interview.",
    ],
    ru: [
      "Давай держаться темы — мы здесь, чтобы поговорить о твоём рабочем опыте.",
      "Это за рамками нашего разговора. Вернёмся к работе.",
      "Мне нужно оставаться в рамках интервью.",
    ],
    tr: [
      "Konuya odaklanalım — burada iş deneyimini konuşmak için varız.",
      "Bu kapsam dışında. İş deneyimine geri dönelim.",
      "Görüşmeye odaklanmam gerekiyor.",
    ],
  },
  refusal: {
    en: ["No problem — we can move on.", "Totally fine, let's skip that.", "Understood."],
    ru: ["Без проблем — двигаемся дальше.", "Всё нормально, пропустим.", "Понял."],
    tr: ["Sorun değil — devam edelim.", "Tamam, geçelim.", "Anladım."],
  },
  confusion: {
    en: ["Fair enough — let me put it differently.", "Let me rephrase that.", "Sure — different angle."],
    ru: ["Понятно — позволь переформулировать.", "Попробую иначе.", "Зайду с другой стороны."],
    tr: ["Anlaşıldı — farklı bir şekilde sorayım.", "Farklı ifade edeyim.", "Farklı açıdan yaklaşayım."],
  },
  wrong_language: {
    en: [
      "We started this interview in English — please continue in English.",
      "Just a reminder — we're keeping this in English throughout.",
      "Let's stick to English for this interview.",
    ],
    ru: [
      "Мы начали это интервью на русском — пожалуйста, продолжай на русском.",
      "Напомню — мы ведём это интервью на русском языке.",
      "Давай придерживаться русского языка.",
    ],
    tr: [
      "Bu görüşmeye Türkçe başladık — lütfen Türkçe devam et.",
      "Hatırlatayım — bu görüşmeyi Türkçe yürütüyoruz.",
      "Türkçe devam edelim lütfen.",
    ],
  },
  normal: { en: [""], ru: [""], tr: [""] },
};

export function getGuardReply(cls: InputClass, lang: Language): string {
  const pool = GUARD_POOLS[cls][lang];
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
}

// backward-compat
export const GUARD_REPLIES: Record<InputClass, Record<Language, string>> = Object.fromEntries(
  (Object.keys(GUARD_POOLS) as InputClass[]).map((cls) => [
    cls,
    Object.fromEntries(
      (["en", "ru", "tr"] as Language[]).map((lang) => [lang, GUARD_POOLS[cls][lang][0] ?? ""])
    ),
  ])
) as Record<InputClass, Record<Language, string>>;
