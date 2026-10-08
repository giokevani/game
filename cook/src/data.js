// Blossom Kitchen café data: words (English + Russian), ingredients, recipes,
// restaurants and levels. Pure data + helpers (unit tested).

// ---------- words ----------
// acc = Russian accusative form when it differs ("Нарежь клубнику")
const W = (id, en, ru, emoji, cat, acc) => ({ id, en, ru, emoji, cat, acc: acc || ru.toLowerCase() });
export const WORDS = [
  // ingredients
  W('tomato', 'Tomato', 'Помидор', '🍅', 'food'),
  W('cucumber', 'Cucumber', 'Огурец', '🥒', 'food'),
  W('carrot', 'Carrot', 'Морковь', '🥕', 'food'),
  W('onion', 'Onion', 'Лук', '🧅', 'food'),
  W('lettuce', 'Lettuce', 'Салатный лист', '🥬', 'food'),
  W('potato', 'Potato', 'Картошка', '🥔', 'food', 'картошку'),
  W('strawberry', 'Strawberry', 'Клубника', '🍓', 'food', 'клубнику'),
  W('banana', 'Banana', 'Банан', '🍌', 'food'),
  W('apple', 'Apple', 'Яблоко', '🍎', 'food'),
  W('blueberry', 'Blueberries', 'Черника', '🫐', 'food', 'чернику'),
  W('orange', 'Orange', 'Апельсин', '🍊', 'food'),
  W('lemon', 'Lemon', 'Лимон', '🍋', 'food'),
  W('cherry', 'Cherry', 'Вишня', '🍒', 'food', 'вишню'),
  W('cheese', 'Cheese', 'Сыр', '🧀', 'food'),
  W('bread', 'Bread', 'Хлеб', '🍞', 'food'),
  W('bun', 'Bun', 'Булочка', '🍔', 'food', 'булочку'),
  W('patty', 'Patty', 'Котлета', '🥩', 'food', 'котлету'),
  W('sausage', 'Sausage', 'Сосиска', '🌭', 'food', 'сосиску'),
  W('mushroom', 'Mushroom', 'Гриб', '🍄', 'food'),
  W('pepper', 'Pepper', 'Перец', '🫑', 'food'),
  W('olive', 'Olives', 'Оливки', '🫒', 'food'),
  W('salmon', 'Salmon', 'Лосось', '🐟', 'food', 'лосося'),
  W('avocado', 'Avocado', 'Авокадо', '🥑', 'food'),
  W('egg', 'Egg', 'Яйцо', '🥚', 'food'),
  W('butter', 'Butter', 'Масло', '🧈', 'food'),
  W('chocolate', 'Chocolate', 'Шоколад', '🍫', 'food'),
  W('flour', 'Flour', 'Мука', '🌾', 'food', 'муку'),
  W('milk', 'Milk', 'Молоко', '🥛', 'food'),
  W('sugar', 'Sugar', 'Сахар', '🍬', 'food'),
  W('salt', 'Salt', 'Соль', '🧂', 'food'),
  W('rice', 'Rice', 'Рис', '🍚', 'food'),
  W('nori', 'Seaweed', 'Водоросли нори', '🌿', 'food'),
  W('tofu', 'Tofu', 'Тофу', '⬜', 'food'),
  W('pasta', 'Pasta', 'Макароны', '🍝', 'food'),
  W('dough', 'Dough', 'Тесто', '🫓', 'food'),
  W('jam', 'Jam', 'Варенье', '🍯', 'food'),
  W('cream', 'Cream', 'Крем', '🍦', 'food'),
  W('icecream', 'Ice cream', 'Мороженое', '🍨', 'food'),
  W('ketchup', 'Ketchup', 'Кетчуп', '🥫', 'food'),
  W('mustard', 'Mustard', 'Горчица', '🟡', 'food', 'горчицу'),
  W('sauce', 'Tomato sauce', 'Томатный соус', '🥣', 'food'),
  W('sprinkles', 'Sprinkles', 'Посыпка', '🎊', 'food', 'посыпку'),
  W('candle', 'Candles', 'Свечи', '🕯️', 'food'),
  W('vanilla', 'Vanilla', 'Ваниль', '🌼', 'food'),
  // more food for the Free Kitchen
  W('grapes', 'Grapes', 'Виноград', '🍇', 'food'),
  W('kiwi', 'Kiwi', 'Киви', '🥝', 'food'),
  W('mango', 'Mango', 'Манго', '🥭', 'food'),
  W('pineapple', 'Pineapple', 'Ананас', '🍍', 'food'),
  W('peach', 'Peach', 'Персик', '🍑', 'food'),
  W('pear', 'Pear', 'Груша', '🍐', 'food', 'грушу'),
  W('watermelon', 'Watermelon', 'Арбуз', '🍉', 'food'),
  W('coconut', 'Coconut', 'Кокос', '🥥', 'food'),
  W('raspberry', 'Raspberries', 'Малина', '🫐', 'food', 'малину'),
  W('broccoli', 'Broccoli', 'Брокколи', '🥦', 'food'),
  W('corn', 'Corn', 'Кукуруза', '🌽', 'food', 'кукурузу'),
  W('peas', 'Peas', 'Горошек', '🟢', 'food'),
  W('garlic', 'Garlic', 'Чеснок', '🧄', 'food'),
  W('eggplant', 'Eggplant', 'Баклажан', '🍆', 'food'),
  W('spinach', 'Spinach', 'Шпинат', '🥬', 'food'),
  W('beans', 'Beans', 'Фасоль', '🫘', 'food'),
  W('yogurt', 'Yogurt', 'Йогурт', '🥛', 'food'),
  W('honey', 'Honey', 'Мёд', '🍯', 'food'),
  W('chicken', 'Chicken', 'Курица', '🍗', 'food', 'курицу'),
  W('ham', 'Ham', 'Ветчина', '🥓', 'food', 'ветчину'),
  W('shrimp', 'Shrimp', 'Креветки', '🦐', 'food'),
  W('tuna', 'Tuna', 'Тунец', '🐟', 'food'),
  W('noodles', 'Noodles', 'Лапша', '🍜', 'food', 'лапшу'),
  W('tortilla', 'Tortilla', 'Лепёшка', '🫓', 'food', 'лепёшку'),
  W('croissant', 'Croissant', 'Круассан', '🥐', 'food'),
  W('cereal', 'Cereal', 'Хлопья', '🥣', 'food'),
  W('marshmallow', 'Marshmallow', 'Маршмеллоу', '☁️', 'food'),
  W('candy', 'Candy', 'Конфета', '🍬', 'food', 'конфету'),
  W('caramel', 'Caramel', 'Карамель', '🍮', 'food', 'карамель'),
  W('gummy', 'Gummy bears', 'Мармеладные мишки', '🐻', 'food'),
  W('juice', 'Juice', 'Сок', '🧃', 'food'),
  W('water', 'Water', 'Вода', '💧', 'food', 'воду'),
  W('tea', 'Tea', 'Чай', '🍵', 'food'),
  W('cocoa', 'Cocoa', 'Какао', '☕', 'food'),
  W('cinnamon', 'Cinnamon', 'Корица', '🟤', 'food', 'корицу'),
  W('basil', 'Basil', 'Базилик', '🌿', 'food'),
  W('ice', 'Ice', 'Лёд', '🧊', 'food'),
  // dishes
  W('pancakes', 'Pancakes', 'Блинчики', '🥞', 'dish'),
  W('fruitsalad', 'Fruit salad', 'Фруктовый салат', '🍇', 'dish'),
  W('toast', 'Toast', 'Тост', '🍞', 'dish'),
  W('smoothie', 'Smoothie', 'Смузи', '🥤', 'dish'),
  W('burger', 'Burger', 'Бургер', '🍔', 'dish'),
  W('fries', 'French fries', 'Картошка фри', '🍟', 'dish', 'картошку фри'),
  W('hotdog', 'Hot dog', 'Хот-дог', '🌭', 'dish'),
  W('milkshake', 'Milkshake', 'Молочный коктейль', '🧋', 'dish'),
  W('pizza', 'Pizza', 'Пицца', '🍕', 'dish', 'пиццу'),
  W('spaghetti', 'Spaghetti', 'Спагетти', '🍝', 'dish'),
  W('salad', 'Salad', 'Салат', '🥗', 'dish'),
  W('sushi', 'Sushi', 'Суши', '🍣', 'dish'),
  W('miso', 'Miso soup', 'Суп мисо', '🍜', 'dish'),
  W('onigiri', 'Rice ball', 'Рисовый шарик', '🍙', 'dish'),
  W('cupcakes', 'Cupcake', 'Капкейк', '🧁', 'dish'),
  W('cake', 'Birthday cake', 'Торт', '🎂', 'dish'),
  W('cookies', 'Cookies', 'Печенье', '🍪', 'dish'),
  // actions
  W('add', 'Add', 'Добавь', '➕', 'verb'),
  W('stir', 'Stir', 'Помешай', '🥄', 'verb'),
  W('chop', 'Chop', 'Нарежь', '🔪', 'verb'),
  W('fry', 'Fry', 'Пожарь', '🍳', 'verb'),
  W('flip', 'Flip', 'Переверни', '🔄', 'verb'),
  W('boil', 'Boil', 'Свари', '♨️', 'verb'),
  W('bake', 'Bake', 'Испеки', '🔥', 'verb'),
  W('pour', 'Pour', 'Налей', '🫗', 'verb'),
  W('spread', 'Spread', 'Намажь', '🧈', 'verb'),
  W('put', 'Put', 'Положи', '👇', 'verb'),
  W('stack', 'Stack', 'Сложи', '🥞', 'verb'),
  W('roll', 'Roll', 'Сверни', '🌀', 'verb'),
  W('slice', 'Slice', 'Разрежь', '🔪', 'verb'),
  W('serve', 'Serve', 'Подай', '🛎️', 'verb'),
  // tools
  W('pan', 'Pan', 'Сковорода', '🍳', 'tool'),
  W('pot', 'Pot', 'Кастрюля', '🍲', 'tool'),
  W('oven', 'Oven', 'Духовка', '♨️', 'tool'),
  W('bowl', 'Bowl', 'Миска', '🥣', 'tool'),
  W('plate', 'Plate', 'Тарелка', '🍽️', 'tool'),
  W('glass', 'Glass', 'Стакан', '🥛', 'tool'),
  W('knife', 'Knife', 'Нож', '🔪', 'tool'),
  // phrases & colours
  W('hello', 'Hello!', 'Привет!', '👋', 'phrase'),
  W('please', 'Please', 'Пожалуйста', '🙏', 'phrase'),
  W('thanks', 'Thank you!', 'Спасибо!', '💗', 'phrase'),
  W('yummy', 'Yummy!', 'Вкусно!', '😋', 'phrase'),
  W('perfect', 'Perfect!', 'Идеально!', '⭐', 'phrase'),
  W('great', 'Great job!', 'Отлично!', '👍', 'phrase'),
  W('with', 'with', 'с', '➕', 'phrase'),
  W('without', 'without', 'без', '🚫', 'phrase'),
  W('pink', 'Pink', 'Розовый', '🩷', 'color'),
  W('white', 'White', 'Белый', '🤍', 'color'),
  W('blue', 'Blue', 'Голубой', '💙', 'color'),
  W('yellow', 'Yellow', 'Жёлтый', '💛', 'color'),
  W('purple', 'Purple', 'Фиолетовый', '💜', 'color'),
  W('house', 'House', 'Дом', '🏠', 'phrase'),
  W('money', 'Money', 'Деньги', '💰', 'phrase'),
];
export const WORD = Object.fromEntries(WORDS.map((w) => [w.id, w]));

