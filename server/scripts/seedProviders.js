// Migration: Seed MongoDB providers collection from road-rescuepd/mumbai_providers.json
// Run: node server/scripts/seedProviders.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/road-rescue';
const DATA_PATH = path.join(__dirname, '../../road-rescuepd/mumbai_providers.json');

const scrapedData = require(DATA_PATH);

// Normalize service names to match frontend expectations
const toServiceTag = (rawService) => {
  const s = rawService.toLowerCase().replace(/[^a-z]/g, '');
  if (s.includes('tow')) return 'Towing';
  if (s.includes('repair') || s.includes('garage') || s.includes('automotiv') || s.includes('motors')) return 'Car Repair Garages';
  if (s.includes('battery')) return 'Battery Jump';
  if (s.includes('fuel')) return 'Fuel Delivery';
  if (s.includes('tire') || s.includes('flat')) return 'Flat Tire';
  if (s.includes('lock') || s.includes('key')) return 'Lockout';
  if (s.includes('emergency') || s.includes('highway') || s.includes('rescue') || s.includes('roadside')) return 'Towing';
  return 'Towing';
};

const mumbaiCityMap = {
  chembur: 'Chembur', kurla: 'Kurla', andheri: 'Andheri',
  bandra: 'Bandra', dadar: 'Dadar', borivali: 'Borivali',
  goregaon: 'Goregaon', malad: 'Malad', juhu: 'Juhu',
  powai: 'Powai', thane: 'Thane', navi: 'Navi Mumbai',
};

async function seedProviders() {
  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB. Is mongod running?');
    console.error(err.message);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  const collection = db.collection('providers');

  // Drop existing 2dsphere index if any, then recreate
  try {
    await collection.dropIndex('location_2dsphere');
    console.log('Dropped old 2dsphere index');
  } catch {
    // No existing index — fine
  }

  // Build documents from scraped JSON
  const docs = scrapedData.map((p, idx) => {
    const rawCity = (p.city || '').toLowerCase();
    const city = mumbaiCityMap[rawCity] || p.city || 'Mumbai';
    const lat = p.coordinates?.lat;
    const lng = p.coordinates?.lng;

    return {
      name: p.name,
      phone: p.phone,
      address: p.address,
      city,
      state: 'Maharashtra',
      services: (p.services || []).map(toServiceTag),
      rating: p.rating ?? 4.0,
      isActive: true,
      source: 'scraper',
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  // Upsert by name+phone (unique enough for scraped data)
  let inserted = 0, skipped = 0;
  for (const doc of docs) {
    const existing = await collection.findOne({ name: doc.name, phone: doc.phone });
    if (existing) {
      // Update location in case it changed
      await collection.updateOne(
        { _id: existing._id },
        { $set: { location: doc.location, rating: doc.rating, services: doc.services, updatedAt: new Date() } }
      );
      skipped++;
    } else {
      await collection.insertOne(doc);
      inserted++;
    }
  }

  // Create 2dsphere index
  await collection.createIndex({ location: '2dsphere' });
  console.log('Created 2dsphere index on location field');

  // Verify index
  const indexes = await collection.indexes();
  console.log('Indexes:', indexes.map(i => i.name));

  // Verify total count
  const total = await collection.countDocuments();
  console.log(`\nDone! Total providers in DB: ${total}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${skipped}`);

  // Spot-check a few records
  const sample = await collection.find({}, { projection: { name: 1, city: 1, rating: 1, location: 1 } }).limit(3).toArray();
  console.log('\nSample records:');
  sample.forEach(p => console.log(`  - ${p.name} (${p.city}) | Rating: ${p.rating} | Loc: [${p.location.coordinates}]`));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seedProviders();
