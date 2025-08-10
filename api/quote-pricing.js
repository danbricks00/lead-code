export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;

  try {
    switch (method) {
      case 'POST':
        return await calculateQuotePrice(req, res);
      case 'GET':
        return await getPricingRates(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Quote pricing error:', error);
    res.status(500).json({
      success: false,
      error: 'Pricing calculation failed',
      details: error.message
    });
  }
}

async function calculateQuotePrice(req, res) {
  try {
    const {
      serviceType,
      projectSize,
      projectDetails,
      location,
      urgency,
      materials,
      laborHours
    } = req.body;

    console.log('💰 Calculating quote price for:', serviceType);

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Service type is required'
      });
    }

    // Get base pricing for the service type
    const basePricing = getBasePricing(serviceType);
    if (!basePricing) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service type'
      });
    }

    // Calculate project size multiplier
    const sizeMultiplier = calculateSizeMultiplier(projectSize, serviceType);

    // Calculate location adjustment
    const locationAdjustment = calculateLocationAdjustment(location);

    // Calculate urgency multiplier
    const urgencyMultiplier = calculateUrgencyMultiplier(urgency);

    // Calculate materials cost
    const materialsCost = calculateMaterialsCost(materials, serviceType, projectSize);

    // Calculate labor cost
    const laborCost = calculateLaborCost(laborHours, serviceType, urgency);

    // Calculate total
    const baseCost = basePricing.basePrice * sizeMultiplier;
    const adjustedCost = baseCost * locationAdjustment * urgencyMultiplier;
    const totalCost = adjustedCost + materialsCost + laborCost;

    // Apply profit margin
    const profitMargin = 0.25; // 25% profit margin
    const finalPrice = totalCost * (1 + profitMargin);

    // Generate detailed breakdown
    const breakdown = {
      basePrice: basePricing.basePrice,
      sizeMultiplier: sizeMultiplier,
      sizeAdjustedPrice: baseCost,
      locationAdjustment: locationAdjustment,
      urgencyMultiplier: urgencyMultiplier,
      adjustedPrice: adjustedCost,
      materialsCost: materialsCost,
      laborCost: laborCost,
      subtotal: totalCost,
      profitMargin: profitMargin,
      profitAmount: totalCost * profitMargin,
      finalPrice: Math.round(finalPrice * 100) / 100 // Round to 2 decimal places
    };

    console.log('✅ Quote price calculated:', breakdown.finalPrice);

    return res.json({
      success: true,
      quotePrice: breakdown.finalPrice,
      breakdown: breakdown,
      currency: 'NZD',
      validFor: '30 days'
    });

  } catch (error) {
    console.error('❌ Calculate quote price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate quote price',
      details: error.message
    });
  }
}

async function getPricingRates(req, res) {
  try {
    const { serviceType } = req.query;
    console.log('📊 Getting pricing rates for:', serviceType);

    if (serviceType) {
      // Get rates for specific service type
      const rates = getServiceRates(serviceType);
      if (!rates) {
        return res.status(404).json({
          success: false,
          error: 'Service type not found'
        });
      }

      return res.json({
        success: true,
        serviceType: serviceType,
        rates: rates
      });
    } else {
      // Get all available service rates
      const allRates = getAllServiceRates();
      return res.json({
        success: true,
        rates: allRates
      });
    }

  } catch (error) {
    console.error('❌ Get pricing rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing rates',
      details: error.message
    });
  }
}

function getBasePricing(serviceType) {
  const pricing = {
    'Underfloor Heating': {
      basePrice: 2500,
      description: 'Complete underfloor heating system installation',
      unit: 'per system'
    },
    'Plumbing': {
      basePrice: 120,
      description: 'Plumbing services and repairs',
      unit: 'per hour'
    },
    'Electrical': {
      basePrice: 95,
      description: 'Electrical installation and repairs',
      unit: 'per hour'
    },
    'Carpentry': {
      basePrice: 85,
      description: 'Carpentry and woodwork services',
      unit: 'per hour'
    },
    'Painting': {
      basePrice: 45,
      description: 'Interior and exterior painting',
      unit: 'per square meter'
    },
    'Roofing': {
      basePrice: 75,
      description: 'Roof repairs and maintenance',
      unit: 'per square meter'
    },
    'Landscaping': {
      basePrice: 65,
      description: 'Garden and landscape services',
      unit: 'per hour'
    },
    'Cleaning': {
      basePrice: 35,
      description: 'Professional cleaning services',
      unit: 'per hour'
    }
  };

  return pricing[serviceType] || null;
}

function calculateSizeMultiplier(projectSize, serviceType) {
  if (!projectSize) return 1;

  const sizeMultipliers = {
    'small': 0.7,
    'medium': 1.0,
    'large': 1.5,
    'extra-large': 2.2
  };

  // Special adjustments for specific services
  const serviceAdjustments = {
    'Underfloor Heating': {
      'small': 0.8,   // Small systems still need significant setup
      'medium': 1.0,
      'large': 1.4,
      'extra-large': 1.8
    },
    'Painting': {
      'small': 0.6,   // Painting scales more linearly
      'medium': 1.0,
      'large': 1.3,
      'extra-large': 1.6
    }
  };

  const baseMultiplier = sizeMultipliers[projectSize.toLowerCase()] || 1.0;
  const serviceAdjustment = serviceAdjustments[serviceType]?.[projectSize.toLowerCase()] || 1.0;

  return baseMultiplier * serviceAdjustment;
}

