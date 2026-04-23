import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const products = [
  // Beverages
  { name: 'Milo Powder 400g', description: 'Delicious chocolate malt drink powder', price: '15.99', stock: 50, image: 'https://via.placeholder.com/300?text=Milo+400g' },
  { name: 'Coca Cola 500ml', description: 'Refreshing cola beverage', price: '3.50', stock: 100, image: 'https://via.placeholder.com/300?text=Coca+Cola' },
  { name: 'Fanta Orange 500ml', description: 'Fruity orange flavored drink', price: '3.00', stock: 80, image: 'https://via.placeholder.com/300?text=Fanta+Orange' },
  { name: 'Sprite 500ml', description: 'Lemon-lime flavored soft drink', price: '3.50', stock: 75, image: 'https://via.placeholder.com/300?text=Sprite' },
  { name: 'Water Pure 1.5L', description: 'Pure drinking water', price: '2.50', stock: 200, image: 'https://via.placeholder.com/300?text=Pure+Water' },
  { name: 'Orange Juice 1L', description: 'Fresh orange juice', price: '8.99', stock: 40, image: 'https://via.placeholder.com/300?text=Orange+Juice' },
  
  // Tea & Coffee
  { name: 'Tea Bags 50 Pack', description: 'Black tea bags for brewing', price: '5.99', stock: 60, image: 'https://via.placeholder.com/300?text=Tea+Bags' },
  { name: 'Nescafe Coffee 100g', description: 'Instant coffee powder', price: '12.50', stock: 45, image: 'https://via.placeholder.com/300?text=Nescafe+Coffee' },
  { name: 'Lipton Tea 25 Bags', description: 'Premium quality tea bags', price: '4.50', stock: 55, image: 'https://via.placeholder.com/300?text=Lipton+Tea' },
  
  // Bread & Bakery
  { name: 'White Bread Loaf', description: 'Fresh white bread loaf', price: '3.99', stock: 30, image: 'https://via.placeholder.com/300?text=White+Bread' },
  { name: 'Brown Bread Loaf', description: 'Whole wheat brown bread', price: '4.50', stock: 25, image: 'https://via.placeholder.com/300?text=Brown+Bread' },
  { name: 'Croissants 4 Pack', description: 'Buttery croissants', price: '6.99', stock: 20, image: 'https://via.placeholder.com/300?text=Croissants' },
  { name: 'Biscuits 200g', description: 'Crispy digestive biscuits', price: '2.99', stock: 80, image: 'https://via.placeholder.com/300?text=Biscuits' },
  
  // Soaps & Personal Care
  { name: 'Lux Soap Bar', description: 'Premium beauty soap', price: '1.50', stock: 150, image: 'https://via.placeholder.com/300?text=Lux+Soap' },
  { name: 'Dettol Soap 100g', description: 'Antibacterial soap', price: '2.00', stock: 120, image: 'https://via.placeholder.com/300?text=Dettol+Soap' },
  { name: 'Shampoo 250ml', description: 'Hair shampoo for all hair types', price: '5.99', stock: 50, image: 'https://via.placeholder.com/300?text=Shampoo' },
  { name: 'Pomade Hair Gel 100ml', description: 'Strong hold hair pomade', price: '4.99', stock: 60, image: 'https://via.placeholder.com/300?text=Pomade' },
  { name: 'Toothpaste 100ml', description: 'Fluoride toothpaste', price: '2.50', stock: 100, image: 'https://via.placeholder.com/300?text=Toothpaste' },
  
  // Household Items
  { name: 'Detergent Powder 1kg', description: 'Laundry detergent powder', price: '6.99', stock: 70, image: 'https://via.placeholder.com/300?text=Detergent' },
  { name: 'Dish Soap 500ml', description: 'Liquid dish washing soap', price: '3.50', stock: 80, image: 'https://via.placeholder.com/300?text=Dish+Soap' },
  { name: 'Toilet Paper Roll 4 Pack', description: 'Soft toilet paper rolls', price: '5.50', stock: 100, image: 'https://via.placeholder.com/300?text=Toilet+Paper' },
  
  // Snacks
  { name: 'Chips 50g', description: 'Crispy potato chips', price: '1.99', stock: 150, image: 'https://via.placeholder.com/300?text=Chips' },
  { name: 'Chocolate Bar 50g', description: 'Milk chocolate bar', price: '2.50', stock: 100, image: 'https://via.placeholder.com/300?text=Chocolate' },
  { name: 'Peanuts 200g', description: 'Roasted salted peanuts', price: '3.99', stock: 60, image: 'https://via.placeholder.com/300?text=Peanuts' },
  { name: 'Biscuit Tin 400g', description: 'Assorted biscuits tin', price: '7.99', stock: 40, image: 'https://via.placeholder.com/300?text=Biscuit+Tin' },
  
  // Cooking Essentials
  { name: 'Cooking Oil 1L', description: 'Pure vegetable cooking oil', price: '8.50', stock: 50, image: 'https://via.placeholder.com/300?text=Cooking+Oil' },
  { name: 'Salt 500g', description: 'Table salt', price: '1.50', stock: 100, image: 'https://via.placeholder.com/300?text=Salt' },
  { name: 'Sugar 1kg', description: 'White granulated sugar', price: '3.50', stock: 80, image: 'https://via.placeholder.com/300?text=Sugar' },
  { name: 'Flour 2kg', description: 'All-purpose wheat flour', price: '4.99', stock: 60, image: 'https://via.placeholder.com/300?text=Flour' },
  
  // Drinks & Juices
  { name: 'Tropika Juice 1L', description: 'Mixed fruit juice', price: '6.99', stock: 45, image: 'https://via.placeholder.com/300?text=Tropika+Juice' },
  { name: 'Energy Drink 250ml', description: 'Power energy drink', price: '4.50', stock: 70, image: 'https://via.placeholder.com/300?text=Energy+Drink' },
  { name: 'Yogurt 500ml', description: 'Plain yogurt', price: '5.99', stock: 50, image: 'https://via.placeholder.com/300?text=Yogurt' },
  
  // Containers & Flasks
  { name: 'Vacuum Flask 1L', description: 'Stainless steel vacuum flask', price: '24.99', stock: 20, image: 'https://via.placeholder.com/300?text=Vacuum+Flask' },
  { name: 'Water Bottle 500ml', description: 'Plastic water bottle', price: '3.99', stock: 100, image: 'https://via.placeholder.com/300?text=Water+Bottle' },
];

async function seedProducts() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🌱 Seeding products...');
    
    for (const product of products) {
      await connection.execute(
        'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.stock, product.image]
      );
    }
    
    console.log(`✅ Successfully added ${products.length} products to the database!`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
