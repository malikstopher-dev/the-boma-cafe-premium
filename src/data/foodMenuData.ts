export interface FoodMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags?: string[];
  isFeatured?: boolean;
  image?: string;
}

export interface FoodMenuCategory {
  id: string;
  name: string;
  description?: string;
  items: FoodMenuItem[];
}

export const STATIC_FOOD_MENU: FoodMenuCategory[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    description: 'Start your day with our hearty breakfast selection',
    items: [
      { id: 'bf-1', name: 'The Boma Breakfast', description: 'Two eggs, bacon, sausage, grilled tomato, toast & your choice of beverage', price: 95, category: 'Breakfast', tags: ['Popular'], isFeatured: true },
      { id: 'bf-2', name: 'French Toast', description: 'Thick-cut brioche, cinnamon, maple syrup, fresh berries', price: 85, category: 'Breakfast', tags: ['Vegetarian'] },
      { id: 'bf-3', name: 'Eggs Benedict', description: 'Poached eggs, smoked ham, hollandaise on toasted muffin', price: 110, category: 'Breakfast', tags: ['Chef Pick'] },
      { id: 'bf-4', name: 'Granola Bowl', description: 'House-made granola, yogurt, fresh fruit, honey drizzle', price: 75, category: 'Breakfast', tags: ['Vegetarian'] },
    ],
  },
  {
    id: 'starters',
    name: 'Starters',
    description: 'Light bites to begin your meal',
    items: [
      { id: 'st-1', name: 'Peri-Peri Chicken Wings', description: 'Grilled to perfection, served with blue cheese dip', price: 85, category: 'Starters', tags: ['Popular', 'Spicy'] },
      { id: 'st-2', name: 'Calamari Rings', description: 'Lightly battered, served with lemon & aioli', price: 75, category: 'Starters' },
      { id: 'st-3', name: 'Springbok Carpaccio', description: 'Thinly sliced, rocket, parmesan, balsamic reduction', price: 95, category: 'Starters', tags: ['Chef Pick'] },
      { id: 'st-4', name: 'Loaded Nachos', description: 'Tortilla chips, melted cheese, salsa, sour cream, guacamole', price: 90, category: 'Starters', tags: ['Vegetarian'] },
    ],
  },
  {
    id: 'burgers',
    name: 'Burgers',
    description: 'Hand-crafted burgers served with fries',
    items: [
      { id: 'bg-1', name: 'Classic Beef Burger', description: 'Angus patty, cheddar, caramelized onions, fresh tomato & house sauce', price: 165, category: 'Burgers', tags: ['Popular'], isFeatured: true },
      { id: 'bg-2', name: 'BBQ Bacon Burger', description: 'Beef patty, crispy bacon, cheddar, onion rings, BBQ sauce', price: 185, category: 'Burgers' },
      { id: 'bg-3', name: 'Mushroom Swiss Burger', description: 'Grilled portobello, Swiss cheese, garlic aioli, rocket', price: 145, category: 'Burgers', tags: ['Vegetarian'] },
      { id: 'bg-4', name: 'Boma Stack Burger', description: 'Double beef patty, all the trimmings, secret sauce', price: 195, category: 'Burgers', tags: ['Chef Pick'] },
    ],
  },
  {
    id: 'pizza',
    name: 'Wood-Fired Pizza',
    description: 'Hand-stretched, wood-fired perfection',
    items: [
      { id: 'pz-1', name: 'BBQ Chicken Pizza', description: 'Grilled chicken, red onions, cilantro on smoky BBQ base', price: 180, category: 'Wood-Fired Pizza', tags: ['Popular'], isFeatured: true },
      { id: 'pz-2', name: 'Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 145, category: 'Wood-Fired Pizza', tags: ['Vegetarian'] },
      { id: 'pz-3', name: 'Mama\u2019s Special', description: 'Pepperoni, mushroom, green pepper, olives', price: 165, category: 'Wood-Fired Pizza' },
      { id: 'pz-4', name: 'Truffle Mushroom', description: 'Wild mushrooms, truffle oil, mozzarella, parmesan', price: 190, category: 'Wood-Fired Pizza', tags: ['Chef Pick'] },
    ],
  },
  {
    id: 'flame-grilled',
    name: 'Flame-Grilled',
    description: 'Sizzling perfection from our open flame',
    items: [
      { id: 'fg-1', name: 'Flame-Grilled Ribs', description: 'Succulent pork ribs with our signature BBQ basting', price: 250, category: 'Flame-Grilled', tags: ['Popular'], isFeatured: true },
      { id: 'fg-2', name: 'Rump Steak', description: '250g prime rump, grilled to order, with seasonal veg', price: 195, category: 'Flame-Grilled' },
      { id: 'fg-3', name: 'Grilled Chicken Peri-Peri', description: 'Half chicken marinated in fiery peri-peri sauce', price: 165, category: 'Flame-Grilled', tags: ['Spicy'] },
      { id: 'fg-4', name: 'Lamb Chops', description: 'Herb-crusted lamb loin chops, mint jus', price: 220, category: 'Flame-Grilled', tags: ['Chef Pick'] },
    ],
  },
  {
    id: 'curries',
    name: 'Curries & Bunnies',
    description: 'Rich, aromatic South African favourites',
    items: [
      { id: 'cr-1', name: 'Lamb Bunny Chow', description: 'Slow-cooked lamb in aromatic spices served in a fresh bread bowl', price: 120, category: 'Curries & Bunnies', tags: ['Popular'], isFeatured: true },
      { id: 'cr-2', name: 'Chicken Curry', description: 'Tender chicken in a mild curry sauce with rice', price: 135, category: 'Curries & Bunnies' },
      { id: 'cr-3', name: 'Vegetable Bunny Chow', description: 'Seasonal vegetables in a fragrant curry sauce', price: 110, category: 'Curries & Bunnies', tags: ['Vegetarian'] },
      { id: 'cr-4', name: 'Beef Curry', description: 'Slow-braised beef in rich masala gravy', price: 145, category: 'Curries & Bunnies' },
    ],
  },
  {
    id: 'platters',
    name: 'Platters',
    description: 'Perfect for sharing — generous portions',
    items: [
      { id: 'pl-1', name: 'Boma Hungry Mix Platter', description: 'Calamari, wings, ribs, chips & dipping sauces', price: 295, category: 'Platters', tags: ['Chef Pick'] },
      { id: 'pl-2', name: 'Seafood Platter', description: 'Grilled fish, prawns, calamari, with lemon butter', price: 320, category: 'Platters' },
      { id: 'pl-3', name: 'Meat Lovers Platter', description: 'Steak, wors, ribs, chicken — feeds 2-3', price: 350, category: 'Platters', tags: ['Popular'] },
    ],
  },
  {
    id: 'desserts',
    name: 'Desserts',
    description: 'Sweet endings to your meal',
    items: [
      { id: 'ds-1', name: 'Malva Pudding', description: 'Warm, sticky, served with vanilla custard', price: 75, category: 'Desserts', tags: ['Popular'] },
      { id: 'ds-2', name: 'Chocolate Fondant', description: 'Rich molten chocolate with ice cream', price: 85, category: 'Desserts', tags: ['Chef Pick'] },
      { id: 'ds-3', name: 'Amarula Creme Brulee', description: 'Classic brulee with Amarula liqueur', price: 80, category: 'Desserts' },
    ],
  },
  {
    id: 'kids',
    name: 'Kids',
    description: 'Delicious meals for the little ones',
    items: [
      { id: 'kd-1', name: 'Kids Burger', description: 'Mini beef burger with fries', price: 65, category: 'Kids' },
      { id: 'kd-2', name: 'Chicken Strips', description: 'Crumbed chicken strips with chips', price: 60, category: 'Kids' },
      { id: 'kd-3', name: 'Mini Pizza', description: 'Cheese or pepperoni, child-sized', price: 55, category: 'Kids' },
      { id: 'kd-4', name: 'Fish & Chips', description: 'Lightly battered hake with fries', price: 65, category: 'Kids' },
    ],
  },
];

export const STATIC_FOOD_CATEGORIES = STATIC_FOOD_MENU.map((cat, i) => ({
  id: cat.id,
  name: cat.name,
  description: cat.description,
  isActive: true,
  order: i,
}));

export function getStaticFoodMenuItems() {
  return STATIC_FOOD_MENU.flatMap(cat => cat.items);
}
