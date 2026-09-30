// All generated sentences: customer orders and step prompts in English with a
// Russian helper line. Pure functions (unit tested).
import { WORD, RECIPE } from './data.js';

// ---------- Cyrillic -> Latin letters (simple phonetic, easy to read) ----------
const TR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};
export function translit(s) {
  let out = '';
  for (const ch of s) {
    const lo = ch.toLowerCase();
    const t = TR[lo];
    if (t === undefined) { out += ch; continue; }
    out += ch !== lo && t ? t[0].toUpperCase() + t.slice(1) : t;
  }
  return out;
}

// ---------- "with ..." forms: English phrase, Russian instrumental ----------
const WITH = {
  strawberry: ['strawberries', 'клубникой'], banana: ['banana', 'бананом'], blueberry: ['blueberries', 'черникой'],
  apple: ['apple', 'яблоком'], orange: ['orange', 'апельсином'], cheese: ['cheese', 'сыром'], tomato: ['tomato', 'помидором'],
  lettuce: ['lettuce', 'салатом'], onion: ['onion', 'луком'], jam: ['jam', 'вареньем'], butter: ['butter', 'маслом'],
  chocolate: ['chocolate', 'шоколадом'], ketchup: ['ketchup', 'кетчупом'], mustard: ['mustard', 'горчицей'],
  sausage: ['sausage', 'колбасками'], mushroom: ['mushrooms', 'грибами'], pepper: ['peppers', 'перцем'], olive: ['olives', 'оливками'],
  salmon: ['salmon', 'лососем'], cucumber: ['cucumber', 'огурцом'], avocado: ['avocado', 'авокадо'], cherry: ['a cherry', 'вишенкой'],
  sprinkles: ['sprinkles', 'посыпкой'], sauce: ['tomato sauce', 'томатным соусом'], cream: ['cream sauce', 'сливочным соусом'],
};
export const withEn = (id) => WITH[id]?.[0] || WORD[id]?.en.toLowerCase() || id;
export const withRu = (id) => WITH[id]?.[1] || WORD[id]?.ru.toLowerCase() || id;

const COLOR_EN = { pink: 'pink', white: 'white', blue: 'blue', yellow: 'yellow', purple: 'purple' };
const COLOR_RU = { pink: 'розовым', white: 'белым', blue: 'голубым', yellow: 'жёлтым', purple: 'фиолетовым' };
const FLAVOR = { chocolate: ['chocolate', 'шоколадный'], strawberry: ['strawberry', 'клубничный'], vanilla: ['vanilla', 'ванильный'] };
const FRUIT_ADJ = { strawberry: ['strawberry', 'клубничный'], banana: ['banana', 'банановый'], blueberry: ['blueberry', 'черничный'] };

const and = (list) => (list.length <= 1 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]);
const andRu = (list) => (list.length <= 1 ? list.join('') : list.slice(0, -1).join(', ') + ' и ' + list[list.length - 1]);