// ---------- ingredients that can be chopped / shown in 3D ----------
// shape: round (lathe profile), long (along x), box, leaf
export const CHOP = {
  kiwi: { shape: 'round', r: 0.05, sy: 0.85, skin: '#8a6a3a', inner: '#7ccf4a', core: '#fffbe0', coreR: 0.3, cuts: 3 },
  mango: { shape: 'round', r: 0.07, sy: 1.25, skin: '#ffb03a', inner: '#ffcf5a', cuts: 3 },
  peach: { shape: 'round', r: 0.07, skin: '#ffa98a', inner: '#ffd08a', core: '#b0603a', coreR: 0.25, cuts: 3 },
  pear: { shape: 'round', r: 0.07, sy: 1.3, skin: '#b8d84a', inner: '#fff6d0', cuts: 3 },
  watermelon: { shape: 'round', r: 0.13, skin: '#3f9a4a', inner: '#ff5a6a', dots: '#ff7a88', cuts: 4 },
  coconut: { shape: 'round', r: 0.08, skin: '#7a5030', inner: '#ffffff', cuts: 2 },
  pineapple: { shape: 'long', r: 0.07, len: 0.24, skin: '#c8902a', inner: '#ffe066', core: '#fff3a0', coreR: 0.3, cuts: 4 },
  eggplant: { shape: 'long', r: 0.05, len: 0.28, taper: -0.4, skin: '#6a3a8a', inner: '#f3ead0', cuts: 4 },
  garlic: { shape: 'round', r: 0.04, sy: 0.9, skin: '#f6f0e4', inner: '#fffaf0', cuts: 2 },
  chicken: { shape: 'box', w: 0.2, h: 0.07, d: 0.11, skin: '#e8c090', inner: '#fff0e0', cuts: 3 },
  ham: { shape: 'box', w: 0.2, h: 0.06, d: 0.12, skin: '#ff9aa8', inner: '#ffc0c8', cuts: 3 },
  tuna: { shape: 'box', w: 0.2, h: 0.06, d: 0.1, skin: '#c8506a', inner: '#e0788a', cuts: 3 },
  tomato: { shape: 'round', r: 0.1, skin: '#e8453c', inner: '#ff8a78', dots: '#ffe08a', cuts: 3 },
  cucumber: { shape: 'long', r: 0.045, len: 0.34, skin: '#3f9a4a', inner: '#dff5c8', dots: '#f4fbe8', cuts: 4 },
  carrot: { shape: 'long', r: 0.042, len: 0.3, taper: 0.5, skin: '#ff8a2e', inner: '#ffb366', cuts: 4 },
  onion: { shape: 'round', r: 0.085, skin: '#d99a5a', inner: '#fff4e6', rings: true, cuts: 3 },
  lettuce: { shape: 'leaf', r: 0.13, skin: '#7cc45a', inner: '#b8e986', cuts: 3 },
  potato: { shape: 'round', r: 0.08, sy: 0.75, skin: '#c9a06b', inner: '#fff0b8', cuts: 4 },
  strawberry: { shape: 'round', r: 0.055, sy: 1.25, skin: '#ff4f6d', inner: '#ffb3c0', dots: '#ffe08a', cuts: 2 },
  banana: { shape: 'long', r: 0.036, len: 0.28, taper: 0.3, skin: '#ffe066', inner: '#fff6d0', cuts: 4 },
  apple: { shape: 'round', r: 0.085, skin: '#ff5d5d', inner: '#fff4d6', cuts: 3 },
  orange: { shape: 'round', r: 0.085, skin: '#ff9a2e', inner: '#ffc466', cuts: 3 },
  lemon: { shape: 'round', r: 0.06, sy: 1.2, skin: '#ffe04a', inner: '#fff4a0', cuts: 2 },
  cheese: { shape: 'box', w: 0.22, h: 0.08, d: 0.12, skin: '#ffd24d', inner: '#ffe27a', cuts: 3 },
  bread: { shape: 'box', w: 0.3, h: 0.12, d: 0.14, skin: '#c98a4b', inner: '#fff0d0', cuts: 3 },
  sausage: { shape: 'long', r: 0.035, len: 0.3, skin: '#c0504a', inner: '#e88a7a', cuts: 5 },
  mushroom: { shape: 'round', r: 0.07, sy: 0.7, skin: '#e8d6c0', inner: '#fff6ea', cuts: 2 },
  pepper: { shape: 'round', r: 0.08, sy: 1.1, skin: '#4fbf5a', inner: '#b8e986', cuts: 3 },
  salmon: { shape: 'box', w: 0.24, h: 0.06, d: 0.1, skin: '#ff8a5a', inner: '#ffb08a', cuts: 3 },
  avocado: { shape: 'round', r: 0.07, sy: 1.3, skin: '#3f6b2a', inner: '#c8e67a', cuts: 3 },
  tofu: { shape: 'box', w: 0.16, h: 0.08, d: 0.1, skin: '#fbf6ea', inner: '#ffffff', cuts: 3 },
  chocolate: { shape: 'box', w: 0.2, h: 0.03, d: 0.1, skin: '#6b3f2a', inner: '#8a5a3c', cuts: 3 },
};

