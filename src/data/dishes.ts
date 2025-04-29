export interface Dish {
  name: string;
  ingredients: string[];
  acceptableGuesses: string[];
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
    acceptableGuesses: ["caprese", "caprese salad"],
    country: "Italy",
    blurb: "A simple but iconic dish from the island of Capri.",
    imageUrl: "/images/caprese.jpg",
    coordinates: { lat: 41.9028, lng: 12.4964 },
    region: "Southern Europe",
  },
  {
    name: "Shakshuka",
    ingredients: ["Tomato", "Eggs", "Onion", "Garlic", "Paprika"],
    acceptableGuesses: ["shakshuka"],
    country: "Israel",
    blurb: "A North African-origin dish popular across the Middle East.",
    imageUrl: "/images/shakshuka.jpg",
    coordinates: { lat: 31.7683, lng: 35.2137 },
    region: "Middle East",
  },
  {
    name: "Pizza",
    ingredients: ["Tomato", "Mozzarella", "Pizza Dough", "Olive Oil", "Salt"],
    acceptableGuesses: ["pizza"],
    country: "Italy",
    blurb: "A popular dish from the Italian city of Naples.",
    imageUrl: "/images/pizza.jpg",
    coordinates: { lat: 40.8518, lng: 14.2681 },
    region: "Southern Europe",
  },
  {
    name: "Pasta Carbonara",
    ingredients: ["Pasta", "Eggs", "Parmesan", "Pancetta", "Garlic"],
    acceptableGuesses: ["carbonara"],
    country: "Italy",
    blurb: "A creamy pasta dish with a rich, creamy sauce.",
    imageUrl: "/images/carbonara.jpg",
    coordinates: { lat: 41.9028, lng: 12.4964 },
    region: "Southern Europe",
  },
  {
    name: "Ramen",
    ingredients: [
      "Ramen Noodles",
      "Eggs",
      "Onion",
      "Garlic",
      "Pork",
      "Miso",
      "Soy Sauce",
    ],
    acceptableGuesses: [
      "ramen",
      "ramen noodles",
      "ramen soup",
      "ramen noodles soup",
    ],
    country: "Japan",
    blurb: "A popular noodle dish from Japan.",
    imageUrl: "/images/ramen.jpg",
    coordinates: { lat: 35.6812, lng: 139.7671 },
    region: "Eastern Asia",
  },
];

// Helper function to get a random dish
export function getRandomDish(): Dish {
  return dishes[Math.floor(Math.random() * dishes.length)];
}
