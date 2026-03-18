export type Category = 'Grocery' | 'Vegetables' | 'Pharmacy' | 'Snacks';

export interface Shop {
  id: string;
  vendorId?: string;
  name: string;
  address?: string;
  location?: { lat: number; lng: number } | null;
  image: string;
  rating: number;
  deliveryTime: string;
  categories: (Category | string)[];
  deliveryFee: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: Category;
  unit: string;
  deliveryTime: string;
  nutrition?: string;
  ingredients?: string;
  expiryDate?: string;
  dietary?: string[];
  isPrescriptionRequired?: boolean;
  popularity?: number;
  shopId: string;
  stock?: number;
}

export const categories = [
  { id: 'grocery', name: 'Grocery', icon: 'ShoppingBag', color: 'bg-orange-100 text-orange-600' },
  { id: 'vegetables', name: 'Vegetables', icon: 'Carrot', color: 'bg-green-100 text-green-600' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'Pill', color: 'bg-blue-100 text-blue-600' },
  { id: 'snacks', name: 'Snacks', icon: 'Cookie', color: 'bg-yellow-100 text-yellow-600' },
];

export const shops: Shop[] = [
  {
    id: 'shop1',
    name: 'Gupta Provisions',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    deliveryTime: '15 mins',
    categories: ['Grocery', 'Vegetables', 'Snacks'],
    deliveryFee: 2.00,
  },
  {
    id: 'shop2',
    name: 'City Supermarket',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400',
    rating: 4.5,
    deliveryTime: '20 mins',
    categories: ['Grocery', 'Snacks'],
    deliveryFee: 3.00,
  },
  {
    id: 'shop3',
    name: 'Apollo Pharmacy',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    deliveryTime: '10 mins',
    categories: ['Pharmacy'],
    deliveryFee: 1.50,
  },
  {
    id: 'shop4',
    name: 'Fresh Farm Veggies',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    rating: 4.7,
    deliveryTime: '12 mins',
    categories: ['Vegetables'],
    deliveryFee: 1.00,
  }
];

export const products: Product[] = [
  // Vegetables
  {
    id: 'v1',
    name: 'Fresh Tomatoes',
    price: 2.5,
    originalPrice: 3.0,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400'
    ],
    category: 'Vegetables',
    unit: '1 kg',
    deliveryTime: '10 mins',
    nutrition: 'Calories: 18, Carbs: 3.9g, Protein: 0.9g',
    ingredients: '100% Fresh Tomatoes',
    expiryDate: '3 Days',
    dietary: ['Vegan', 'Organic'],
    popularity: 95,
    shopId: 'shop4',
    stock: 50,
  },
  {
    id: 'v2',
    name: 'Onions',
    price: 1.8,
    image: 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?auto=format&fit=crop&q=80&w=400',
    category: 'Vegetables',
    unit: '1 kg',
    deliveryTime: '10 mins',
    nutrition: 'Calories: 40, Carbs: 9g, Protein: 1.1g',
    ingredients: '100% Fresh Onions',
    expiryDate: '2 Weeks',
    dietary: ['Vegan', 'Organic'],
    popularity: 88,
    shopId: 'shop4',
    stock: 100,
  },
  {
    id: 'v3',
    name: 'Potatoes',
    price: 2.0,
    originalPrice: 2.5,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400',
    category: 'Vegetables',
    unit: '1 kg',
    deliveryTime: '10 mins',
    nutrition: 'Calories: 77, Carbs: 17g, Protein: 2g',
    ingredients: '100% Fresh Potatoes',
    expiryDate: '2 Weeks',
    dietary: ['Vegan', 'Organic'],
    popularity: 92,
    shopId: 'shop1',
    stock: 80,
  },
  
  // Grocery
  {
    id: 'g1',
    name: 'Whole Wheat Bread',
    price: 3.5,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    category: 'Grocery',
    unit: '1 loaf',
    deliveryTime: '15 mins',
    nutrition: 'Calories: 247, Carbs: 41g, Protein: 13g',
    ingredients: 'Whole wheat flour, water, yeast, salt',
    expiryDate: '5 Days',
    dietary: ['Vegan'],
    popularity: 90,
    shopId: 'shop1',
    stock: 20,
  },
  {
    id: 'g2',
    name: 'Organic Milk',
    price: 4.0,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
    category: 'Grocery',
    unit: '1 L',
    deliveryTime: '15 mins',
    nutrition: 'Calories: 146, Carbs: 11g, Protein: 8g',
    ingredients: '100% Organic Cow Milk',
    expiryDate: '7 Days',
    dietary: ['Organic'],
    popularity: 98,
    shopId: 'shop2',
    stock: 30,
  },
  {
    id: 'g3',
    name: 'Basmati Rice',
    price: 8.5,
    originalPrice: 10.0,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400',
    category: 'Grocery',
    unit: '5 kg',
    deliveryTime: '20 mins',
    nutrition: 'Calories: 130, Carbs: 28g, Protein: 2.7g',
    ingredients: '100% Basmati Rice',
    expiryDate: '1 Year',
    dietary: ['Vegan', 'Gluten-Free'],
    popularity: 85,
    shopId: 'shop2',
    stock: 15,
  },

  // Pharmacy
  {
    id: 'p1',
    name: 'Paracetamol 500mg',
    price: 5.0,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    category: 'Pharmacy',
    unit: '10 tablets',
    deliveryTime: '10 mins',
    nutrition: 'N/A',
    ingredients: 'Paracetamol 500mg',
    expiryDate: '2 Years',
    isPrescriptionRequired: true,
    popularity: 99,
    shopId: 'shop3',
    stock: 200,
  },
  {
    id: 'p2',
    name: 'First Aid Kit',
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400',
    category: 'Pharmacy',
    unit: '1 kit',
    deliveryTime: '15 mins',
    popularity: 70,
    shopId: 'shop3',
    stock: 10,
  },
  {
    id: 'p3',
    name: 'Vitamin C Supplements',
    price: 12.0,
    originalPrice: 15.0,
    image: 'https://images.unsplash.com/photo-1550572017-edb3f8e02d66?auto=format&fit=crop&q=80&w=400',
    category: 'Pharmacy',
    unit: '60 gummies',
    deliveryTime: '15 mins',
    nutrition: 'Vitamin C: 250mg per gummy',
    ingredients: 'Ascorbic acid, sugar, gelatin',
    expiryDate: '1 Year',
    dietary: ['Gluten-Free'],
    popularity: 80,
    shopId: 'shop3',
    stock: 45,
  },

  // Snacks
  {
    id: 's1',
    name: 'Potato Chips',
    price: 2.0,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400',
    category: 'Snacks',
    unit: '150g',
    deliveryTime: '10 mins',
    nutrition: 'Calories: 536, Carbs: 53g, Protein: 7g',
    ingredients: 'Potatoes, Vegetable Oil, Salt',
    expiryDate: '6 Months',
    dietary: ['Vegan', 'Gluten-Free'],
    popularity: 96,
    shopId: 'shop1',
    stock: 120,
  },
  {
    id: 's2',
    name: 'Chocolate Bar',
    price: 1.5,
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=400',
    category: 'Snacks',
    unit: '50g',
    deliveryTime: '10 mins',
    nutrition: 'Calories: 546, Carbs: 61g, Protein: 4.9g',
    ingredients: 'Sugar, Cocoa Butter, Milk, Cocoa Mass',
    expiryDate: '1 Year',
    dietary: ['Gluten-Free'],
    popularity: 94,
    shopId: 'shop2',
    stock: 60,
  },
];