// one dish of an order -> { en: 'a burger with cheese and tomato', ru: 'бургер с сыром и помидором' }
export function dishPhrase(order) {
  const v = order.vary;
  switch (order.recipe) {
    case 'pancakes': return { en: `pancakes with ${withEn(v.top)}`, ru: `блинчики с ${withRu(v.top)}` };
    case 'fruitsalad': return { en: `a fruit salad with ${and([withEn(v.a), withEn(v.b)])}`, ru: `фруктовый салат с ${andRu([withRu(v.a), withRu(v.b)])}` };
    case 'toast': return { en: `toast with ${withEn(v.top)}`, ru: `тост с ${withRu(v.top)}` };
    case 'smoothie': return { en: `a ${FRUIT_ADJ[v.fruit][0]} smoothie`, ru: `${FRUIT_ADJ[v.fruit][1]} смузи` };
    case 'burger': {
      const en = v.cheese ? `a burger with ${and(['cheese', withEn(v.veg)])}` : `a burger with ${withEn(v.veg)} and no cheese`;
      const ru = v.cheese ? `бургер с ${andRu(['сыром', withRu(v.veg)])}` : `бургер с ${withRu(v.veg)}, без сыра`;
      return { en, ru };
    }
    case 'fries': return { en: 'French fries with salt', ru: 'картошку фри с солью' };
    case 'hotdog': return { en: `a hot dog with ${withEn(v.sauce)}`, ru: `хот-дог с ${withRu(v.sauce)}` };
    case 'milkshake': return { en: `a ${FLAVOR[v.flavor][0]} milkshake`, ru: `${FLAVOR[v.flavor][1]} молочный коктейль` };
    case 'pizza': return { en: `a pizza with ${withEn(v.top)}`, ru: `пиццу с ${withRu(v.top)}` };
    case 'spaghetti': return { en: `spaghetti with ${withEn(v.sauce)}`, ru: `спагетти с ${withRu(v.sauce)}` };
    case 'salad': return { en: `a salad with ${withEn(v.extra)}`, ru: `салат с ${withRu(v.extra)}` };
    case 'sushi': return { en: `a sushi roll with ${withEn(v.fill)}`, ru: `ролл с ${withRu(v.fill)}` };
    case 'miso': return { en: 'miso soup', ru: 'суп мисо' };
    case 'onigiri': return { en: `a rice ball with ${withEn(v.fill)}`, ru: `рисовый шарик с ${withRu(v.fill)}` };
    case 'cupcakes': return { en: `a cupcake with ${COLOR_EN[v.frost]} cream and ${withEn(v.top)}`, ru: `капкейк с ${COLOR_RU[v.frost]} кремом и ${withRu(v.top)}` };
    case 'cake': return { en: `a birthday cake with ${COLOR_EN[v.frost]} cream`, ru: `торт с ${COLOR_RU[v.frost]} кремом` };
    case 'cookies': return { en: `cookies with ${v.chip === 'chocolate' ? 'chocolate chips' : 'sprinkles'}`, ru: `печенье с ${withRu(v.chip)}` };
    default: return { en: WORD[order.recipe].en.toLowerCase(), ru: WORD[order.recipe].ru.toLowerCase() };
  }
}

const GREET = [
  ['Hello! I\'d like', 'Привет! Мне, пожалуйста,'],
  ['Hi! Can I have', 'Привет! Можно мне'],
  ['Good day! I would like', 'Добрый день! Я бы хотел(а)'],
];
// full customer sentence for a list of dishes (1 or 2)
export function orderSentence(orders, g = 0) {
  const ps = orders.map(dishPhrase);
  const [enG, ruG] = GREET[g % GREET.length];
  return {
    en: `${enG} ${ps.map((p) => p.en).join(' and ')}, please!`,
    ru: `${ruG} ${ps.map((p) => p.ru).join(' и ')}.`,
  };
}

// ---------- step prompts ----------
const COOK_VERB = {
  pan: ['Fry', 'Пожарь'], grill: ['Grill', 'Пожарь на гриле'], oven: ['Bake', 'Испеки'], pot: ['Boil', 'Свари'],
  fryer: ['Fry', 'Обжарь'], toaster: ['Toast', 'Поджарь'],
};
const COOK_ITEM = {
  pancakes: ['the pancakes', 'блинчики'], toast: ['the bread', 'хлеб'], patty: ['the patty', 'котлету'], sausage: ['the sausage', 'сосиску'],
  fries: ['the fries', 'картошку'], pizza: ['the pizza', 'пиццу'], pasta: ['the pasta', 'макароны'], soup: ['the soup', 'суп'],
  rice: ['the rice', 'рис'], cupcakes: ['the cupcake', 'капкейк'], cake: ['the cake', 'торт'], cookies: ['the cookies', 'печенье'],
};
const PLACE_EN = {
  strawberry: 'the strawberries', banana: 'the banana slices', blueberry: 'the blueberries', cheese: 'the cheese',
  sausage: 'the sausage slices', mushroom: 'the mushrooms', pepper: 'the peppers', olive: 'the olives', salmon: 'the salmon',
  cucumber: 'the cucumber', avocado: 'the avocado', cherry: 'the cherry', sprinkles: 'the sprinkles', candle: 'the candles',
  chocolate: 'the chocolate chips', salt: 'the salt', nori: 'the seaweed',
};
const ROLL = { dough: ['Roll the dough', 'Раскатай тесто'], sushi: ['Roll the sushi', 'Сверни ролл'], onigiri: ['Make a rice ball', 'Слепи рисовый шарик'] };
const POUR = { smoothie: 'the smoothie', milkshake: 'the milkshake', batter: 'the batter', miso: 'the soup' };
const POUR_RU = { smoothie: 'смузи', milkshake: 'коктейль', batter: 'тесто', miso: 'суп' };

