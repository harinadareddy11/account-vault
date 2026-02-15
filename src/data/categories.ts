// src/data/categories.ts

export interface Service {
  id: string;
  name: string;
  logo: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: [string, string]; // TypeScript tuple - exactly 2 colors
  services: Service[];
}

export const categories: Category[] = [
  {
    id: 'social',
    name: 'Social Media',
    icon: '📱',
    color: '#ec4899',
    gradient: ['#ec4899', '#8b5cf6'],
    services: [
      { id: 'instagram', name: 'Instagram', logo: '📷' },
      { id: 'twitter', name: 'Twitter/X', logo: '🐦' },
      { id: 'facebook', name: 'Facebook', logo: '👥' },
      { id: 'linkedin', name: 'LinkedIn', logo: '💼' },
      { id: 'tiktok', name: 'TikTok', logo: '🎵' },
      { id: 'snapchat', name: 'Snapchat', logo: '👻' },
      { id: 'reddit', name: 'Reddit', logo: '🤖' },
      { id: 'discord', name: 'Discord', logo: '🎮' },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud & DevOps',
    icon: '☁️',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#06b6d4'],
    services: [
      { id: 'aws', name: 'AWS', logo: '🔶' },
      { id: 'azure', name: 'Azure', logo: '☁️' },
      { id: 'gcp', name: 'Google Cloud', logo: '🌩️' },
      { id: 'firebase', name: 'Firebase', logo: '🔥' },
      { id: 'vercel', name: 'Vercel', logo: '▲' },
      { id: 'netlify', name: 'Netlify', logo: '🌐' },
      { id: 'heroku', name: 'Heroku', logo: '🟣' },
      { id: 'digitalocean', name: 'DigitalOcean', logo: '🌊' },
      { id: 'railway', name: 'Railway', logo: '🚂' },
      { id: 'render', name: 'Render', logo: '🎨' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance & Banking',
    icon: '💰',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
    services: [
      { id: 'paypal', name: 'PayPal', logo: '💳' },
      { id: 'stripe', name: 'Stripe', logo: '💵' },
      { id: 'revolut', name: 'Revolut', logo: '🏦' },
      { id: 'wise', name: 'Wise', logo: '🌍' },
      { id: 'coinbase', name: 'Coinbase', logo: '₿' },
      { id: 'binance', name: 'Binance', logo: '🟡' },
      { id: 'venmo', name: 'Venmo', logo: '💸' },
      { id: 'cashapp', name: 'Cash App', logo: '💵' },
    ],
  },
  {
    id: 'coding',
    name: 'Dev Tools & APIs',
    icon: '💻',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#ef4444'],
    services: [
      { id: 'github', name: 'GitHub', logo: '🐙' },
      { id: 'gitlab', name: 'GitLab', logo: '🦊' },
      { id: 'bitbucket', name: 'Bitbucket', logo: '🪣' },
      { id: 'npm', name: 'npm', logo: '📦' },
      { id: 'docker', name: 'Docker Hub', logo: '🐳' },
      { id: 'figma', name: 'Figma', logo: '🎨' },
      { id: 'notion', name: 'Notion', logo: '📝' },
      { id: 'openai', name: 'OpenAI', logo: '🤖' },
      { id: 'anthropic', name: 'Anthropic', logo: '🧠' },
      { id: 'replicate', name: 'Replicate', logo: '🔄' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Streaming & Media',
    icon: '🎬',
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626'],
    services: [
      { id: 'netflix', name: 'Netflix', logo: '🎬' },
      { id: 'spotify', name: 'Spotify', logo: '🎵' },
      { id: 'youtube', name: 'YouTube Premium', logo: '▶️' },
      { id: 'disney', name: 'Disney+', logo: '🏰' },
      { id: 'hulu', name: 'Hulu', logo: '📺' },
      { id: 'prime', name: 'Prime Video', logo: '📦' },
      { id: 'hbo', name: 'HBO Max', logo: '🎭' },
      { id: 'apple-music', name: 'Apple Music', logo: '🍎' },
    ],
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: '📊',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#6366f1'],
    services: [
      { id: 'google', name: 'Google Workspace', logo: '🔍' },
      { id: 'microsoft', name: 'Microsoft 365', logo: '📘' },
      { id: 'slack', name: 'Slack', logo: '💬' },
      { id: 'zoom', name: 'Zoom', logo: '📹' },
      { id: 'notion', name: 'Notion', logo: '📝' },
      { id: 'trello', name: 'Trello', logo: '📋' },
      { id: 'asana', name: 'Asana', logo: '✅' },
      { id: 'monday', name: 'Monday.com', logo: '📅' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping & E-commerce',
    icon: '🛒',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    services: [
      { id: 'amazon', name: 'Amazon', logo: '📦' },
      { id: 'ebay', name: 'eBay', logo: '🏷️' },
      { id: 'shopify', name: 'Shopify', logo: '🛍️' },
      { id: 'etsy', name: 'Etsy', logo: '🎨' },
      { id: 'aliexpress', name: 'AliExpress', logo: '🌏' },
      { id: 'walmart', name: 'Walmart', logo: '🏬' },
      { id: 'target', name: 'Target', logo: '🎯' },
      { id: 'bestbuy', name: 'Best Buy', logo: '💻' },
    ],
  },
];
