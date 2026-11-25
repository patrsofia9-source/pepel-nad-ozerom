const SAVE_KEY = "ash-over-lake-save-v1";

const initialState = () => ({
  current: "arrival",
  fear: 0,
  inventory: ["карманное радио"],
  clues: [],
  flags: {},
  visited: [],
  ending: null,
});

let state = initialState();
let soundOn = false;
let audioContext = null;
let masterGain = null;

const scenes = {
  arrival: {
    index: "01",
    chapter: "ПРОЛОГ / НУЛЕВОЙ КИЛОМЕТР",
    title: "Знак, которого нет на карте",
    location: "Северный въезд",
    time: "03:17",
    radio: "...ш-ш-ш... Ве... ра... ты меня слышишь?",
    text: [
      "Двигатель глохнет у ржавого указателя. Название города соскоблено, но Вера и без него знает, куда приехала: Серый Берег. Восемь лет назад здесь исчез её младший брат Миша.",
      "За лобовым стеклом туман медленно течёт <em>против ветра</em>. На пассажирском сиденье оживает радио без батареек.",
    ],
    choices: [
      { label: "Осмотреть машину", to: "car" },
      { label: "Идти к свету мотеля", to: "street", effects: { fear: 1 } },
      { label: "Ответить голосу в радио", to: "radioCall" },
    ],
  },
  car: {
    index: "02",
    chapter: "ГЛАВА I / ОСТАВЛЕННЫЕ ВЕЩИ",
    title: "Кто-то сидел сзади",
    location: "Северный въезд",
    time: "03:21",
    radio: "...не забудь фонарь... здесь снова темно...",
    text: [
      "На заднем сиденье лежит школьная фотография, которой минуту назад не было. Вера и Миша стоят у озера. Лицо брата перечёркнуто белой полосой засветки.",
      "Под фотографией — старый фонарь. Его стекло тёплое, словно свет погасили только что. На запотевшем окне изнутри выведено: <em>«208»</em>.",
    ],
    enter: { inventory: ["фонарь", "семейная фотография"], clues: ["фотография у озера"] },
    choices: [
      { label: "Забрать вещи и идти в город", to: "street" },
      { label: "Спросить радио о номере 208", to: "radioCall" },
    ],
  },
  radioCall: {
    index: "03",
    chapter: "ГЛАВА I / ЧАСТОТА 87.6",
    title: "Голос знает твоё имя",
    location: "Северный въезд",
    time: "03:24",
    radio: "Комната... двести восемь... ключ под пеплом...",
    text: [
      "Вера нажимает тангенту. Вместо своего голоса слышит детский кашель. Сквозь помехи брат произносит адрес старого мотеля и шепчет: «Не верь тому, кто носит ключи».",
      "На секунду туман расступается. Посреди дороги стоит мальчик в школьной куртке. Когда Вера моргает, он уже далеко впереди.",
    ],
    enter: { clues: ["голос на частоте 87.6"] },
    choices: [
      { label: "Следовать за силуэтом", to: "street" },
      { label: "Выключить радио", to: "street", effects: { flags: { distrustedRadio: true }, fear: -1 } },
    ],
  },
  street: {
    index: "04",
    chapter: "ГЛАВА II / ГОРОД БЕЗ ЖИТЕЛЕЙ",
    title: "Улицы помнят дорогу",
    location: "Улица Маяков",
    time: "03:38",
    radio: "...три коротких... один длинный... он рядом...",
    text: [
      "Фонари зажигаются по одному, уводя к центру города. Слева краснеет вывеска мотеля «Прибой». Справа за сетчатым забором темнеет школа, в которой Вера видела Мишу в последний раз.",
      "Где-то далеко начинает выть сирена. Под ногами лежит серый пепел, хотя пожара здесь не было уже восемь лет.",
    ],
    choices: [
      { label: "Войти в мотель «Прибой»", to: "motel" },
      { label: "Идти к старой школе", to: "schoolGate" },
      { label: "Осмотреть карту эвакуации", to: "evacuation" },
    ],
  },
  evacuation: {
    index: "05",
    chapter: "ГЛАВА II / ГОРОД БЕЗ ЖИТЕЛЕЙ",
    title: "Маршрут, ведущий внутрь",
    location: "Улица Маяков",
    time: "03:43",
    radio: "...котельная отмечена красным... почему ты ушла?..",
    text: [
      "Под стеклом висит план эвакуации. Все стрелки ведут не из города, а к школьной котельной. Рядом приколота выцветшая ведомость: в ночь пожара один ребёнок остался внутри.",
      "Строка с именем вырвана, но Вера узнаёт собственный детский почерк на полях: <em>«Я вернусь. Жди здесь».</em>",
    ],
    enter: { clues: ["план эвакуации"], fear: 1 },
    choices: [
      { label: "Сорвать план и идти в мотель", to: "motel" },
      { label: "Идти прямо к школе", to: "schoolGate" },
    ],
  },
  motel: {
    index: "06",
    chapter: "ГЛАВА III / КОМНАТА 208",
    title: "Номер для тех, кто вернулся",
    location: "Мотель «Прибой»",
    time: "03:51",
    radio: "...ключ под пепельницей... не буди хозяина...",
    text: [
      "В вестибюле работает телевизор. На каждом канале — камера у входа, и на каждом экране Вера всё ещё стоит снаружи. В журнале постояльцев её подпись повторяется каждую ночь на протяжении восьми лет.",
      "За стойкой висит единственный ключ. На бирке процарапано: <em>«208 / котельная»</em>.",
    ],
    choices: [
      { label: "Подняться в комнату 208", to: "room208" },
      { label: "Изучить журнал постояльцев", to: "guestbook" },
      { label: "Забрать ключ и уйти", to: "schoolGate", effects: { inventory: ["ключ от котельной"] } },
    ],
  },
  guestbook: {
    index: "07",
    chapter: "ГЛАВА III / ЗАПИСЬ БЕЗ ДАТЫ",
    title: "Восемь лет одной ночи",
    location: "Мотель «Прибой»",
    time: "03:57",
    radio: "...ты каждый раз выбираешь дверь... выбери правду...",
    text: [
      "Последние страницы исписаны одной фразой: «Я не слышала, как он звал». Почерк принадлежит Вере. Чернила на последней строке ещё не высохли.",
      "Из коридора на втором этаже доносится щелчок кассетного магнитофона.",
    ],
    enter: { clues: ["журнал повторений"], fear: 1 },
    choices: [
      { label: "Идти на звук магнитофона", to: "room208" },
      { label: "Забрать ключ и покинуть мотель", to: "schoolGate", effects: { inventory: ["ключ от котельной"] } },
    ],
  },
  room208: {
    index: "08",
    chapter: "ГЛАВА III / КОМНАТА 208",
    title: "Запись обрывается на крике",
    location: "Комната 208",
    time: "04:06",
    radio: "...не перематывай... ты уже знаешь конец...",
    text: [
      "В пустой комнате стоит магнитофон. На кассете детской рукой написано: «Для Веры». Запись начинается смехом у озера, а заканчивается грохотом железной двери.",
      "Собственный голос Веры говорит: «Сиди здесь, Миша. Я приведу помощь». Затем мальчик долго зовёт её из-за двери. Она не отвечает.",
    ],
    enter: { inventory: ["ключ от котельной", "кассета Миши"], clues: ["кассета из комнаты 208"], fear: 1 },
    choices: [
      { label: "Дослушать кассету до конца", to: "schoolGate", effects: { flags: { heardTape: true } } },
      { label: "Остановить запись и уйти", to: "schoolGate", effects: { flags: { deniedTape: true }, fear: 1 } },
    ],
  },
  schoolGate: {
    index: "09",
    chapter: "ГЛАВА IV / ПОСЛЕДНИЙ УРОК",
    title: "Школа всё ещё открыта",
    location: "Школа № 4",
    time: "04:19",
    radio: "...до сирены осталось совсем немного...",
    text: [
      "Цепь на воротах давно проржавела, но дверь школы выглядит новой. За мутным стеклом дети сидят за партами, повернув головы к Вере. У всех вместо лиц — белые пятна старой фотографии.",
      "Из подвала трижды стучат по трубе. Точно так Миша просил впустить его в детскую комнату.",
    ],
    choices: [
      { label: "Открыть путь ключом", to: "school", require: { item: "ключ от котельной" }, locked: "НУЖЕН КЛЮЧ ИЗ МОТЕЛЯ" },
      { label: "Разбить стекло фонарём", to: "school", require: { item: "фонарь" }, locked: "НУЖЕН ФОНАРЬ ИЗ МАШИНЫ", effects: { fear: 1 } },
      { label: "Пролезть через спортзал", to: "school", effects: { fear: 2 } },
      { label: "Вернуться в мотель", to: "motel" },
    ],
  },
  school: {
    index: "10",
    chapter: "ГЛАВА IV / ПОСЛЕДНИЙ УРОК",
    title: "Звонок после полуночи",
    location: "Школа № 4",
    time: "04:27",
    radio: "...вниз... туда, где стены горячие...",
    text: [
      "Школьный звонок звучит в пустом коридоре. На доске мелом выведена сегодняшняя дата. Под ней вопрос: «Кого ты оставила за дверью?» — и два варианта ответа: «брата» и «себя».",
      "Лестница в котельную покрыта мокрым пеплом. Детские следы ведут вниз. Взрослые — обратно вверх.",
    ],
    choices: [
      { label: "Спуститься в котельную", to: "boiler" },
      { label: "Пойти на детский смех", to: "classroom" },
      { label: "Попытаться выйти из школы", to: "street", effects: { fear: 1 } },
    ],
  },
  classroom: {
    index: "11",
    chapter: "ГЛАВА IV / РИСУНОК",
    title: "Дом с железной дверью",
    location: "Кабинет 14",
    time: "04:33",
    radio: "...я не злюсь... просто открой дверь...",
    text: [
      "На каждой парте лежит один и тот же рисунок: двое детей у горящей котельной. Девочка снаружи держит дверь закрытой. Над ней неровно написано: «Она испугалась».",
      "С обратной стороны последнего листа: <em>«Я ждал не спасения. Я ждал, что ты вернёшься».</em>",
    ],
    enter: { clues: ["детский рисунок"], flags: { sawDrawing: true } },
    choices: [
      { label: "Взять рисунок и спуститься", to: "boiler" },
      { label: "Порвать рисунок", to: "boiler", effects: { flags: { deniedDrawing: true }, fear: 1 } },
    ],
  },
  boiler: {
    index: "12",
    chapter: "ГЛАВА V / ЖЕЛЕЗНАЯ ДВЕРЬ",
    title: "За дверью всё ещё стучат",
    location: "Школьная котельная",
    time: "04:41",
    radio: "Вера... сирена скоро кончится. Решай.",
    text: [
      "В конце подвала стоит та самая железная дверь. Краска на ней вспучилась от старого жара. За дверью кто-то медленно проводит ногтями по металлу.",
      "Сирена становится громче. Мир вокруг осыпается ржавчиной, обнажая трубы, решётки и стены, которых здесь не должно быть.",
    ],
    choices: [
      { label: "Вставить кассету в радио", to: "memory", require: { item: "кассета Миши" }, locked: "КАССЕТА ОСТАЛАСЬ В КОМНАТЕ 208" },
      { label: "Позвать Мишу по имени", to: "memory", effects: { fear: 1 } },
      { label: "Сломать дверь и не слушать", to: "otherworld", effects: { flags: { forcedDoor: true }, fear: 2 } },
    ],
  },
  memory: {
    index: "13",
    chapter: "ГЛАВА V / ТО, ЧТО БЫЛО",
    title: "Ты слышала каждый удар",
    location: "Воспоминание",
    time: "8 лет назад",
    radio: "...я звал тебя сорок три минуты...",
    text: [
      "Память возвращается не картинкой, а запахом дыма. Дети пробрались в закрытую котельную. Когда вспыхнул мазут, Вера вытолкнула Мишу за противопожарную дверь — не наружу, а в соседнее помещение — и побежала за помощью.",
      "У выхода она услышала его крик. Но испугалась огня, сирен и наказания. Она убежала из города вместе с родителями и убедила себя, что дверь заклинило сама.",
    ],
    enter: { flags: { remembers: true }, clues: ["правда о пожаре"], fear: -1 },
    choices: [
      { label: "Признать: «Я оставила тебя»", to: "otherworld", effects: { flags: { accepted: true }, fear: -2 } },
      { label: "Сказать: «Я была ребёнком»", to: "otherworld", effects: { flags: { forgivesSelf: true } } },
      { label: "Отказаться верить", to: "otherworld", effects: { flags: { deniedTruth: true }, fear: 2 } },
    ],
  },
  otherworld: {
    index: "14",
    chapter: "ГЛАВА VI / ПОД КОЖЕЙ ГОРОДА",
    title: "Смотритель выходит на свет",
    location: "Изнанка",
    time: "—:—",
    world: "otherworld",
    radio: "ТРЕСК // ШАГИ // ТРЕСК // НЕ ОБОРАЧИВАЙСЯ",
    text: [
      "Сирена обрывается. Коридор теперь собран из ржавых решёток. Из темноты выходит Смотритель — высокая фигура в обгоревшем плаще. На поясе звенят сотни ключей, но ни один не подходит к двери за его спиной.",
      "Под маской слышно дыхание Веры. Существо поднимает руку и указывает в сторону озера, где над чёрной водой стоит мальчик.",
    ],
    choices: [
      { label: "Показать Смотрителю фотографию", to: "keeper", require: { item: "семейная фотография" }, locked: "ФОТОГРАФИЯ ОСТАЛАСЬ В МАШИНЕ" },
      { label: "Не бежать и назвать свою вину", to: "keeper", require: { flag: "remembers" }, locked: "ВЫ ЕЩЁ НЕ ПОМНИТЕ ПРАВДУ" },
      { label: "Бежать к мальчику у озера", to: "lake", effects: { fear: 1 } },
      { label: "Спрятаться в пустом классе", to: "loopHall", effects: { fear: 1 } },
    ],
  },
  loopHall: {
    index: "15",
    chapter: "ГЛАВА VI / КОРИДОР",
    title: "Каждая дверь ведёт обратно",
    location: "Изнанка",
    time: "—:—",
    world: "otherworld",
    radio: "...ты уже пряталась... восемь лет...",
    text: [
      "Вера запирается в классе, но оказывается в том же коридоре. С каждым кругом детские парты становятся меньше, а шаги Смотрителя — ближе.",
      "У последней двери лежит её семейная фотография. Теперь белая полоса закрывает лицо Веры, а Миша смотрит прямо в объектив.",
    ],
    choices: [
      { label: "Перестать прятаться", to: "keeper", effects: { flags: { accepted: true }, fear: -1 } },
      { label: "Искать выход снова", to: "endingLoop" },
    ],
  },
  keeper: {
    index: "16",
    chapter: "ГЛАВА VI / СМОТРИТЕЛЬ",
    title: "Чудовище снимает твоё лицо",
    location: "Изнанка",
    time: "04:59",
    world: "otherworld",
    radio: "...дверь открыта... дальше ты сама...",
    text: [
      "Смотритель замирает. Под его маской нет лица — только зеркало. Вера видит себя в ту ночь: испуганную девочку, которая держит дверь и не знает, как исправить уже сделанное.",
      "Связка ключей рассыпается пеплом. Дорога к озеру свободна. На берегу Миша ждёт последнего ответа.",
    ],
    enter: { flags: { facedKeeper: true } },
    choices: [
      { label: "Идти к Мише", to: "lake" },
      { label: "Разбить зеркало", to: "lake", effects: { flags: { brokeMirror: true }, fear: 1 } },
      { label: "Остаться со своим отражением", to: "endingStatic" },
    ],
  },
  lake: {
    index: "17",
    chapter: "ФИНАЛ / БЕРЕГ",
    title: "Туман ждёт ответа",
    location: "Сгоревший причал",
    time: "05:17",
    radio: "Миша: «Ты пришла. Теперь скажи зачем».",
    text: [
      "Мальчик стоит на воде, как на тёмном стекле. Он не стал старше. За его спиной из тумана проступает утро, но рассвет не касается города.",
      "«Я не просил тебя спасти меня, — говорит Миша. — Я хотел, чтобы ты перестала оставлять меня здесь каждую ночь».",
    ],
    choices: [
      { label: "Сказать правду и отпустить его", to: "endingDawn", require: { flag: "remembers" }, locked: "СНАЧАЛА НУЖНО ВСПОМНИТЬ" },
      { label: "Войти в воду вместо него", to: "endingSacrifice" },
      { label: "Вернуться к машине", to: "endingLoop" },
      { label: "Ответить голосу в радио", to: "endingStatic" },
    ],
  },
  endingDawn: {
    index: "∞",
    chapter: "КОНЦОВКА I / РАССВЕТ",
    title: "Город отпускает тех, кто помнит",
    location: "Южная дорога",
    time: "06:02",
    radio: "Тишина. Впервые — настоящая.",
    ending: "РАССВЕТ",
    text: [
      "Вера произносит всё вслух: как закрыла дверь, как услышала крик, как выбрала бегство. Миша слушает, а потом улыбается — устало и по-взрослому. «Я знаю».",
      "Он уходит в свет над озером. Туман редеет. Утром Вера выезжает из Серого Берега, не забыв брата и впервые не увозя его с собой.",
    ],
    choices: [{ label: "Пройти историю заново", action: "restart" }],
  },
  endingSacrifice: {
    index: "∞",
    chapter: "КОНЦОВКА II / ОБМЕН",
    title: "В городе всегда должен кто-то ждать",
    location: "Дно озера",
    time: "навсегда",
    world: "otherworld",
    radio: "...новый сигнал найден... женский голос...",
    ending: "ОБМЕН",
    text: [
      "Вера делает шаг на чёрную воду. Миша становится прозрачным, а её ноги уходят глубже, чем должно быть возможно. На берегу мальчик впервые видит рассвет.",
      "Через год случайный водитель поймает на частоте 87.6 женский голос: «Не въезжай в город. И что бы ни услышал — не ищи меня».",
    ],
    choices: [{ label: "Пройти историю заново", action: "restart" }],
  },
  endingLoop: {
    index: "00",
    chapter: "КОНЦОВКА III / НУЛЕВОЙ КИЛОМЕТР",
    title: "Знак, которого нет на карте",
    location: "Северный въезд",
    time: "03:17",
    radio: "...ш-ш-ш... Ве... ра... ты меня слышишь?",
    ending: "ПОВТОРЕНИЕ",
    text: [
      "Вера захлопывает дверь машины и давит на газ. Через десять минут впереди снова возникает тот же ржавый указатель. На пассажирском сиденье оживает радио без батареек.",
      "На заднем сиденье кто-то медленно перелистывает журнал мотеля. Новая ночь начинается с той же страницы.",
    ],
    choices: [{ label: "Попробовать ещё раз", action: "restart" }],
  },
  endingStatic: {
    index: "∞",
    chapter: "КОНЦОВКА IV / БЕЛЫЙ ШУМ",
    title: "Теперь город говорит твоим голосом",
    location: "Частота 87.6",
    time: "—:—",
    world: "otherworld",
    radio: "Вера: «Я здесь. Я всегда была здесь».",
    ending: "БЕЛЫЙ ШУМ",
    text: [
      "Вера подносит радио к губам, но слова произносит город. Туман наполняет лёгкие мягким холодом. Улицы, школа и озеро растворяются в белом шуме.",
      "С тех пор радио каждого, кто проезжает рядом с Серым Берегом, на секунду оживает. Женский голос спокойно спрашивает: «Ты тоже кого-то оставил?»",
    ],
    choices: [{ label: "Настроить частоту заново", action: "restart" }],
  },
};

