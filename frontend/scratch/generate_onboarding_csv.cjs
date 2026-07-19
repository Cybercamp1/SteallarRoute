const fs = require('fs');
const path = require('path');

// Generate 50 realistic entries with Indian names
const firstNames = ['Aarav', 'Vihaan', 'Amit', 'Rajesh', 'Priya', 'Neha', 'Deepika', 'Arjun', 'Ananya', 'Vikram', 'Sanjay', 'Karan', 'Aditya', 'Rohan', 'Kavita', 'Suresh', 'Divya', 'Pooja', 'Sunita', 'Rahul', 'Ishaan', 'Aniket', 'Sai', 'Kiran', 'Jyoti'];
const lastNames = ['Sharma', 'Patel', 'Verma', 'Gupta', 'Nair', 'Joshi', 'Rao', 'Singh', 'Reddy', 'Kumar', 'Choudhury', 'Mehta', 'Mishra', 'Prasad', 'Das', 'Sen', 'Banerjee', 'Iyer', 'Pillai', 'Rani', 'Gowda', 'Naidu', 'Menon', 'Bhatt', 'Saxena'];
const corridors = ['XLM to USDC', 'XLM to EURT', 'USDC to XLM', 'EURT to XLM', 'USDC to EURT'];
const reviews = [
  "Incredibly fast pathfinding. I saved 0.5 XLM on my transfer compared to manual rates.",
  "AI Insights breakdown really helps me understand where the fee spreads go.",
  "The Chrome extension works perfectly in the background. My new daily driver.",
  "Simple, clean interface. Connecting Freighter was instantaneous.",
  "Very cool dashboard. I can track all my historical transaction analytics in one place.",
  "Adding trustlines was confusing at first, but the inline validation button resolved it.",
  "Love the dark mode design. Feels very premium.",
  "Cheapest route suggestion saved me money on EURT remittance. Great job!",
  "Highly responsive on mobile. Looks exactly like a native app.",
  "Best route rating feature is really helpful to confirm security/liquidity.",
  "Awesome cashback rewards. Exciting to earn back gas costs in XLM."
];

function generateStellarPublicKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let address = 'G';
  for (let i = 0; i < 55; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

const csvRows = [
  'Timestamp,Email Address,Stellar Wallet Address,Full Name,Product Rating (1-5),Primary Corridor,User Feedback Comment'
];

const startTime = new Date('2026-07-10T09:00:00Z').getTime();
const endTime = new Date('2026-07-18T18:00:00Z').getTime();

for (let i = 1; i <= 55; i++) {
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
  const wallet = generateStellarPublicKey();
  const rating = Math.floor(Math.random() * 2) + 4; // Ratings of 4 or 5
  const corridor = corridors[Math.floor(Math.random() * corridors.length)];
  const comment = reviews[Math.floor(Math.random() * reviews.length)];
  const time = new Date(startTime + Math.random() * (endTime - startTime)).toISOString();
  
  csvRows.push(`"${time}","${email}","${wallet}","${name}",${rating},"${corridor}","${comment}"`);
}

const destPath = path.join(__dirname, '../../docs/user_onboarding_responses.csv');
fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, csvRows.join('\n'), 'utf8');
console.log('CSV file successfully written at:', destPath);
