// Simple in-memory database for registered users
let registeredUsers = [];

export function addUser(userData) {
  const user = {
    id: Date.now().toString(),
    email: userData.email,
    tradeType: userData.tradeType,
    businessName: userData.businessName,
    phone: userData.phone,
    location: userData.location,
    status: 'pending',
    registeredAt: new Date().toISOString()
  };
  
  registeredUsers.push(user);
  return user;
}

export function findUserByEmail(email) {
  return registeredUsers.find(user => user.email === email);
}

export function getAllUsers() {
  return registeredUsers;
} 