const elements = {
  app: document.querySelector("#app"),
  entry: document.querySelector("#entryScreen"),
  start: document.querySelector("#startButton"),
  continue: document.querySelector("#continueButton"),
  story: document.querySelector("#storyPanel"),
  chapterIndex: document.querySelector("#chapterIndex"),
  chapterLabel: document.querySelector("#chapterLabel"),
  title: document.querySelector("#sceneTitle"),
  text: document.querySelector("#sceneText"),
  choices: document.querySelector("#choices"),
  location: document.querySelector("#locationValue"),
  time: document.querySelector("#timeValue"),
  fearMeter: document.querySelector("#fearMeter"),
  fearValue: document.querySelector("#fearValue"),
  inventory: document.querySelector("#inventoryList"),
  clueCount: document.querySelector("#clueCount"),
  evidence: document.querySelector("#evidenceList"),
  radio: document.querySelector("#radioMessage"),
  sound: document.querySelector("#soundButton"),
  soundLabel: document.querySelector("#soundLabel"),
  reset: document.querySelector("#resetButton"),
  home: document.querySelector("#homeLink"),
};

function applyEffects(effects = {}) {
  if (effects.inventory) {
    for (const item of effects.inventory) {
      if (!state.inventory.includes(item)) state.inventory.push(item);
    }
  }

  if (effects.clues) {
    for (const clue of effects.clues) {
      if (!state.clues.includes(clue)) state.clues.push(clue);
    }
  }

  if (effects.flags) Object.assign(state.flags, effects.flags);
  if (effects.fear) state.fear = Math.max(0, Math.min(4, state.fear + effects.fear));
}

