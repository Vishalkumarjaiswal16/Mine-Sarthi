/**
 * Global Search Service
 * Provides site-wide search functionality across all pages and content
 */

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'feature' | 'equipment' | 'metric' | 'report';
  path: string;
  keywords: string[];
  category?: string;
}

// Site-wide searchable content index
const searchIndex: SearchResult[] = [
  // Main Pages
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Control Dashboard - Real-time monitoring and AI-powered insights',
    type: 'page',
    path: '/dashboard',
    keywords: ['dashboard', 'control', 'monitoring', 'real-time', 'metrics', 'overview', 'home'],
    category: 'Main Pages'
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    description: 'Digital Twin Control System - 3D visualization of mining operations and equipment',
    type: 'page',
    path: '/digital-twin',
    keywords: ['digital twin', '3d', 'visualization', 'operations', 'equipment', 'mining', 'process', 'control system', 'simulation'],
    category: 'Main Pages'
  },
  {
    id: 'energy-usage',
    title: 'Energy Usage',
    description: 'Track and analyze energy consumption patterns',
    type: 'page',
    path: '/energy-usage',
    keywords: ['energy', 'consumption', 'usage', 'power', 'electricity', 'kilowatt', 'kwh', 'efficiency'],
    category: 'Energy Management'
  },
  {
    id: 'renewable-energy',
    title: 'Renewable Energy',
    description: 'Monitor renewable energy sources and solar panels',
    type: 'page',
    path: '/renewable-energy',
    keywords: ['renewable', 'solar', 'green energy', 'sustainability', 'panels', 'clean energy'],
    category: 'Energy Management'
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Weather monitoring and forecasts for mining operations',
    type: 'page',
    path: '/weather',
    keywords: ['weather', 'forecast', 'temperature', 'humidity', 'wind', 'rain', 'climate', 'conditions'],
    category: 'Monitoring'
  },
  {
    id: 'hardware',
    title: 'M2M',
    description: 'Device management and M2M network status',
    type: 'page',
    path: '/hardware',
    keywords: ['hardware', 'devices', 'sensors', 'iot', 'm2m', 'network', 'equipment', 'status'],
    category: 'Operations'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Application settings and configuration',
    type: 'page',
    path: '/settings',
    keywords: ['settings', 'configuration', 'preferences', 'options', 'setup', 'admin'],
    category: 'System'
  },
  {
    id: 'custom-reports',
    title: 'Custom Reports',
    description: 'Generate and manage custom reports',
    type: 'page',
    path: '/custom-reports',
    keywords: ['reports', 'custom', 'generate', 'export', 'pdf', 'data', 'analytics'],
    category: 'Reports'
  },

  // Features and Equipment
  {
    id: 'primary-crusher',
    title: 'Primary Crusher',
    description: 'Primary crushing equipment monitoring',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['crusher', 'primary', 'crushing', 'equipment', 'ore'],
    category: 'Equipment'
  },
  {
    id: 'conveyor-belt',
    title: 'Conveyor Belt',
    description: 'Conveyor belt system status',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['conveyor', 'belt', 'transport', 'material handling'],
    category: 'Equipment'
  },
  {
    id: 'ball-mill',
    title: 'Ball Mill',
    description: 'Ball mill grinding operations',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['mill', 'ball mill', 'grinding', 'milling'],
    category: 'Equipment'
  },
  {
    id: 'vibrating-screen',
    title: 'Vibrating Screen',
    description: 'Screening and separation equipment',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['screen', 'vibrating', 'screening', 'separation'],
    category: 'Equipment'
  },
  {
    id: 'process-pump',
    title: 'Process Pump',
    description: 'Pump system monitoring',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['pump', 'process', 'pumping', 'fluid'],
    category: 'Equipment'
  },
  {
    id: 'ore-hopper',
    title: 'Ore Hopper',
    description: 'Ore storage and feeding system',
    type: 'equipment',
    path: '/dashboard',
    keywords: ['hopper', 'ore', 'storage', 'feeding'],
    category: 'Equipment'
  },

  // Metrics
  {
    id: 'feed-size',
    title: 'Feed Size',
    description: 'Ore feed size measurements',
    type: 'metric',
    path: '/dashboard',
    keywords: ['feed size', 'size', 'mm', 'particle size'],
    category: 'Metrics'
  },
  {
    id: 'ore-hardness',
    title: 'Ore Hardness',
    description: 'Bond Work Index measurements',
    type: 'metric',
    path: '/dashboard',
    keywords: ['hardness', 'bwi', 'bond work index', 'ore hardness'],
    category: 'Metrics'
  },
  {
    id: 'equipment-load',
    title: 'Equipment Load',
    description: 'Equipment load percentage monitoring',
    type: 'metric',
    path: '/dashboard',
    keywords: ['load', 'capacity', 'utilization', 'percentage'],
    category: 'Metrics'
  },
  {
    id: 'moisture-content',
    title: 'Moisture Content',
    description: 'Ore moisture content measurements',
    type: 'metric',
    path: '/dashboard',
    keywords: ['moisture', 'water', 'content', 'humidity'],
    category: 'Metrics'
  },
  {
    id: 'temperature',
    title: 'Temperature',
    description: 'Equipment temperature monitoring',
    type: 'metric',
    path: '/dashboard',
    keywords: ['temperature', 'temp', 'heat', 'celsius', 'cooling'],
    category: 'Metrics'
  },
  {
    id: 'vibration',
    title: 'Vibration',
    description: 'Equipment vibration analysis',
    type: 'metric',
    path: '/dashboard',
    keywords: ['vibration', 'vibrate', 'oscillation', 'movement'],
    category: 'Metrics'
  },
  {
    id: 'power-factor',
    title: 'Power Factor',
    description: 'Electrical power factor measurements',
    type: 'metric',
    path: '/dashboard',
    keywords: ['power factor', 'electricity', 'efficiency', 'electrical'],
    category: 'Metrics'
  },
];