function calculateLocationAdjustment(location) {
  if (!location) return 1.0;

  const locationAdjustments = {
    'Auckland': 1.15,    // Higher cost of living
    'Wellington': 1.12,  // Capital city premium
    'Christchurch': 1.08, // Rebuilding premium
    'Hamilton': 1.05,    // Slightly above average
    'Tauranga': 1.06,    // Growing city
    'Napier': 1.03,      // Regional center
    'Dunedin': 1.02,     // University city
    'Palmerston North': 1.01, // Regional
    'Nelson': 1.04,      // Tourist area
    'Rotorua': 1.03,     // Tourist area
    'New Plymouth': 1.02, // Regional
    'Whangarei': 1.01,   // Regional
    'Invercargill': 0.98, // Lower cost area
    'Whanganui': 0.97,   // Lower cost area
    'Gisborne': 1.00,    // Average
    'Timaru': 0.99,      // Regional
    'Taupo': 1.05,       // Tourist area
    'Queenstown': 1.20,  // High tourist area
    'Wanaka': 1.18,      // High tourist area
    'Rural': 1.10        // Travel costs
  };

  // Try to match location (case insensitive)
  const locationKey = Object.keys(locationAdjustments).find(
    key => key.toLowerCase() === location.toLowerCase()
  );

  return locationKey ? locationAdjustments[locationKey] : 1.0;
}

function calculateUrgencyMultiplier(urgency) {
  if (!urgency) return 1.0;

  const urgencyMultipliers = {
    'standard': 1.0,     // Normal timeline
    'rush': 1.25,        // 1-2 weeks
    'urgent': 1.5,       // 3-5 days
    'emergency': 2.0     // Same day/next day
  };

  return urgencyMultipliers[urgency.toLowerCase()] || 1.0;
}

function calculateMaterialsCost(materials, serviceType, projectSize) {
  if (!materials || !Array.isArray(materials)) return 0;

  const materialCosts = {
    'Underfloor Heating': {
      'pipes': 15,        // per meter
      'manifold': 200,    // per unit
      'pump': 150,        // per unit
      'thermostat': 80,   // per unit
      'insulation': 25    // per square meter
    },
    'Plumbing': {
      'pipes': 8,         // per meter
      'fittings': 5,      // per fitting
      'taps': 120,        // per unit
      'toilet': 300,      // per unit
      'sink': 150         // per unit
    },
    'Electrical': {
      'wiring': 3,        // per meter
      'switches': 15,     // per unit
      'outlets': 25,      // per unit
      'lighting': 80,     // per fixture
      'circuit_breaker': 45 // per unit
    },
    'Carpentry': {
      'timber': 12,       // per meter
      'plywood': 45,      // per sheet
      'nails': 0.5,       // per nail
      'screws': 0.3,      // per screw
      'hinges': 8         // per pair
    },
    'Painting': {
      'paint': 45,        // per liter
      'primer': 35,       // per liter
      'brushes': 15,      // per brush
      'rollers': 8,       // per roller
      'drop_cloths': 25   // per cloth
    }
  };

  const serviceMaterials = materialCosts[serviceType] || {};
  let totalCost = 0;

  materials.forEach(material => {
    const { type, quantity = 1 } = material;
    const unitCost = serviceMaterials[type] || 0;
    totalCost += unitCost * quantity;
  });

  return totalCost;
}

function calculateLaborCost(laborHours, serviceType, urgency) {
  if (!laborHours) {
    // Estimate labor hours based on service type
    const estimatedHours = getEstimatedLaborHours(serviceType);
    return estimatedHours * getHourlyRate(serviceType) * calculateUrgencyMultiplier(urgency);
  }

  return laborHours * getHourlyRate(serviceType) * calculateUrgencyMultiplier(urgency);
}

function getEstimatedLaborHours(serviceType) {
  const estimatedHours = {
    'Underfloor Heating': 16,  // 2 days
    'Plumbing': 4,             // Half day
    'Electrical': 3,           // Half day
    'Carpentry': 6,            // Full day
    'Painting': 8,             // Full day
    'Roofing': 12,             // 1.5 days
    'Landscaping': 10,         // Full day
    'Cleaning': 4              // Half day
  };

  return estimatedHours[serviceType] || 4;
}

function getHourlyRate(serviceType) {
  const hourlyRates = {
    'Underfloor Heating': 95,
    'Plumbing': 85,
    'Electrical': 90,
    'Carpentry': 75,
    'Painting': 45,
    'Roofing': 80,
    'Landscaping': 65,
    'Cleaning': 35
  };

  return hourlyRates[serviceType] || 60;
}

function getServiceRates(serviceType) {
  const basePricing = getBasePricing(serviceType);
  if (!basePricing) return null;

  return {
    serviceType: serviceType,
    basePrice: basePricing.basePrice,
    unit: basePricing.unit,
    description: basePricing.description,
    hourlyRate: getHourlyRate(serviceType),
    estimatedHours: getEstimatedLaborHours(serviceType),
    sizeMultipliers: {
      'small': calculateSizeMultiplier('small', serviceType),
      'medium': calculateSizeMultiplier('medium', serviceType),
      'large': calculateSizeMultiplier('large', serviceType),
      'extra-large': calculateSizeMultiplier('extra-large', serviceType)
    },
    urgencyMultipliers: {
      'standard': 1.0,
      'rush': 1.25,
      'urgent': 1.5,
      'emergency': 2.0
    }
  };
}

function getAllServiceRates() {
  const services = [
    'Underfloor Heating',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Roofing',
    'Landscaping',
    'Cleaning'
  ];

  return services.map(service => getServiceRates(service)).filter(rate => rate !== null);
} 