function requirementsMet(require = {}) {
  if (require.item && !state.inventory.includes(require.item)) return false;
  if (require.flag && !state.flags[require.flag]) return false;
  return true;
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !scenes[saved.current]) return false;
    state = { ...initialState(), ...saved };
    return true;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return false;
  }
}

function enterScene(sceneId) {
  const scene = scenes[sceneId];
  if (!scene) return;

  state.current = sceneId;
  if (!state.visited.includes(sceneId)) {
    state.visited.push(sceneId);
    applyEffects(scene.enter);
  }
  if (scene.ending) state.ending = scene.ending;

  render();
  saveState();

  if (scene.world === "otherworld") triggerSiren();
}

function render() {
  const scene = scenes[state.current];
  document.body.classList.toggle("otherworld", scene.world === "otherworld");

  elements.chapterIndex.textContent = scene.index;
  elements.chapterLabel.textContent = scene.chapter;
  elements.title.textContent = scene.title;
  elements.location.textContent = scene.location;
  elements.time.textContent = scene.time;
  elements.radio.textContent = scene.radio;
  elements.text.innerHTML = scene.text.map((paragraph) => `<p>${paragraph}</p>`).join("");

  elements.choices.innerHTML = "";
  scene.choices.forEach((choice, index) => {
    const available = requirementsMet(choice.require);
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.disabled = !available;
    button.dataset.index = index;
    button.innerHTML = `
      <span class="choice__number">0${index + 1}</span>
      <span class="choice__label">${choice.label}${!available ? `<small class="choice__lock">${choice.locked}</small>` : ""}</span>
      <span class="choice__arrow" aria-hidden="true">→</span>
    `;
    elements.choices.append(button);
  });

  const fearLabels = ["СОБРАНА", "НАСТОРОЖЕНА", "НАПРЯЖЕНА", "ИСПУГАНА", "НА ГРАНИ"];
  elements.fearValue.textContent = fearLabels[state.fear];
  [...elements.fearMeter.children].forEach((bar, index) => {
    bar.classList.toggle("is-active", index < state.fear);
    bar.classList.toggle("is-danger", state.fear > 2 && index < state.fear);
  });

  elements.inventory.innerHTML = state.inventory.map((item) => `<li>${item}</li>`).join("");
  elements.clueCount.textContent = Math.min(state.clues.length, 4);
  elements.evidence.innerHTML = Array.from({ length: 4 }, (_, index) => {
    const clue = state.clues[index];
    return `<li class="${clue ? "is-found" : ""}">${clue || "НЕИЗВЕСТНО"}</li>`;
  }).join("");

  elements.story.classList.remove("is-changing");
  void elements.story.offsetWidth;
  elements.story.classList.add("is-changing");
  document.querySelector(".story-layout").scrollTo({ top: 0, behavior: "smooth" });
}