/**
 * Search function - finds matching results across the entire site
 */
export function searchGlobal(query: string): SearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  // Score each result based on relevance
  const scoredResults = searchIndex.map(result => {
    let score = 0;
    const searchableText = `${result.title} ${result.description} ${result.keywords.join(' ')}`.toLowerCase();

    // Exact title match gets highest score
    if (result.title.toLowerCase() === normalizedQuery) {
      score += 100;
    } else if (result.title.toLowerCase().includes(normalizedQuery)) {
      score += 50;
    }

    // Exact path match
    if (result.path.toLowerCase().includes(normalizedQuery)) {
      score += 30;
    }

    // Keyword matches
    result.keywords.forEach(keyword => {
      if (keyword.toLowerCase() === normalizedQuery) {
        score += 40;
      } else if (keyword.toLowerCase().includes(normalizedQuery)) {
        score += 20;
      } else if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 15;
      }
    });

    // Word-by-word matching
    queryWords.forEach(word => {
      if (searchableText.includes(word)) {
        score += 10;
      }
    });

    // Category match
    if (result.category?.toLowerCase().includes(normalizedQuery)) {
      score += 25;
    }

    return { ...result, score };
  });

  // Filter results with score > 0 and sort by score (highest first)
  return scoredResults
    .filter(result => result.score > 0)
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, 10) // Limit to top 10 results
    .map(({ score, ...result }) => result); // Remove score from final results
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(query: string): string[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const suggestions = new Set<string>();

  searchIndex.forEach(result => {
    // Add matching titles
    if (result.title.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(result.title);
    }

    // Add matching keywords
    result.keywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(normalizedQuery) && keyword.length > normalizedQuery.length) {
        suggestions.add(keyword);
      }
    });
  });

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Get all categories for filtering
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  searchIndex.forEach(result => {
    if (result.category) {
      categories.add(result.category);
    }
  });
  return Array.from(categories).sort();
}