// ---------- Free Kitchen pantry ----------
// kind: whole (can be chopped), liquid (fills up), powder (dusts), small
// (little round bits), chunk (pieces)
export const PANTRY = [
  { id: 'fruit', en: 'Fruit', icon: '🍓', items: ['strawberry', 'banana', 'apple', 'orange', 'lemon', 'cherry', 'blueberry', 'raspberry', 'grapes', 'kiwi', 'mango', 'pineapple', 'peach', 'pear', 'watermelon', 'coconut', 'avocado'] },
  { id: 'veg', en: 'Vegetables', icon: '🥕', items: ['tomato', 'cucumber', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'mushroom', 'lettuce', 'spinach', 'broccoli', 'corn', 'peas', 'beans', 'eggplant', 'olive', 'basil'] },
  { id: 'dairy', en: 'Milk & eggs', icon: '🥛', items: ['milk', 'egg', 'butter', 'cheese', 'cream', 'yogurt', 'icecream'] },
  { id: 'meat', en: 'Meat & fish', icon: '🍗', items: ['chicken', 'ham', 'sausage', 'patty', 'salmon', 'tuna', 'shrimp', 'tofu'] },
  { id: 'bakery', en: 'Bread & pasta', icon: '🍞', items: ['flour', 'bread', 'bun', 'croissant', 'tortilla', 'dough', 'pasta', 'noodles', 'rice', 'cereal', 'nori'] },
  { id: 'sweet', en: 'Sweets', icon: '🍬', items: ['sugar', 'chocolate', 'honey', 'jam', 'caramel', 'marshmallow', 'candy', 'gummy', 'sprinkles', 'vanilla', 'cinnamon'] },
  { id: 'drink', en: 'Drinks & sauces', icon: '🧃', items: ['water', 'juice', 'tea', 'cocoa', 'ice', 'sauce', 'ketchup', 'mustard', 'salt'] },
];
export const KIND = {
  milk: 'liquid', cream: 'liquid', yogurt: 'liquid', honey: 'liquid', jam: 'liquid', caramel: 'liquid', water: 'liquid', juice: 'liquid', tea: 'liquid', cocoa: 'liquid',
  sauce: 'liquid', ketchup: 'liquid', mustard: 'liquid', egg: 'liquid',
  flour: 'powder', sugar: 'powder', salt: 'powder', cinnamon: 'powder', vanilla: 'powder',
  blueberry: 'small', raspberry: 'small', grapes: 'small', cherry: 'small', peas: 'small', corn: 'small', beans: 'small', olive: 'small', rice: 'small', cereal: 'small',
  candy: 'small', gummy: 'small', marshmallow: 'small', sprinkles: 'small', ice: 'small', shrimp: 'small', basil: 'small', spinach: 'small', broccoli: 'small',
  butter: 'chunk', cheese: 'chunk', chocolate: 'chunk', icecream: 'chunk', sausage: 'chunk', patty: 'chunk', tofu: 'chunk', bread: 'chunk', bun: 'chunk', croissant: 'chunk',
  tortilla: 'chunk', dough: 'chunk', pasta: 'chunk', noodles: 'chunk', nori: 'chunk',
};
export const kindOf = (id) => KIND[id] || (CHOP[id] ? 'whole' : 'chunk');