function choose(index) {
  const scene = scenes[state.current];
  const choice = scene.choices[index];
  if (!choice || !requirementsMet(choice.require)) return;

  playClick();
  if (choice.action === "restart") {
    restart();
    return;
  }

  applyEffects(choice.effects);
  enterScene(choice.to);
}

function openStory(useSave = false) {
  if (!useSave) {
    state = initialState();
    localStorage.removeItem(SAVE_KEY);
  }
  elements.entry.classList.add("is-hidden");
  elements.app.classList.add("is-visible");
  elements.app.setAttribute("aria-hidden", "false");
  enterScene(state.current);
}

function restart() {
  state = initialState();
  localStorage.removeItem(SAVE_KEY);
  enterScene("arrival");
}

function createAmbientSound() {
  if (audioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  audioContext = new AudioCtx();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);

  const hum = audioContext.createOscillator();
  const humGain = audioContext.createGain();
  hum.type = "sine";
  hum.frequency.value = 43;
  humGain.gain.value = 0.18;
  hum.connect(humGain).connect(masterGain);
  hum.start();

  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 260;
  noiseGain.gain.value = 0.035;
  noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
  noise.start();
}

function toggleSound() {
  createAmbientSound();
  if (!audioContext || !masterGain) return;
  audioContext.resume();
  soundOn = !soundOn;
  const now = audioContext.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.linearRampToValueAtTime(soundOn ? 0.16 : 0, now + 0.35);
  elements.sound.setAttribute("aria-pressed", String(soundOn));
  elements.soundLabel.textContent = soundOn ? "ЗВУК: ВКЛ" : "ЗВУК: ВЫКЛ";
}

