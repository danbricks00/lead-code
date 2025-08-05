// Simple in-memory database for tradesmen
let tradesmen = [];

export function addTradesman(tradesman) {
  tradesmen.push(tradesman);
  return tradesman;
}

export function getTradesmanByEmail(email) {
  return tradesmen.find(t => t.email === email);
}

export function getAllTradesmen() {
  return tradesmen;
}

export function updateTradesman(email, updates) {
  const index = tradesmen.findIndex(t => t.email === email);
  if (index !== -1) {
    tradesmen[index] = { ...tradesmen[index], ...updates };
    return tradesmen[index];
  }
  return null;
} 