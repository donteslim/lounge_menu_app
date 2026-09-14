const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function seedData() {
  const now = Date.now();
  return {
    sections: [
      {
        id: 's1',
        name: 'Champagnes',
        description: 'A refined selection of champagnes and sparkling wines.',
        imageUrl: null,
        order: 1,
        createdAt: now,
      },
      {
        id: 's2',
        name: 'Beers',
        description: 'Local and imported beers, on tap and bottled.',
        imageUrl: null,
        order: 2,
        createdAt: now,
      },
      {
        id: 's3',
        name: 'Food',
        description: 'Small plates and bar bites to accompany your drinks.',
        imageUrl: null,
        order: 3,
        createdAt: now,
      },
      {
        id: 's4',
        name: 'Soft Drinks',
        description: 'Non-alcoholic beverages, sodas, and mixers.',
        imageUrl: null,
        order: 4,
        createdAt: now,
      },
    ],
    products: [
      {
        id: 'p1',
        sectionId: 's1',
        name: 'Moet & Chandon Brut Imperial',
        mainPrice: 120,
        discountPrice: 95,
        description: 'Classic French champagne with notes of green apple and brioche.',
        imageUrl: null,
        order: 1,
      },
      {
        id: 'p2',
        sectionId: 's1',
        name: 'Veuve Clicquot Rose',
        mainPrice: 150,
        discountPrice: null,
        description: 'Elegant rose champagne with red berry notes.',
        imageUrl: null,
        order: 2,
      },
      {
        id: 'p3',
        sectionId: 's2',
        name: 'Heineken',
        mainPrice: 8,
        discountPrice: null,
        description: 'Crisp imported lager, served ice cold.',
        imageUrl: null,
        order: 1,
      },
      {
        id: 'p4',
        sectionId: 's3',
        name: 'Loaded Nachos',
        mainPrice: 14,
        discountPrice: 10,
        description: 'Corn tortilla chips with cheese, jalapenos, salsa, and sour cream.',
        imageUrl: null,
        order: 1,
      },
      {
        id: 'p5',
        sectionId: 's4',
        name: 'Coca-Cola',
        mainPrice: 4,
        discountPrice: null,
        description: 'Classic Coca-Cola, served chilled.',
        imageUrl: null,
        order: 1,
      },
    ],
    admins: [
      {
        id: 'admin1',
        username: 'admin',
        passwordHash: bcrypt.hashSync('ChangeMe123!', 10),
        createdAt: now,
      },
    ],
  };
}

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(seedData(), null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readDb, writeDb, ensureDb };