function playClick() {
  if (!soundOn || !audioContext || !masterGain) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(96, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, audioContext.currentTime + 0.08);
  gain.gain.setValueAtTime(0.055, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

function triggerSiren() {
  if (!soundOn || !audioContext || !masterGain) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(65, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(145, audioContext.currentTime + 1.2);
  oscillator.frequency.exponentialRampToValueAtTime(72, audioContext.currentTime + 2.5);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.09, audioContext.currentTime + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.7);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 2.8);
}

elements.start.addEventListener("click", () => openStory(false));
elements.continue.addEventListener("click", () => openStory(true));
elements.sound.addEventListener("click", toggleSound);
elements.reset.addEventListener("click", restart);
elements.home.addEventListener("click", (event) => {
  event.preventDefault();
  elements.entry.classList.remove("is-hidden");
  elements.app.setAttribute("aria-hidden", "true");
  elements.continue.hidden = false;
});
elements.choices.addEventListener("click", (event) => {
  const button = event.target.closest(".choice");
  if (button) choose(Number(button.dataset.index));
});

document.addEventListener("keydown", (event) => {
  if (!elements.entry.classList.contains("is-hidden")) return;
  const number = Number(event.key);
  if (number >= 1 && number <= 4) choose(number - 1);
});

if (loadState()) elements.continue.hidden = false;
render();