// ---------- recipes ----------
// Step types: add (pick the right item), stir (circles), chop (swipes),
// cook (timer, optional flip), pour (hold to fill), spread (rub), place (tap),
// stack (tap in order), roll (swipe up), slice (swipes over the dish)
// "$x" refers to the order's variant x.
export const RECIPES = [
  { id: 'pancakes', price: 18, vary: { top: ['strawberry', 'banana', 'blueberry'] },
    steps: [{ t: 'add', items: ['flour', 'egg', 'milk'] }, { t: 'stir', turns: 3 }, { t: 'cook', item: 'pancakes', tool: 'pan', flip: true },
      { t: 'chop', item: '$top', skipIf: { top: 'blueberry' } }, { t: 'place', item: '$top', n: 4 }] },
  { id: 'fruitsalad', price: 16, vary: { a: ['strawberry', 'banana'], b: ['apple', 'orange'] },
    steps: [{ t: 'chop', item: '$a' }, { t: 'chop', item: '$b' }, { t: 'stir', turns: 2 }] },
  { id: 'toast', price: 14, vary: { top: ['jam', 'butter', 'chocolate'] },
    steps: [{ t: 'chop', item: 'bread' }, { t: 'cook', item: 'toast', tool: 'toaster' }, { t: 'spread', item: '$top' }] },
  { id: 'smoothie', price: 16, vary: { fruit: ['strawberry', 'banana', 'blueberry'] },
    steps: [{ t: 'chop', item: '$fruit', skipIf: { fruit: 'blueberry' } }, { t: 'add', items: ['milk', '$fruit'] }, { t: 'stir', turns: 3, tool: 'blender' }, { t: 'pour', item: 'smoothie' }] },

  { id: 'burger', price: 30, vary: { cheese: [true, false], veg: ['tomato', 'lettuce', 'onion'] },
    steps: [{ t: 'cook', item: 'patty', tool: 'grill', flip: true }, { t: 'chop', item: '$veg' }, { t: 'stack', layers: ['bun', 'patty', '$cheese', '$veg', 'bun'] }] },
  { id: 'fries', price: 20, vary: {},
    steps: [{ t: 'chop', item: 'potato' }, { t: 'cook', item: 'fries', tool: 'fryer' }, { t: 'place', item: 'salt', n: 3 }] },
  { id: 'hotdog', price: 24, vary: { sauce: ['ketchup', 'mustard'] },
    steps: [{ t: 'cook', item: 'sausage', tool: 'grill', flip: true }, { t: 'stack', layers: ['bun', 'sausage'] }, { t: 'spread', item: '$sauce' }] },
  { id: 'milkshake', price: 22, vary: { flavor: ['chocolate', 'strawberry', 'vanilla'] },
    steps: [{ t: 'add', items: ['milk', 'icecream', '$flavor'] }, { t: 'stir', turns: 3, tool: 'blender' }, { t: 'pour', item: 'milkshake' }, { t: 'place', item: 'cherry', n: 1 }] },

  { id: 'pizza', price: 44, vary: { top: ['sausage', 'mushroom', 'pepper', 'olive'] },
    steps: [{ t: 'roll', item: 'dough' }, { t: 'spread', item: 'sauce' }, { t: 'place', item: 'cheese', n: 4 }, { t: 'chop', item: '$top', skipIf: { top: 'olive' } },
      { t: 'place', item: '$top', n: 5 }, { t: 'cook', item: 'pizza', tool: 'oven' }, { t: 'slice', item: 'pizza', cuts: 3 }] },
  { id: 'spaghetti', price: 36, vary: { sauce: ['sauce', 'cream'] },
    steps: [{ t: 'cook', item: 'pasta', tool: 'pot' }, { t: 'add', items: ['pasta', '$sauce'] }, { t: 'stir', turns: 2 }, { t: 'place', item: 'cheese', n: 3 }] },
  { id: 'salad', price: 28, vary: { extra: ['tomato', 'pepper', 'avocado'] },
    steps: [{ t: 'chop', item: 'cucumber' }, { t: 'chop', item: '$extra' }, { t: 'chop', item: 'lettuce' }, { t: 'stir', turns: 2 }] },

  { id: 'sushi', price: 56, vary: { fill: ['salmon', 'cucumber', 'avocado'] },
    steps: [{ t: 'spread', item: 'rice' }, { t: 'chop', item: '$fill' }, { t: 'place', item: '$fill', n: 3 }, { t: 'roll', item: 'sushi' }, { t: 'slice', item: 'sushi', cuts: 5 }] },
  { id: 'miso', price: 34, vary: {},
    steps: [{ t: 'chop', item: 'tofu' }, { t: 'chop', item: 'onion' }, { t: 'cook', item: 'soup', tool: 'pot' }, { t: 'stir', turns: 2 }, { t: 'pour', item: 'miso' }] },
  { id: 'onigiri', price: 30, vary: { fill: ['salmon', 'avocado'] },
    steps: [{ t: 'cook', item: 'rice', tool: 'pot' }, { t: 'chop', item: '$fill' }, { t: 'roll', item: 'onigiri' }, { t: 'place', item: 'nori', n: 1 }] },

  { id: 'cupcakes', price: 70, vary: { frost: ['pink', 'blue', 'yellow', 'purple'], top: ['cherry', 'sprinkles'] },
    steps: [{ t: 'add', items: ['flour', 'egg', 'sugar'] }, { t: 'stir', turns: 3 }, { t: 'pour', item: 'batter' }, { t: 'cook', item: 'cupcakes', tool: 'oven' },
      { t: 'spread', item: 'cream', color: '$frost' }, { t: 'place', item: '$top', n: 3, nIf: { cherry: 1 } }] },
  { id: 'cake', price: 120, vary: { frost: ['pink', 'white', 'purple'] },
    steps: [{ t: 'add', items: ['flour', 'egg', 'milk', 'sugar'] }, { t: 'stir', turns: 3 }, { t: 'cook', item: 'cake', tool: 'oven' }, { t: 'stack', layers: ['cake', 'cream', 'cake'] },
      { t: 'spread', item: 'cream', color: '$frost' }, { t: 'place', item: 'strawberry', n: 4 }, { t: 'place', item: 'candle', n: 3 }] },
  { id: 'cookies', price: 56, vary: { chip: ['chocolate', 'sprinkles'] },
    steps: [{ t: 'add', items: ['flour', 'butter', 'sugar'] }, { t: 'stir', turns: 2 }, { t: 'roll', item: 'dough' }, { t: 'chop', item: 'chocolate', skipIf: { chip: 'sprinkles' } },
      { t: 'place', item: '$chip', n: 4 }, { t: 'cook', item: 'cookies', tool: 'oven' }] },
];
export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export const RESTAURANTS = [
  { id: 'cafe', en: 'Pancake Café', ru: 'Кафе блинчиков', emoji: '🥞', recipes: ['pancakes', 'fruitsalad', 'toast', 'smoothie'], wall: '#ffe0ec', trim: '#ff8fb5', floor: '#f6e2cf', accent: '#ffd45e' },
  { id: 'diner', en: 'Burger Diner', ru: 'Бургерная', emoji: '🍔', recipes: ['burger', 'fries', 'hotdog', 'milkshake'], wall: '#e0f4ff', trim: '#ff6f6f', floor: '#f3f3f3', accent: '#7fc6ff' },
  { id: 'pizza', en: 'Pizza Place', ru: 'Пиццерия', emoji: '🍕', recipes: ['pizza', 'spaghetti', 'salad'], wall: '#fff3d6', trim: '#4fbf5a', floor: '#e8c9a8', accent: '#ff6f6f' },
  { id: 'sushi', en: 'Sushi Bar', ru: 'Суши-бар', emoji: '🍣', recipes: ['sushi', 'miso', 'onigiri'], wall: '#eaf6ef', trim: '#3e5c8a', floor: '#d9b894', accent: '#ff8a8a' },
  { id: 'bakery', en: 'Sweet Bakery', ru: 'Кондитерская', emoji: '🧁', recipes: ['cupcakes', 'cake', 'cookies'], wall: '#efe6ff', trim: '#b58cff', floor: '#ffe9f3', accent: '#ffd45e' },
];
export const RESTAURANT = Object.fromEntries(RESTAURANTS.map((r) => [r.id, r]));
// resolve a recipe for one order: pick variants, drop skipped steps
export function makeOrder(recipeId, rnd = Math.random) {
  const r = RECIPE[recipeId];
  const v = {};
  for (const [k, opts] of Object.entries(r.vary)) v[k] = opts[Math.floor(rnd() * opts.length)];
  const sub = (x) => (typeof x === 'string' && x.startsWith('$') ? v[x.slice(1)] : x);
  const steps = [];
  for (const s of r.steps) {
    if (s.skipIf && Object.entries(s.skipIf).every(([k, val]) => v[k] === val)) continue;
    const st = { ...s };
    if (st.item) st.item = sub(st.item);
    if (st.nIf && st.nIf[st.item]) st.n = st.nIf[st.item];
    delete st.nIf;
    if (st.color) st.color = sub(st.color);
    if (st.items) st.items = st.items.map(sub);
    if (st.layers) st.layers = st.layers.map((l) => (l === '$cheese' ? (v.cheese ? 'cheese' : null) : sub(l))).filter(Boolean);
    steps.push(st);
  }
  return { recipe: recipeId, vary: v, steps };
}

// how the order reads on the ticket: "Burger with cheese, tomato"
export function orderWords(order) {
  const out = [];
  for (const [k, val] of Object.entries(order.vary)) {
    if (k === 'cheese') out.push(val ? 'cheese' : null);
    else if (typeof val === 'string') out.push(val);
  }
  return out.filter(Boolean);
}

// words used by a recipe (for the Word Book)
export function recipeWords(recipeId) {
  const r = RECIPE[recipeId];
  const s = new Set([recipeId]);
  for (const st of r.steps) {
    for (const x of [st.item, ...(st.items || []), ...(st.layers || [])]) if (typeof x === 'string' && !x.startsWith('$') && WORD[x]) s.add(x);
  }
  for (const opts of Object.values(r.vary)) for (const o of opts) if (typeof o === 'string' && WORD[o]) s.add(o);
  return [...s];
}
