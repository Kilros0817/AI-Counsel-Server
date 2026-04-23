import { DimensionKey, Language } from "./types";

export interface DimensionDef {
  key: DimensionKey;
  name: Record<Language, string>;
  focus: Record<Language, string>;
  starterQuestions: Record<Language, string[]>;
  probeQuestions: Record<Language, string[]>;
  maxTurns: number;
}

export const DIMENSIONS: DimensionDef[] = [
  {
    key: "D1",
    name: { en: "Success", ru: "Успех", tr: "Başarı" },
    focus: {
      en: "What does success look like for this person at work — moments of pride, achievement, results they own.",
      ru: "Что для человека означает успех на работе — моменты гордости, достижения, результаты.",
      tr: "Bu kişi için işte başarı nasıl görünür — gurur anları, başarılar, sahip oldukları sonuçlar.",
    },
    starterQuestions: {
      en: [
        "Tell me about a moment at work recently when you felt like things really came together.",
        "What's something you've done at work that you're genuinely proud of?",
      ],
      ru: [
        "Расскажи о моменте на работе, когда всё сложилось как надо.",
        "Что ты сделал на работе, чем по-настоящему гордишься?",
      ],
      tr: [
        "İşte her şeyin yerine oturduğunu hissettiğin son bir anı anlat.",
        "İşte gerçekten gurur duyduğun bir şey nedir?",
      ],
    },
    probeQuestions: {
      en: [
        "What made that feel like a win for you specifically?",
        "Who else was involved, and what was your part in it?",
        "How did you know it went well?",
      ],
      ru: [
        "Что именно сделало это победой лично для тебя?",
        "Кто ещё был вовлечён, и какова была твоя роль?",
        "Как ты понял, что всё прошло хорошо?",
      ],
      tr: [
        "Bu senin için neden bir kazanım gibi hissettirdi?",
        "Başka kimler vardı ve senin rolün neydi?",
        "İşlerin iyi gittiğini nasıl anladın?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D2",
    name: { en: "Security/Value", ru: "Безопасность/Ценность", tr: "Güvenlik/Değer" },
    focus: {
      en: "Whether the person feels stable, valued, and fairly treated — pay, recognition, job security.",
      ru: "Чувствует ли человек стабильность, ценность и справедливое отношение — зарплата, признание, стабильность.",
      tr: "Kişinin kendini güvende, değerli ve adil muamele görüyor hissedip hissetmediği.",
    },
    starterQuestions: {
      en: [
        "How settled do you feel in your role right now — like, do you feel your position is solid?",
        "Do you feel the work you put in is fairly recognized — not just in words, but in practice?",
      ],
      ru: [
        "Насколько ты чувствуешь себя устойчиво в своей роли прямо сейчас?",
        "Ощущаешь ли ты, что твой вклад справедливо признаётся — не на словах, а на деле?",
      ],
      tr: [
        "Şu an rolünde ne kadar yerleşik hissediyorsun — pozisyonun sağlam mı?",
        "Koyduğun emeğin adil bir şekilde tanındığını hissediyor musun?",
      ],
    },
    probeQuestions: {
      en: [
        "What gives you that sense of stability — or what's shaking it?",
        "Can you give me a concrete example of when you felt valued or not?",
      ],
      ru: [
        "Что даёт тебе это ощущение стабильности — или что его подрывает?",
        "Можешь привести конкретный пример, когда ты чувствовал себя ценным или нет?",
      ],
      tr: [
        "Bu istikrar hissini sana ne veriyor — ya da onu ne sarsıyor?",
        "Kendini değerli ya da değersiz hissettiğin somut bir örnek verebilir misin?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D3",
    name: { en: "Relationships", ru: "Отношения", tr: "İlişkiler" },
    focus: {
      en: "Quality of working relationships — team, manager, trust, conflict, support.",
      ru: "Качество рабочих отношений — команда, руководитель, доверие, конфликты, поддержка.",
      tr: "Çalışma ilişkilerinin kalitesi — ekip, yönetici, güven, çatışma, destek.",
    },
    starterQuestions: {
      en: [
        "How would you describe the dynamic with the people you work with most closely?",
        "Is there someone at work you can count on when things get tough?",
      ],
      ru: [
        "Как бы ты описал динамику с людьми, с которыми работаешь ближе всего?",
        "Есть ли на работе кто-то, на кого ты можешь рассчитывать в трудный момент?",
      ],
      tr: [
        "En yakın çalıştığın kişilerle olan dinamiği nasıl tanımlarsın?",
        "İşte zor anlarda güvenebileceğin biri var mı?",
      ],
    },
    probeQuestions: {
      en: [
        "What does that relationship actually look like day to day?",
        "Has there been a moment recently where that trust was tested?",
      ],
      ru: [
        "Как эти отношения выглядят в повседневной жизни?",
        "Был ли недавно момент, когда это доверие проверялось?",
      ],
      tr: [
        "Bu ilişki günlük hayatta nasıl görünüyor?",
        "Son zamanlarda bu güvenin sınandığı bir an oldu mu?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D4",
    name: { en: "Autonomy", ru: "Автономия", tr: "Özerklik" },
    focus: {
      en: "How much control the person has over their work — decisions, methods, schedule.",
      ru: "Насколько человек контролирует свою работу — решения, методы, расписание.",
      tr: "Kişinin işi üzerinde ne kadar kontrolü olduğu — kararlar, yöntemler, program.",
    },
    starterQuestions: {
      en: [
        "How much say do you have in how you actually do your work — the approach, the pace?",
        "Are there decisions you wish you could make yourself but can't?",
      ],
      ru: [
        "Насколько ты сам определяешь, как делать свою работу — подход, темп?",
        "Есть ли решения, которые ты хотел бы принимать сам, но не можешь?",
      ],
      tr: [
        "İşini nasıl yapacağın konusunda — yaklaşım, tempo — ne kadar söz hakkın var?",
        "Kendin vermek isteyip de veremediğin kararlar var mı?",
      ],
    },
    probeQuestions: {
      en: [
        "Give me an example of a time you had real ownership over something.",
        "What happens when you push back or suggest a different way?",
      ],
      ru: [
        "Приведи пример, когда у тебя было реальное владение чем-то.",
        "Что происходит, когда ты возражаешь или предлагаешь другой подход?",
      ],
      tr: [
        "Bir şeyin gerçek sahibi olduğun bir örnek ver.",
        "Karşı çıktığında ya da farklı bir yol önerdiğinde ne oluyor?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D5",
    name: { en: "Engagement", ru: "Вовлечённость", tr: "Bağlılık" },
    focus: {
      en: "Energy, motivation, flow — whether work feels meaningful or draining day to day.",
      ru: "Энергия, мотивация, поток — ощущает ли человек смысл или опустошение в повседневной работе.",
      tr: "Enerji, motivasyon, akış — işin günlük olarak anlamlı mı yoksa yorucu mu hissettirdiği.",
    },
    starterQuestions: {
      en: [
        "On a typical week, when do you feel most switched on at work?",
        "Is there a part of your job that genuinely pulls you in — where time just goes?",
      ],
      ru: [
        "В типичную неделю, когда ты чувствуешь себя наиболее включённым на работе?",
        "Есть ли часть работы, которая по-настоящему захватывает тебя — где время летит?",
      ],
      tr: [
        "Tipik bir haftada işte en çok ne zaman kendini enerjik hissediyorsun?",
        "İşinin seni gerçekten içine çeken, zamanın nasıl geçtiğini anlamadığın bir parçası var mı?",
      ],
    },
    probeQuestions: {
      en: [
        "What's the opposite — what drains you most?",
        "How often does that energizing feeling actually happen?",
      ],
      ru: [
        "А что наоборот — что больше всего тебя истощает?",
        "Как часто это ощущение энергии на самом деле случается?",
      ],
      tr: [
        "Bunun tersi nedir — seni en çok ne tüketiyor?",
        "Bu enerji verici his ne sıklıkla gerçekten oluyor?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D6",
    name: { en: "Recognition/Feedback", ru: "Признание/Обратная связь", tr: "Tanınma/Geri Bildirim" },
    focus: {
      en: "Whether the person gets useful feedback and feels their work is seen and acknowledged.",
      ru: "Получает ли человек полезную обратную связь и чувствует ли, что его работу замечают.",
      tr: "Kişinin yararlı geri bildirim alıp almadığı ve çalışmasının görülüp takdir edilip edilmediği.",
    },
    starterQuestions: {
      en: [
        "When was the last time someone gave you feedback that actually helped you?",
        "Do you feel like the people above you really see what you contribute?",
      ],
      ru: [
        "Когда последний раз кто-то давал тебе обратную связь, которая реально помогла?",
        "Чувствуешь ли ты, что люди выше тебя действительно видят твой вклад?",
      ],
      tr: [
        "En son ne zaman sana gerçekten yardımcı olan bir geri bildirim aldın?",
        "Üstlerinin katkılarını gerçekten görüp görmediğini hissediyor musun?",
      ],
    },
    probeQuestions: {
      en: [
        "What made that feedback land well — or not?",
        "What kind of recognition actually matters to you?",
      ],
      ru: [
        "Что сделало эту обратную связь полезной — или нет?",
        "Какое признание на самом деле важно для тебя?",
      ],
      tr: [
        "Bu geri bildirimi iyi ya da kötü yapan neydi?",
        "Sana gerçekten önemli gelen tanınma türü nedir?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D7",
    name: { en: "Learning", ru: "Обучение", tr: "Öğrenme" },
    focus: {
      en: "Growth, skill development, whether the person feels they're moving forward or stagnating.",
      ru: "Рост, развитие навыков — чувствует ли человек движение вперёд или застой.",
      tr: "Büyüme, beceri geliştirme — kişinin ilerlediğini mi yoksa durağanlaştığını mı hissettirdiği.",
    },
    starterQuestions: {
      en: [
        "Have you learned something genuinely new at work in the last few months?",
        "Do you feel like you're growing in this role, or more like treading water?",
      ],
      ru: [
        "Ты узнал что-то по-настоящему новое на работе за последние несколько месяцев?",
        "Чувствуешь ли ты, что растёшь в этой роли, или скорее топчешься на месте?",
      ],
      tr: [
        "Son birkaç ayda işte gerçekten yeni bir şey öğrendin mi?",
        "Bu rolde büyüdüğünü mü hissediyorsun, yoksa yerinde mi sayıyorsun?",
      ],
    },
    probeQuestions: {
      en: [
        "What's been the biggest thing you've picked up recently?",
        "Is there something you want to learn that you're not getting the chance to?",
      ],
      ru: [
        "Что самое значимое ты усвоил в последнее время?",
        "Есть ли что-то, чему ты хочешь научиться, но не получаешь такой возможности?",
      ],
      tr: [
        "Son zamanlarda öğrendiğin en büyük şey neydi?",
        "Öğrenmek isteyip de fırsatını bulamadığın bir şey var mı?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D8",
    name: { en: "Purpose", ru: "Смысл", tr: "Amaç" },
    focus: {
      en: "Whether the work feels meaningful — connection to something bigger, personal values alignment.",
      ru: "Ощущает ли человек смысл в работе — связь с чем-то большим, соответствие личным ценностям.",
      tr: "İşin anlamlı hissettirip hissettirmediği — daha büyük bir şeyle bağlantı, kişisel değerlerle uyum.",
    },
    starterQuestions: {
      en: [
        "Does what you do at work feel like it matters — beyond just getting tasks done?",
        "Is there a part of your work that connects to something you actually care about?",
      ],
      ru: [
        "Ощущаешь ли ты, что твоя работа имеет значение — не просто выполнение задач?",
        "Есть ли часть работы, которая связана с чем-то, что тебе действительно важно?",
      ],
      tr: [
        "Yaptığın işin önemli olduğunu hissediyor musun — sadece görevleri tamamlamanın ötesinde?",
        "İşinin gerçekten önem verdiğin bir şeyle bağlantılı bir parçası var mı?",
      ],
    },
    probeQuestions: {
      en: [
        "What specifically makes it feel meaningful — or hollow?",
        "Has that sense of purpose changed since you started here?",
      ],
      ru: [
        "Что конкретно делает это значимым — или пустым?",
        "Изменилось ли это ощущение смысла с тех пор, как ты здесь начал?",
      ],
      tr: [
        "Bunu anlamlı — ya da boş — hissettiren şey tam olarak nedir?",
        "Bu amaç duygusu buraya başladığından beri değişti mi?",
      ],
    },
    maxTurns: 3,
  },
  {
    key: "D9",
    name: { en: "Obstacles", ru: "Препятствия", tr: "Engeller" },
    focus: {
      en: "What gets in the way — workload, processes, people, tools, bureaucracy, stress.",
      ru: "Что мешает — нагрузка, процессы, люди, инструменты, бюрократия, стресс.",
      tr: "Önüne ne çıkıyor — iş yükü, süreçler, insanlar, araçlar, bürokratik engeller, stres.",
    },
    starterQuestions: {
      en: [
        "What's the biggest thing that gets in the way of you doing your best work?",
        "Is there something that consistently slows you down or frustrates you?",
      ],
      ru: [
        "Что больше всего мешает тебе делать работу на высшем уровне?",
        "Есть ли что-то, что постоянно тормозит тебя или раздражает?",
      ],
      tr: [
        "En iyi işini yapmanın önüne geçen en büyük şey nedir?",
        "Seni sürekli yavaşlatan ya da sinir eden bir şey var mı?",
      ],
    },
    probeQuestions: {
      en: [
        "How long has that been an issue?",
        "Have you tried to fix it — what happened?",
        "How much does it actually affect your day?",
      ],
      ru: [
        "Как давно это является проблемой?",
        "Ты пытался это исправить — что произошло?",
        "Насколько это реально влияет на твой день?",
      ],
      tr: [
        "Bu ne zamandır bir sorun?",
        "Bunu düzeltmeye çalıştın mı — ne oldu?",
        "Bu günlük hayatını ne kadar etkiliyor?",
      ],
    },
    maxTurns: 4,
  },
  {
    key: "D10",
    name: { en: "Voice", ru: "Голос", tr: "Ses" },
    focus: {
      en: "Whether the person feels heard — can they speak up, does it change anything, psychological safety.",
      ru: "Чувствует ли человек, что его слышат — может ли он высказаться, меняет ли это что-то.",
      tr: "Kişinin duyulduğunu hissedip hissetmediği — sesini yükseltebiliyor mu, bir şeyi değiştiriyor mu.",
    },
    starterQuestions: {
      en: [
        "When you have an idea or a concern at work, do you feel like you can actually say it?",
        "Has there been a time you spoke up about something — what happened?",
      ],
      ru: [
        "Когда у тебя есть идея или беспокойство на работе, чувствуешь ли ты, что можешь это сказать?",
        "Был ли момент, когда ты высказался о чём-то — что произошло?",
      ],
      tr: [
        "İşte bir fikrin ya da endişen olduğunda, bunu gerçekten söyleyebildiğini hissediyor musun?",
        "Bir konuda sesini yükselttiğin bir an oldu mu — ne oldu?",
      ],
    },
    probeQuestions: {
      en: [
        "What makes it feel safe — or not — to speak up here?",
        "Did anything actually change because of what you said?",
      ],
      ru: [
        "Что делает высказывание безопасным — или нет — здесь?",
        "Что-то реально изменилось из-за того, что ты сказал?",
      ],
      tr: [
        "Burada sesini yükseltmeyi güvenli — ya da güvensiz — hissettiren nedir?",
        "Söylediklerin yüzünden gerçekten bir şey değişti mi?",
      ],
    },
    maxTurns: 3,
  },
];

export const DIMENSION_ORDER: DimensionKey[] = DIMENSIONS.map((d) => d.key);

export function getDimension(key: DimensionKey): DimensionDef {
  return DIMENSIONS.find((d) => d.key === key)!;
}