const acc = (id) => WORD[id]?.acc || id;
const en = (id) => WORD[id]?.en.toLowerCase() || id;

export function stepPrompt(step) {
  switch (step.t) {
    case 'add': return { en: `Add the ${and(step.items.map(en))}`, ru: `Добавь: ${andRu(step.items.map((i) => WORD[i].ru.toLowerCase()))}`, words: step.items };
    case 'stir': return step.tool === 'blender' ? { en: 'Blend it!', ru: 'Взбей в блендере! Води пальцем по кругу.' } : { en: 'Stir it!', ru: 'Помешай! Води пальцем по кругу.' };
    case 'chop': return { en: `Chop the ${en(step.item)}`, ru: `Нарежь ${acc(step.item)}`, words: [step.item, 'chop'] };
    case 'cook': {
      const [v, vr] = COOK_VERB[step.tool];
      const [i, ir] = COOK_ITEM[step.item];
      return { en: `${v} ${i}`, ru: `${vr} ${ir}`, words: [step.tool === 'grill' || step.tool === 'toaster' || step.tool === 'fryer' ? 'fry' : step.tool === 'oven' ? 'bake' : step.tool === 'pot' ? 'boil' : 'fry'] };
    }
    case 'pour': return { en: `Pour ${POUR[step.item]}`, ru: `Налей ${POUR_RU[step.item]} до линии`, words: ['pour'] };
    case 'spread': {
      const it = step.item === 'cream' && step.color ? `the ${COLOR_EN[step.color]} cream` : step.item === 'rice' ? 'the rice' : `the ${en(step.item)}`;
      const ru = step.item === 'cream' && step.color ? `${COLOR_RU[step.color].replace(/ым$/, 'ый').replace(/им$/, 'ий')} крем` : acc(step.item);
      return { en: `Spread ${it}`, ru: `Намажь ${ru}`, words: [step.item, 'spread'].concat(step.color ? [step.color] : []) };
    }
    case 'place':
      if (step.item === 'salt') return { en: 'Add some salt', ru: 'Посоли: нажимай на картошку', words: ['salt'] };
      if (step.item === 'nori') return { en: 'Put the seaweed on', ru: 'Положи водоросли нори', words: ['nori'] };
      return { en: `Put ${PLACE_EN[step.item] || 'the ' + en(step.item)} on top`, ru: `Положи сверху ${acc(step.item)}`, words: [step.item, 'put'] };
    case 'stack': return { en: `Build it: ${step.layers.map(en).join(', ')}`, ru: 'Собери по порядку, снизу вверх', words: step.layers };
    case 'roll': return { en: ROLL[step.item][0], ru: ROLL[step.item][1] + '. Проводи пальцем вверх.', words: ['roll'] };
    case 'slice': return { en: `Slice the ${en(step.item)}`, ru: `Разрежь ${acc(step.item)}`, words: [step.item, 'slice'] };
    default: return { en: '', ru: '' };
  }
}

// Russian how-to for the first time each step type appears
export const HOWTO = {
  add: 'Нажимай на нужные продукты внизу. Читай английские слова!',
  stir: 'Води пальцем по кругу, чтобы перемешать.',
  chop: 'Проведи пальцем сверху вниз по пунктирной линии. Точнее = больше звёзд!',
  cook: 'Жди, пока стрелка дойдёт до зелёной зоны, и нажми STOP. Если есть FLIP, сначала переверни!',
  pour: 'Держи кнопку POUR и отпусти на линии.',
  spread: 'Три пальцем по еде, пока всё не покроется.',
  place: 'Нажимай на блюдо, чтобы положить сверху.',
  stack: 'Нажимай на продукты в правильном порядке, снизу вверх.',
  roll: 'Проводи пальцем вверх несколько раз.',
  slice: 'Проведи пальцем через середину по линии.',
};

export const RESULT_WORDS = [
  [0.88, 'Perfect!', 'Идеально!'],
  [0.72, 'Great job!', 'Отлично!'],
  [0.45, 'Good!', 'Хорошо!'],
  [0, 'Oops!', 'Ой!'],
];
export const resultWord = (q) => RESULT_WORDS.find(([m]) => q >= m);

export function recipeName(id) { return RECIPE[id] ? WORD[id].en : id; }
