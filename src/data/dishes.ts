export interface Dish {
  name: string;
  ingredients: string[];
  country: string;
  blurb: string;
  imageUrl: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  region?: string;
}

export const dishes: Dish[] = [
  {
    name: "Caprese Salad",
    ingredients: ["Tomato", "Mozzarella", "Basil", "Olive Oil", "Salt"],
    country: "Italy",
    blurb: "A simple but iconic dish from the island of Capri.",
    imageUrl: "/images/caprese.jpg",
    coordinates: { lat: 41.9028, lng: 12.4964 },
    region: "Southern Europe"
  },
  {
    name: "Shakshuka",
    ingredients: ["Tomato", "Eggs", "Onion", "Garlic", "Paprika"],
    country: "Israel",
    blurb: "A North African-origin dish popular across the Middle East.",
    imageUrl: "/images/shakshuka.jpg",
    coordinates: { lat: 31.7683, lng: 35.2137 },
    region: "Middle East"
  },
  // Add more dishes here
];

// Helper function to get a random dish
export function getRandomDish(): Dish {
  return dishes[Math.floor(Math.random() * dishes.length)];
}
