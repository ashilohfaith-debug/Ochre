export const DEVELOPER_COLORS = [
  { name: 'Blue', hex: '#3b82f6', borderHex: '#1d4ed8' },
  { name: 'Green', hex: '#22c55e', borderHex: '#15803d' },
  { name: 'Orange', hex: '#f97316', borderHex: '#c2410c' },
  { name: 'Purple', hex: '#a855f7', borderHex: '#7e22ce' },
  { name: 'Teal', hex: '#14b8a6', borderHex: '#0f766e' },
  { name: 'Pink', hex: '#ec4899', borderHex: '#be185d' }
];

export const PRESET_USERS = [
  { name: 'Alice', color: '#3b82f6' },
  { name: 'Bob', color: '#22c55e' },
  { name: 'Charlie', color: '#f97316' },
  { name: 'Diana', color: '#a855f7' },
  { name: 'Ethan', color: '#14b8a6' }
];

export function getRandomUser() {
  const index = Math.floor(Math.random() * PRESET_USERS.length);
  return PRESET_USERS[index];
}
