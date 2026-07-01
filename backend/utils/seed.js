/**
 * Seed script — populates the database with an admin account and sample products.
 * Run with: npm run seed
 */
require('dotenv').config();
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Paracetamol 500mg Tablets (100 Pack)',
    description:
      'Fast-acting pain and fever relief. Each tablet contains 500mg of Paracetamol, suitable for headaches, muscle aches, colds, and fever reduction. Pack of 100 tablets.',
    shortDescription: 'Pain & fever relief, pack of 100',
    category: 'Pain Relief',
    brand: 'Emzor',
    price: 1200,
    discountPrice: 950,
    stock: 250,
    requiresPrescription: false,
    dosageInfo: 'Adults: 1-2 tablets every 4-6 hours. Do not exceed 8 tablets in 24 hours.',
    manufacturer: 'Emzor Pharmaceuticals',
    image: '/images/products/paracetamol.png'
  },
  {
    name: 'Amoxicillin 500mg Capsules (21 Pack)',
    description:
      'Broad-spectrum antibiotic used to treat a wide range of bacterial infections. Requires a valid prescription. Pack of 21 capsules.',
    shortDescription: 'Broad-spectrum antibiotic (Rx required)',
    category: 'Antibiotics',
    brand: 'GSK',
    price: 2500,
    stock: 80,
    requiresPrescription: true,
    dosageInfo: 'As prescribed by your physician. Typically 1 capsule every 8 hours for 5-7 days.',
    manufacturer: 'GlaxoSmithKline',
    image: '/images/products/amoxicillin.png'
  },
  {
    name: 'Vitamin C 1000mg Effervescent Tablets',
    description:
      'Immune system support with high-dose Vitamin C. Effervescent orange-flavored tablets, dissolve in water. Pack of 20 tablets.',
    shortDescription: 'Immune support, orange flavor',
    category: 'Vitamins & Supplements',
    brand: 'Redoxon',
    price: 3200,
    discountPrice: 2800,
    stock: 150,
    requiresPrescription: false,
    dosageInfo: 'Dissolve 1 tablet in a glass of water once daily.',
    manufacturer: 'Bayer',
    image: '/images/products/vitamin-c.png'
  },
  {
    name: 'Digital Blood Pressure Monitor',
    description:
      'Automatic upper-arm blood pressure monitor with large LCD display, memory storage for 2 users, and irregular heartbeat detection.',
    shortDescription: 'Automatic upper-arm BP monitor',
    category: 'Medical Devices',
    brand: 'Omron',
    price: 28500,
    stock: 35,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: 'Omron Healthcare',
    image: '/images/products/bp-monitor.png'
  },
  {
    name: 'First Aid Kit - Complete Home Set (60 Pieces)',
    description:
      'Comprehensive home first aid kit including bandages, antiseptic wipes, gauze, scissors, adhesive tape, and a first aid guide booklet.',
    shortDescription: '60-piece complete home first aid kit',
    category: 'First Aid',
    brand: 'CareWell',
    price: 8500,
    discountPrice: 7200,
    stock: 60,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: 'CareWell Medical Supplies',
    image: '/images/products/first-aid-kit.png'
  },
  {
    name: 'Infant Multivitamin Drops (30ml)',
    description:
      'Daily multivitamin drops formulated for infants and toddlers to support healthy growth and development. Sugar-free formula.',
    shortDescription: 'Daily multivitamin for infants',
    category: 'Baby & Mother Care',
    brand: 'PediaSure',
    price: 4500,
    stock: 45,
    requiresPrescription: false,
    dosageInfo: 'Give 1ml daily mixed with food or formula, or as directed by pediatrician.',
    manufacturer: 'Abbott Nutrition',
    image: '/images/products/infant-vitamins.png'
  },
  {
    name: 'Glucometer Blood Sugar Test Kit',
    description:
      'Complete blood glucose monitoring kit including meter, 25 test strips, lancets, and carrying case. Results in 5 seconds.',
    shortDescription: 'Blood glucose monitoring kit',
    category: 'Diabetes Care',
    brand: 'Accu-Chek',
    price: 15000,
    discountPrice: 12500,
    stock: 40,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: 'Roche Diabetes Care',
    image: '/images/products/glucometer.png'
  },
  {
    name: 'Hydrating Face & Body Lotion (400ml)',
    description:
      'Dermatologist-tested moisturizing lotion for dry and sensitive skin. Fragrance-free, non-greasy formula suitable for daily use.',
    shortDescription: 'Dermatologist-tested moisturizer',
    category: 'Skin Care',
    brand: 'CeraVe',
    price: 9800,
    stock: 90,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: "L'Oréal",
    image: '/images/products/lotion.png'
  },
  {
    name: 'Cold & Flu Relief Syrup (100ml)',
    description:
      'Multi-symptom relief for cough, cold, and flu. Soothes sore throat, reduces fever, and relieves nasal congestion.',
    shortDescription: 'Multi-symptom cold & flu relief',
    category: 'Cold & Flu',
    brand: 'Benylin',
    price: 1800,
    stock: 120,
    requiresPrescription: false,
    dosageInfo: 'Adults: 10ml every 6 hours. Do not exceed 4 doses in 24 hours.',
    manufacturer: 'Johnson & Johnson',
    image: '/images/products/cold-syrup.png'
  },
  {
    name: 'N95 Respirator Face Masks (Box of 20)',
    description:
      'NIOSH-approved N95 respirator masks providing 95% filtration efficiency. Individually sealed for hygiene. Box of 20.',
    shortDescription: 'NIOSH-approved respirator masks',
    category: 'Personal Care',
    brand: '3M',
    price: 6500,
    stock: 200,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: '3M Healthcare',
    image: '/images/products/n95-masks.png'
  },
  {
    name: 'Omega-3 Fish Oil Softgels (90 Capsules)',
    description:
      'High-potency omega-3 fish oil supporting heart, brain, and joint health. 1000mg per softgel, molecularly distilled for purity.',
    shortDescription: 'Heart & brain health supplement',
    category: 'Heart & Blood Pressure',
    brand: "Nature's Bounty",
    price: 7200,
    discountPrice: 6000,
    stock: 75,
    requiresPrescription: false,
    dosageInfo: 'Take 1 softgel daily with food.',
    manufacturer: "Nature's Bounty Co.",
    image: '/images/products/omega-3.png'
  },
  {
    name: 'Antiseptic Hand Sanitizer Gel (500ml Pump)',
    description:
      '70% alcohol-based hand sanitizer gel that kills 99.9% of germs without water. Enriched with aloe vera to prevent dryness.',
    shortDescription: '70% alcohol hand sanitizer, 500ml',
    category: 'Personal Care',
    brand: 'Dettol',
    price: 2200,
    stock: 300,
    requiresPrescription: false,
    dosageInfo: '',
    manufacturer: 'Reckitt Benckiser',
    image: '/images/products/sanitizer.png'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // --- Seed admin user ---
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@christantusmedical.com').toLowerCase();
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',
        role: 'admin'
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
    }

    // --- Seed products (only if none exist yet) ---
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      // insertMany() skips Mongoose's pre('save') hooks, so we generate
      // slug + sku manually here instead of relying on the model hook.
      const productsWithCreator = sampleProducts.map((p) => {
        const slug =
          p.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
          '-' +
          Math.random().toString(36).substring(2, 7);
        const sku = 'CMC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

        return { ...p, slug, sku, createdBy: admin._id };
      });
      await Product.insertMany(productsWithCreator);
      console.log(`✅ Seeded ${sampleProducts.length} sample products.`);
    } else {
      console.log(`ℹ️  Products already exist (${productCount} found). Skipping product seed.`);
    }

    console.log('🎉 Database seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
