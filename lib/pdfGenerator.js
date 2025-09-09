// PDF Generation using HTML-to-PDF service
// This replaces the Xero PDF generation with a more reliable solution

// Mobile-optimized PDF and HTML generation only - DOCX removed for better mobile experience

// PDF Usage Tracking and Quota Management
import { getGoogleSheetsClient, getSpreadsheetId } from '../lib/googleSheets.js';

async function getCurrentPDFUsage() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    // Get current month key as "YYYY-MM"
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7); // "2025-09"
    
    // Read PDFUsage tab
    const range = 'PDFUsage!A:E';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    
    // Find existing row for this month
    let existingRow = null;
    let monthRowIndex = -1;
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === monthKey) {
        monthRowIndex = i;
        existingRow = rows[i];
        break;
      }
    }
    
    // If no row exists, create new one
    if (monthRowIndex === -1) {
      const nzTimestamp = now.toLocaleString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const newRow = [monthKey, 0, 0, 0, nzTimestamp];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'PDFUsage!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] }
      });
      
      existingRow = newRow;
      monthRowIndex = rows.length;
    }
    
    return {
      monthKey,
      adobeCount: parseInt(existingRow[1] || 0),
      pdfshiftCount: parseInt(existingRow[2] || 0),
      api2pdfCount: parseInt(existingRow[3] || 0),
      monthRowIndex,
      existingRow
    };
    
  } catch (error) {
    console.error('❌ PDF Usage Retrieval Error:', error);
    // Return default values if tracking fails
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    return {
      monthKey,
      adobeCount: 0,
      pdfshiftCount: 0,
      api2pdfCount: 0,
      monthRowIndex: -1,
      existingRow: null
    };
  }
}

async function trackPDFUsage(provider) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    const usage = await getCurrentPDFUsage();
    
    // Get NZ timestamp for LastUpdated
    const now = new Date();
    const nzTimestamp = now.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Increment the counter for the provider used
    const providerIndex = {
      'Adobe': 1,
      'PDFShift': 2,
      'API2PDF': 3
    }[provider];
    
    if (providerIndex && usage.monthRowIndex >= 0) {
      const currentCount = parseInt(usage.existingRow[providerIndex] || 0);
      const newCount = currentCount + 1;
      
      // Update the specific cell
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `PDFUsage!${String.fromCharCode(65 + providerIndex)}${usage.monthRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newCount]] }
      });
      
      // Update LastUpdated
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `PDFUsage!E${usage.monthRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[nzTimestamp]] }
      });
      
      // Log usage with quota warnings
      const adobeCount = provider === 'Adobe' ? newCount : usage.adobeCount;
      const pdfshiftCount = provider === 'PDFShift' ? newCount : usage.pdfshiftCount;
      const api2pdfCount = provider === 'API2PDF' ? newCount : usage.api2pdfCount;
      
      let logMessage = `[PDF COUNTER] ${usage.monthKey} → Adobe: ${adobeCount}/500, PDFShift: ${pdfshiftCount}/50, API2PDF: ${api2pdfCount}`;
      
      // Add quota warnings (90% threshold)
      if (adobeCount >= 450) {
        logMessage += '\n⚠️ Warning: Adobe quota at 90% (450/500)';
      }
      if (pdfshiftCount >= 45) {
        logMessage += '\n⚠️ Warning: PDFShift quota at 90% (45/50)';
      }
      
      console.log(logMessage);
    }
    
  } catch (error) {
    console.error('❌ PDF Usage Tracking Error:', error);
    // Don't fail PDF generation if tracking fails
  }
}

function selectPDFProvider(usage) {
  const { adobeCount, pdfshiftCount } = usage;
  
  // Adobe temporarily disabled due to scope issues
  // if (adobeCount < 500) {
  //   console.log(`🎯 Adobe available: ${adobeCount}/500 - using Adobe first`);
  //   return 'Adobe';
  // } else {
  //   console.log(`⚠️ Adobe quota reached (500/500) – falling back to PDFShift`);
  // }
  
  // PDFShift: max 50 / month - now primary
  if (pdfshiftCount < 50) {
    console.log(`🎯 PDFShift available: ${pdfshiftCount}/50 - using PDFShift as primary`);
    return 'PDFShift';
  } else {
    console.log(`⚠️ PDFShift quota reached (50/50) – falling back to API2PDF`);
  }
  
  // API2PDF: no limit (paid)
  console.log(`🎯 Using API2PDF (paid service, no limit)`);
  return 'API2PDF';
}

// Global utility functions
function formatCurrency(amount) {
  if (typeof amount !== 'number') return '0.00';
  return amount.toFixed(2);
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ULTRA-ROBUST LABOUR DATA NORMALIZATION
// This function handles ALL possible labour variable naming conventions and edge cases
function normalizeLabourData(data) {
  console.log('🔧 ULTRA-ROBUST: Normalizing labour data...');
  
  const labourData = {
    rate: 0,
    hours: 0,
    total: 0,
    unit: 'hour',
    description: 'Labour & Installation'
  };
  
  // COMPREHENSIVE RATE SOURCES - Check every possible location and naming convention
  const rateSources = [
    // Breakdown variations
    data.breakdown?.labourRate,
    data.breakdown?.labour_rate,
    data.breakdown?.LabourRate,
    data.breakdown?.LABOUR_RATE,
    data.breakdown?.laborRate,
    data.breakdown?.labor_rate,
    data.breakdown?.LaborRate,
    data.breakdown?.LABOR_RATE,
    data.breakdown?.hourlyRate,
    data.breakdown?.hourly_rate,
    data.breakdown?.HourlyRate,
    data.breakdown?.HOURLY_RATE,
    
    // Direct data variations
    data.labourRate,
    data.labour_rate,
    data.LabourRate,
    data.LABOUR_RATE,
    data.laborRate,
    data.labor_rate,
    data.LaborRate,
    data.LABOR_RATE,
    data.hourlyRate,
    data.hourly_rate,
    data.HourlyRate,
    data.HOURLY_RATE,
    
    // Room-level labour rates (average all rooms with complexity adjustments)
    ...(data.rooms || []).map(room => {
      const complexity = calculateRoomSpecificRates(room);
      const baseRate = room.labourRate || room.laborRate || room.hourlyRate || 25;
      return baseRate * complexity.labour;
    }),
    
    // Fallback calculations
    data.breakdown?.labourTotal && data.breakdown?.labourHours ? 
      data.breakdown.labourTotal / data.breakdown.labourHours : null,
    data.totals?.labour && data.breakdown?.labourHours ? 
      data.totals.labour / data.breakdown.labourHours : null
  ];
  
  // COMPREHENSIVE HOURS SOURCES
  const hoursSources = [
    // Breakdown variations
    data.breakdown?.labourHours,
    data.breakdown?.labour_hours,
    data.breakdown?.LabourHours,
    data.breakdown?.LABOUR_HOURS,
    data.breakdown?.laborHours,
    data.breakdown?.labor_hours,
    data.breakdown?.LaborHours,
    data.breakdown?.LABOR_HOURS,
    data.breakdown?.hours,
    data.breakdown?.Hours,
    data.breakdown?.HOURS,
    data.breakdown?.workHours,
    data.breakdown?.work_hours,
    data.breakdown?.WorkHours,
    data.breakdown?.WORK_HOURS,
    
    // Direct data variations
    data.labourHours,
    data.labour_hours,
    data.LabourHours,
    data.LABOUR_HOURS,
    data.laborHours,
    data.labor_hours,
    data.LaborHours,
    data.LABOR_HOURS,
    data.hours,
    data.Hours,
    data.HOURS,
    data.workHours,
    data.work_hours,
    data.WorkHours,
    data.WORK_HOURS,
    
    // Calculate from rooms if available (with complexity adjustments)
    ...(data.rooms || []).map(room => {
      const complexity = calculateRoomSpecificRates(room);
      const baseHours = room.labourHours || room.laborHours || room.hours || 0;
      const sqm = parseFloat(room.sqm) || 0;
      // If no hours specified, estimate based on sqm and complexity
      const estimatedHours = baseHours || (sqm * 0.5 * complexity.labour);
      return estimatedHours;
    }),
    
    // Fallback: calculate from total and rate
    data.breakdown?.labourTotal && data.breakdown?.labourRate ? 
      data.breakdown.labourTotal / data.breakdown.labourRate : null,
    data.totals?.labour && data.breakdown?.labourRate ? 
      data.totals.labour / data.breakdown.labourRate : null
  ];
  
  // COMPREHENSIVE TOTAL SOURCES
  const totalSources = [
    // Totals variations
    data.totals?.labour,
    data.totals?.labour_total,
    data.totals?.Labour,
    data.totals?.LABOUR,
    data.totals?.labor,
    data.totals?.labor_total,
    data.totals?.Labor,
    data.totals?.LABOR,
    data.totals?.work,
    data.totals?.work_total,
    data.totals?.Work,
    data.totals?.WORK,
    
    // Direct data variations
    data.labourTotal,
    data.labour_total,
    data.LabourTotal,
    data.LABOUR_TOTAL,
    data.laborTotal,
    data.labor_total,
    data.LaborTotal,
    data.LABOR_TOTAL,
    data.workTotal,
    data.work_total,
    data.WorkTotal,
    data.WORK_TOTAL,
    
    // Breakdown variations
    data.breakdown?.labourTotal,
    data.breakdown?.labour_total,
    data.breakdown?.LabourTotal,
    data.breakdown?.LABOUR_TOTAL,
    data.breakdown?.laborTotal,
    data.breakdown?.labor_total,
    data.breakdown?.LaborTotal,
    data.breakdown?.LABOR_TOTAL,
    data.breakdown?.workTotal,
    data.breakdown?.work_total,
    data.breakdown?.WorkTotal,
    data.breakdown?.WORK_TOTAL,
    
    // Calculate from rooms (with complexity adjustments)
    ...(data.rooms || []).map(room => {
      const complexity = calculateRoomSpecificRates(room);
      const baseCost = room.labourCost || room.laborCost || room.workCost || 0;
      const baseRate = room.labourRate || room.laborRate || room.hourlyRate || 25;
      const baseHours = room.labourHours || room.laborHours || room.hours || 0;
      const sqm = parseFloat(room.sqm) || 0;
      
      // Calculate room-specific total
      const adjustedRate = baseRate * complexity.labour;
      const adjustedHours = baseHours || (sqm * 0.5 * complexity.labour);
      return adjustedRate * adjustedHours;
    }),
    
    // Calculate from rate and hours
    data.breakdown?.labourRate && data.breakdown?.labourHours ? 
      data.breakdown.labourRate * data.breakdown.labourHours : null
  ];
  
  // ROBUST VALUE EXTRACTION WITH VALIDATION
  for (const source of rateSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      labourData.rate = parseFloat(source);
      console.log('✅ Found labour rate:', labourData.rate, 'from source:', source);
      break;
    }
  }
  
  for (const source of hoursSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      labourData.hours = parseFloat(source);
      console.log('✅ Found labour hours:', labourData.hours, 'from source:', source);
      break;
    }
  }
  
  for (const source of totalSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      labourData.total = parseFloat(source);
      console.log('✅ Found labour total:', labourData.total, 'from source:', source);
      break;
    }
  }
  
  // INTELLIGENT CALCULATION WITH MULTIPLE FALLBACKS
  if (labourData.total === 0) {
    if (labourData.rate > 0 && labourData.hours > 0) {
      labourData.total = labourData.rate * labourData.hours;
      console.log('🔢 Calculated labour total from rate × hours:', labourData.total);
    } else if (labourData.rate > 0 && data.breakdown?.labourHours) {
      labourData.hours = parseFloat(data.breakdown.labourHours);
      labourData.total = labourData.rate * labourData.hours;
      console.log('🔢 Calculated labour total from rate × labourHours:', labourData.total);
    } else if (labourData.hours > 0 && data.totals?.labour) {
      labourData.rate = parseFloat(data.totals.labour) / labourData.hours;
      labourData.total = parseFloat(data.totals.labour);
      console.log('🔢 Calculated labour rate from total ÷ hours:', labourData.rate);
    }
  }
  
  // VALIDATE AND SET DEFAULTS
  if (labourData.rate === 0 && labourData.hours === 0 && labourData.total === 0) {
    console.warn('⚠️ No labour data found, using defaults');
    labourData.rate = 25; // Default hourly rate
    labourData.hours = 8; // Default hours
    labourData.total = 200; // Default total
  }
  
  // Determine unit
  if (data.breakdown?.labourHours || data.labourHours) {
    labourData.unit = 'hour';
  } else {
    labourData.unit = 'hour'; // Default to hour for labour
  }
  
  console.log('✅ ULTRA-ROBUST normalized labour data:', labourData);
  return labourData;
}

// ULTRA-ROBUST MATERIALS DATA NORMALIZATION
// This function handles ALL possible materials variable naming conventions and edge cases
function normalizeMaterialsData(data) {
  console.log('🔧 ULTRA-ROBUST: Normalizing materials data...');
  
  const materialsData = {
    cost: 0,
    quantity: 0,
    total: 0,
    unit: 'sqm',
    description: 'Materials & Equipment'
  };
  
  // COMPREHENSIVE COST SOURCES - Check every possible location and naming convention
  const costSources = [
    // Breakdown variations
    data.breakdown?.materialsCost,
    data.breakdown?.materials_cost,
    data.breakdown?.MaterialsCost,
    data.breakdown?.MATERIALS_COST,
    data.breakdown?.materialsRate,
    data.breakdown?.materials_rate,
    data.breakdown?.MaterialsRate,
    data.breakdown?.MATERIALS_RATE,
    data.breakdown?.materialCost,
    data.breakdown?.material_cost,
    data.breakdown?.MaterialCost,
    data.breakdown?.MATERIAL_COST,
    
    // Direct data variations
    data.materialsCost,
    data.materials_cost,
    data.MaterialsCost,
    data.MATERIALS_COST,
    data.materialsRate,
    data.materials_rate,
    data.MaterialsRate,
    data.MATERIALS_RATE,
    data.materialCost,
    data.material_cost,
    data.MaterialCost,
    data.MATERIAL_COST,
    
    // Room-level materials (sum all rooms with complexity adjustments)
    ...(data.rooms || []).map(room => {
      const complexity = calculateRoomSpecificRates(room);
      const baseCost = room.materialsCost || room.materialCost || 0;
      const sqm = parseFloat(room.sqm) || 0;
      return baseCost * complexity.materials * sqm;
    }),
    
    // Fallback calculations
    data.breakdown?.materialsTotal && data.breakdown?.materialsQuantity ? 
      data.breakdown.materialsTotal / data.breakdown.materialsQuantity : null,
    data.totals?.materials && data.breakdown?.materialsQuantity ? 
      data.totals.materials / data.breakdown.materialsQuantity : null
  ];
  
  // COMPREHENSIVE QUANTITY SOURCES
  const quantitySources = [
    // Breakdown variations
    data.breakdown?.materialsQuantity,
    data.breakdown?.materials_quantity,
    data.breakdown?.MaterialsQuantity,
    data.breakdown?.MATERIALS_QUANTITY,
    data.breakdown?.materialQuantity,
    data.breakdown?.material_quantity,
    data.breakdown?.MaterialQuantity,
    data.breakdown?.MATERIAL_QUANTITY,
    data.breakdown?.totalSqm,
    data.breakdown?.total_sqm,
    data.breakdown?.TotalSqm,
    data.breakdown?.TOTAL_SQM,
    
    // Direct data variations
    data.materialsQuantity,
    data.materials_quantity,
    data.MaterialsQuantity,
    data.MATERIALS_QUANTITY,
    data.materialQuantity,
    data.material_quantity,
    data.MaterialQuantity,
    data.MATERIAL_QUANTITY,
    data.totalSqm,
    data.total_sqm,
    data.TotalSqm,
    data.TOTAL_SQM,
    
    // Calculate from rooms if available (sum all room areas)
    ...(data.rooms || []).map(room => parseFloat(room.sqm) || 0),
    
    // Fallback: calculate from total and cost
    data.breakdown?.materialsTotal && data.breakdown?.materialsCost ? 
      data.breakdown.materialsTotal / data.breakdown.materialsCost : null,
    data.totals?.materials && data.breakdown?.materialsCost ? 
      data.totals.materials / data.breakdown.materialsCost : null
  ];
  
  // COMPREHENSIVE TOTAL SOURCES
  const totalSources = [
    // Totals variations
    data.totals?.materials,
    data.totals?.materials_total,
    data.totals?.Materials,
    data.totals?.MATERIALS,
    data.totals?.material,
    data.totals?.material_total,
    data.totals?.Material,
    data.totals?.MATERIAL,
    
    // Direct data variations
    data.materialsTotal,
    data.materials_total,
    data.MaterialsTotal,
    data.MATERIALS_TOTAL,
    data.materialTotal,
    data.material_total,
    data.MaterialTotal,
    data.MATERIAL_TOTAL,
    
    // Breakdown variations
    data.breakdown?.materialsTotal,
    data.breakdown?.materials_total,
    data.breakdown?.MaterialsTotal,
    data.breakdown?.MATERIALS_TOTAL,
    data.breakdown?.materialTotal,
    data.breakdown?.material_total,
    data.breakdown?.MaterialTotal,
    data.breakdown?.MATERIAL_TOTAL,
    
    // Calculate from rooms (with complexity adjustments)
    ...(data.rooms || []).map(room => {
      const complexity = calculateRoomSpecificRates(room);
      const baseCost = room.materialsCost || room.materialCost || 0;
      const sqm = parseFloat(room.sqm) || 0;
      
      // Calculate room-specific materials total
      const adjustedRate = baseCost * complexity.materials;
      return adjustedRate * sqm;
    }),
    
    // Calculate from cost and quantity
    data.breakdown?.materialsCost && data.breakdown?.materialsQuantity ? 
      data.breakdown.materialsCost * data.breakdown.materialsQuantity : null
  ];
  
  // ROBUST VALUE EXTRACTION WITH VALIDATION
  for (const source of costSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      materialsData.cost = parseFloat(source);
      console.log('✅ Found materials cost:', materialsData.cost, 'from source:', source);
      break;
    }
  }
  
  for (const source of quantitySources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      materialsData.quantity = parseFloat(source);
      console.log('✅ Found materials quantity:', materialsData.quantity, 'from source:', source);
      break;
    }
  }
  
  for (const source of totalSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      materialsData.total = parseFloat(source);
      console.log('✅ Found materials total:', materialsData.total, 'from source:', source);
      break;
    }
  }
  
  // INTELLIGENT CALCULATION WITH MULTIPLE FALLBACKS
  if (materialsData.total === 0) {
    if (materialsData.cost > 0 && materialsData.quantity > 0) {
      materialsData.total = materialsData.cost * materialsData.quantity;
      console.log('🔢 Calculated materials total from cost × quantity:', materialsData.total);
    } else if (materialsData.cost > 0 && data.breakdown?.totalSqm) {
      materialsData.quantity = parseFloat(data.breakdown.totalSqm);
      materialsData.total = materialsData.cost * materialsData.quantity;
      console.log('🔢 Calculated materials total from cost × totalSqm:', materialsData.total);
    } else if (materialsData.quantity > 0 && data.totals?.materials) {
      materialsData.cost = parseFloat(data.totals.materials) / materialsData.quantity;
      materialsData.total = parseFloat(data.totals.materials);
      console.log('🔢 Calculated materials cost from total ÷ quantity:', materialsData.cost);
    }
  }
  
  // VALIDATE AND SET DEFAULTS
  if (materialsData.cost === 0 && materialsData.quantity === 0 && materialsData.total === 0) {
    console.warn('⚠️ No materials data found, using defaults');
    materialsData.cost = 10; // Default rate
    materialsData.quantity = 1;
    materialsData.total = 10;
  }
  
  // Determine unit
  if (data.breakdown?.totalSqm || data.totalSqm) {
    materialsData.unit = 'sqm';
  } else if (data.breakdown?.materialsQuantity && data.breakdown.materialsQuantity > 100) {
    materialsData.unit = 'sqm'; // Likely square meters
  } else {
    materialsData.unit = 'unit';
  }
  
  console.log('✅ ULTRA-ROBUST normalized materials data:', materialsData);
  return materialsData;
}

// ULTRA-ROBUST TRAVEL DATA NORMALIZATION
// This function handles ALL possible travel variable naming conventions and edge cases
function normalizeTravelData(data) {
  console.log('🔧 ULTRA-ROBUST: Normalizing travel data...');
  
  const travelData = {
    cost: 0,
    distance: 0,
    total: 0,
    unit: 'km',
    description: 'Travel & Transport'
  };
  
  // COMPREHENSIVE COST SOURCES - Check every possible location and naming convention
  const costSources = [
    // Breakdown variations
    data.breakdown?.travelCost,
    data.breakdown?.travel_cost,
    data.breakdown?.TravelCost,
    data.breakdown?.TRAVEL_COST,
    data.breakdown?.travelRate,
    data.breakdown?.travel_rate,
    data.breakdown?.TravelRate,
    data.breakdown?.TRAVEL_RATE,
    data.breakdown?.fuelCost,
    data.breakdown?.fuel_cost,
    data.breakdown?.FuelCost,
    data.breakdown?.FUEL_COST,
    
    // Direct data variations
    data.travelCost,
    data.travel_cost,
    data.TravelCost,
    data.TRAVEL_COST,
    data.travelRate,
    data.travel_rate,
    data.TravelRate,
    data.TRAVEL_RATE,
    data.fuelCost,
    data.fuel_cost,
    data.FuelCost,
    data.FUEL_COST,
    
    // Fallback calculations
    data.breakdown?.travelTotal && data.breakdown?.travelDistance ? 
      data.breakdown.travelTotal / data.breakdown.travelDistance : null,
    data.totals?.travel && data.breakdown?.travelDistance ? 
      data.totals.travel / data.breakdown.travelDistance : null
  ];
  
  // COMPREHENSIVE DISTANCE SOURCES
  const distanceSources = [
    // Breakdown variations
    data.breakdown?.travelDistance,
    data.breakdown?.travel_distance,
    data.breakdown?.TravelDistance,
    data.breakdown?.TRAVEL_DISTANCE,
    data.breakdown?.distance,
    data.breakdown?.Distance,
    data.breakdown?.DISTANCE,
    data.breakdown?.km,
    data.breakdown?.Km,
    data.breakdown?.KM,
    
    // Direct data variations
    data.travelDistance,
    data.travel_distance,
    data.TravelDistance,
    data.TRAVEL_DISTANCE,
    data.distance,
    data.Distance,
    data.DISTANCE,
    data.km,
    data.Km,
    data.KM,
    
    // Fallback: calculate from total and cost
    data.breakdown?.travelTotal && data.breakdown?.travelCost ? 
      data.breakdown.travelTotal / data.breakdown.travelCost : null,
    data.totals?.travel && data.breakdown?.travelCost ? 
      data.totals.travel / data.breakdown.travelCost : null
  ];
  
  // COMPREHENSIVE TOTAL SOURCES
  const totalSources = [
    // Totals variations
    data.totals?.travel,
    data.totals?.travel_total,
    data.totals?.Travel,
    data.totals?.TRAVEL,
    data.totals?.fuel,
    data.totals?.fuel_total,
    data.totals?.Fuel,
    data.totals?.FUEL,
    
    // Direct data variations
    data.travelTotal,
    data.travel_total,
    data.TravelTotal,
    data.TRAVEL_TOTAL,
    data.fuelTotal,
    data.fuel_total,
    data.FuelTotal,
    data.FUEL_TOTAL,
    
    // Breakdown variations
    data.breakdown?.travelTotal,
    data.breakdown?.travel_total,
    data.breakdown?.TravelTotal,
    data.breakdown?.TRAVEL_TOTAL,
    data.breakdown?.fuelTotal,
    data.breakdown?.fuel_total,
    data.breakdown?.FuelTotal,
    data.breakdown?.FUEL_TOTAL,
    
    // Calculate from cost and distance
    data.breakdown?.travelCost && data.breakdown?.travelDistance ? 
      data.breakdown.travelCost * data.breakdown.travelDistance : null
  ];
  
  // ROBUST VALUE EXTRACTION WITH VALIDATION
  for (const source of costSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      travelData.cost = parseFloat(source);
      console.log('✅ Found travel cost:', travelData.cost, 'from source:', source);
      break;
    }
  }
  
  for (const source of distanceSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      travelData.distance = parseFloat(source);
      console.log('✅ Found travel distance:', travelData.distance, 'from source:', source);
      break;
    }
  }
  
  for (const source of totalSources) {
    if (source !== undefined && source !== null && !isNaN(parseFloat(source)) && parseFloat(source) >= 0) {
      travelData.total = parseFloat(source);
      console.log('✅ Found travel total:', travelData.total, 'from source:', source);
      break;
    }
  }
  
  // INTELLIGENT CALCULATION WITH MULTIPLE FALLBACKS
  if (travelData.total === 0) {
    if (travelData.cost > 0 && travelData.distance > 0) {
      travelData.total = travelData.cost * travelData.distance;
      console.log('🔢 Calculated travel total from cost × distance:', travelData.total);
    } else if (travelData.cost > 0 && data.breakdown?.travelDistance) {
      travelData.distance = parseFloat(data.breakdown.travelDistance);
      travelData.total = travelData.cost * travelData.distance;
      console.log('🔢 Calculated travel total from cost × travelDistance:', travelData.total);
    } else if (travelData.distance > 0 && data.totals?.travel) {
      travelData.cost = parseFloat(data.totals.travel) / travelData.distance;
      travelData.total = parseFloat(data.totals.travel);
      console.log('🔢 Calculated travel cost from total ÷ distance:', travelData.cost);
    }
  }
  
  // VALIDATE AND SET DEFAULTS
  if (travelData.cost === 0 && travelData.distance === 0 && travelData.total === 0) {
    console.warn('⚠️ No travel data found, using defaults');
    travelData.cost = 1; // Default rate per km
    travelData.distance = 10; // Default distance
    travelData.total = 10; // Default total
  }
  
  // Determine unit
  if (data.breakdown?.travelDistance || data.travelDistance) {
    travelData.unit = 'km';
  } else {
    travelData.unit = 'km'; // Default to km for travel
  }
  
  console.log('✅ ULTRA-ROBUST normalized travel data:', travelData);
  return travelData;
}

export function getQuoteTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Template</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .quote-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .quote-info {
            text-align: right;
            flex: 1;
        }
        
        .quote-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .quote-id {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .quote-date {
            font-size: 14px;
            color: #666;
        }
        
        /* Main Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        /* Customer Details */
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .detail-label {
            font-weight: bold;
            width: 120px;
            color: #555;
        }
        
        .detail-value {
            flex: 1;
            color: #333;
        }
        
        /* Room Details Table */
        .room-details {
            grid-column: 1 / -1;
            margin-bottom: 20px;
        }
        
        .room-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .room-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .room-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .room-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .room-table tr:last-child td {
            border-bottom: none;
        }
        
        /* Quote Summary */
        .quote-summary {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .summary-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .total-value {
            font-size: 24px;
            color: #fff;
        }
        
        /* Terms and Conditions */
        .terms {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        
        .terms-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .terms-text {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 11px;
        }
        
        /* Responsive adjustments for print */
        @media print {
            body {
                font-size: 11px;
            }
            
            .quote-container {
                padding: 0;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="quote-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">Kiwi Trade</div>
                <div class="company-tagline">Professional Underfloor Heating Solutions</div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
            </div>
            <div class="quote-info">
                <div class="quote-title">QUOTE</div>
                <div class="quote-id">Quote ID: {{QUOTE_ID}}</div>
                <div class="quote-date">Date: {{QUOTE_DATE}}</div>
                <div class="quote-date">Valid Until: {{VALID_UNTIL}}</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
            <!-- Customer Details -->
            <div class="section">
                <div class="section-title">Customer Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{CUSTOMER_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{CUSTOMER_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{CUSTOMER_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div class="detail-value">{{CUSTOMER_ADDRESS}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Service:</div>
                    <div class="detail-value">{{SERVICE_TYPE}}</div>
                </div>
            </div>

            <!-- Tradesperson Details -->
            <div class="section">
                <div class="section-title">Tradesperson Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{TRADESPERSON_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">License:</div>
                    <div class="detail-value">{{TRADESPERSON_LICENSE}}</div>
                </div>
            </div>
        </div>

        <!-- Room Details -->
        <div class="section room-details">
            <div class="section-title">Project Details</div>
            <table class="room-table">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>Size</th>
                        <th>Labour</th>
                        <th>Materials</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{ROOM_ROWS}}
                </tbody>
            </table>
        </div>

        <!-- Detailed Breakdown -->
        <div class="breakdown-section" style="margin-bottom: 30px;">
            <div class="summary-title">Detailed Cost Breakdown</div>
            <table class="breakdown-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: left; font-weight: bold;">Service Item</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Rate/Unit</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Calculation</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🔧 Labour & Installation</strong><br><small style="color: #666;">Professional installation work</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{LABOUR_RATE}}/hour</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{LABOUR_HOURS}} hours</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{LABOUR_RATE}} × {{LABOUR_HOURS}}h</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{LABOUR_TOTAL}}</td>
                </tr>
                <tr>
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🏠 Materials & Equipment</strong><br><small style="color: #666;">Heating elements, insulation, controls</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{MATERIALS_RATE}}/{{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{MATERIALS_QUANTITY}} {{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{MATERIALS_RATE}} × {{MATERIALS_QUANTITY}}{{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{MATERIALS_TOTAL}}</td>
                </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🚗 Travel & Transport</strong><br><small style="color: #666;">Vehicle costs and fuel</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{TRAVEL_RATE}}/km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{TRAVEL_DISTANCE}} km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{TRAVEL_RATE}} × {{TRAVEL_DISTANCE}}km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{TRAVEL_TOTAL}}</td>
                </tr>
                <tr>
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>⚙️ Setup & Configuration</strong><br><small style="color: #666;">System setup and testing</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Fixed cost</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">1 job</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">One-time setup</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{INSTALLATION_TOTAL}}</td>
                </tr>
                </tbody>
            </table>
            
            <!-- Totals Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dee2e6;">
                <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">💰 Quote Summary</h3>
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #495057;">Subtotal (excl. GST):</span>
                        <span style="font-weight: bold; color: #495057;">{{SUBTOTAL}}</span>
            </div>
                    <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #495057;">GST (15%):</span>
                        <span style="font-weight: bold; color: #495057;">{{GST}}</span>
        </div>
                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 12px 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px; color: white;">
                        <span style="font-weight: bold; font-size: 18px;">TOTAL (incl. GST):</span>
                        <span style="font-weight: bold; font-size: 18px;">{{FINAL_TOTAL}}</span>
                </div>
                </div>
                </div>
            
            <!-- Project Summary -->
            <div style="background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📐 Project Scope</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Total Area:</strong> {{TOTAL_SQM}} square meters</p>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Service Type:</strong> {{SERVICE_TYPE}}</p>
                </div>
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">⏱️ Timeline</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Quote Valid Until:</strong> {{VALID_UNTIL}}</p>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Estimated Hours:</strong> {{LABOUR_HOURS}} hours</p>
            </div>
            </div>
            </div>
        </div>


        <!-- Terms and Conditions -->
        <div class="terms">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">
                • Quote valid 14 days • 50% deposit required • Fully licensed & insured • Changes may incur additional charges
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing Kiwi Trade for your underfloor heating needs.</p>
            <p>For any questions about this quote, please contact us at {{TRADESPERSON_EMAIL}} or {{TRADESPERSON_PHONE}}</p>
        </div>
    </div>
</body>
</html>`;
}

export async function generateQuotePDF(quoteData) {
  try {
    console.log('🔄 ULTRA-ROBUST PDF Generation starting for quote:', quoteData?.quoteId);
    
    // COMPREHENSIVE INPUT VALIDATION
    if (!quoteData) {
      throw new Error('Quote data is required');
    }
    
    if (!quoteData.quoteId) {
      throw new Error('Quote ID is required');
    }
    
    // Log all available data keys for debugging
    console.log('🔍 Available data keys:', Object.keys(quoteData));
    console.log('🔍 Quote data structure:', JSON.stringify(quoteData, null, 2));
    
    // VALIDATE CRITICAL DATA COMPONENTS
    const validationResults = {
      hasCustomerData: !!(quoteData.customerName || quoteData.customerEmail),
      hasTradespersonData: !!(quoteData.tradespersonName || quoteData.tradespersonEmail),
      hasFinancialData: !!(quoteData.totals || quoteData.breakdown),
      hasRoomData: !!(quoteData.rooms && quoteData.rooms.length > 0)
    };
    
    console.log('🔍 Data validation results:', validationResults);
    
    // WARN ABOUT MISSING DATA BUT CONTINUE
    if (!validationResults.hasCustomerData) {
      console.warn('⚠️ Missing customer data - using defaults');
    }
    if (!validationResults.hasTradespersonData) {
      console.warn('⚠️ Missing tradesperson data - using defaults');
    }
    if (!validationResults.hasFinancialData) {
      console.warn('⚠️ Missing financial data - using defaults');
    }
    if (!validationResults.hasRoomData) {
      console.warn('⚠️ Missing room data - using defaults');
    }
    
    console.log('✅ Quote data validation completed');
    
    // Get the HTML template directly (embedded)
    const templateHTML = getQuoteTemplate();
    console.log('✅ HTML template loaded, length:', templateHTML.length);
    
    // Replace placeholders with actual data using ULTRA-ROBUST normalization
    console.log('🔧 Starting ULTRA-ROBUST template filling...');
    const filledHTML = fillTemplate(templateHTML, quoteData);
    console.log('✅ Template filling completed, length:', filledHTML.length);
    
    // COMPREHENSIVE TEMPLATE VALIDATION
    if (!filledHTML || filledHTML.length === 0) {
      throw new Error('Template filling resulted in empty HTML');
    }
    
    // Check for unreplaced placeholders
    const remainingPlaceholders = filledHTML.match(/\{\{[^}]+\}\}/g);
    if (remainingPlaceholders) {
      console.warn('⚠️ Unreplaced placeholders found:', remainingPlaceholders);
      console.warn('⚠️ This may indicate missing data or template issues');
      
      // Log which specific placeholders are missing
      remainingPlaceholders.forEach(placeholder => {
        console.warn(`⚠️ Missing data for: ${placeholder}`);
      });
    } else {
      console.log('✅ All template placeholders successfully replaced');
    }
    
    // Validate HTML structure
    if (!filledHTML.includes('<html') || !filledHTML.includes('</html>')) {
      console.warn('⚠️ Generated HTML may be malformed');
    }
    
    // Generate PDF using HTML-to-PDF service with retry logic
    console.log('🔄 Starting PDF conversion...');
    let pdfBuffer;
    let conversionAttempts = 0;
    const maxAttempts = 3;
    
    while (conversionAttempts < maxAttempts) {
      try {
        conversionAttempts++;
        console.log(`🔄 PDF conversion attempt ${conversionAttempts}/${maxAttempts}`);
        pdfBuffer = await convertHTMLToPDF(filledHTML);
        break;
      } catch (conversionError) {
        console.error(`❌ PDF conversion attempt ${conversionAttempts} failed:`, conversionError.message);
        if (conversionAttempts >= maxAttempts) {
          throw conversionError;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // COMPREHENSIVE PDF VALIDATION
    if (!pdfBuffer) {
      throw new Error('PDF buffer is null or undefined');
    }
    
    if (pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty');
    }
    
    if (pdfBuffer.length < 1000) {
      console.warn('⚠️ PDF buffer is unusually small:', pdfBuffer.length, 'bytes');
    }
    
    console.log('✅ PDF generated successfully!');
    console.log('📊 PDF Statistics:', {
      size: pdfBuffer.length,
      sizeKB: Math.round(pdfBuffer.length / 1024),
      quoteId: quoteData.quoteId,
      conversionAttempts: conversionAttempts
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ ULTRA-ROBUST PDF generation failed:', error);
    console.error('❌ Comprehensive error details:', {
      message: error.message,
      stack: error.stack,
      quoteId: quoteData?.quoteId,
      dataKeys: quoteData ? Object.keys(quoteData) : 'No data',
      dataStructure: quoteData ? JSON.stringify(quoteData, null, 2) : 'No data',
      timestamp: new Date().toISOString()
    });
    
    // Provide helpful error message
    let errorMessage = `Failed to generate PDF: ${error.message}`;
    if (error.message.includes('LABOUR_RATE') || error.message.includes('MATERIALS') || error.message.includes('TRAVEL')) {
      errorMessage += '\n\nThis appears to be a variable naming issue. The ULTRA-ROBUST normalization should have handled this.';
    }
    
    throw new Error(errorMessage);
  }
}

function fillTemplate(template, data) {
  console.log('🔍 PDF Template Data received:', JSON.stringify(data, null, 2));
  
  // Financial summary with safe handling
  const safeFormatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '$0.00' : '$' + formatCurrency(num);
  };
  
  let html = template;
  
  // Basic quote information
  html = html.replace(/{{QUOTE_ID}}/g, data.quoteId || 'N/A');
  html = html.replace(/{{QUOTE_DATE}}/g, formatDate(data.quoteDate || new Date()));
  html = html.replace(/{{VALID_UNTIL}}/g, formatDate(data.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
  
  // Customer details
  html = html.replace(/{{CUSTOMER_NAME}}/g, data.customerName || 'N/A');
  html = html.replace(/{{CUSTOMER_EMAIL}}/g, data.customerEmail || 'N/A');
  html = html.replace(/{{CUSTOMER_PHONE}}/g, data.customerPhone || 'N/A');
  html = html.replace(/{{CUSTOMER_ADDRESS}}/g, data.customerAddress || 'N/A');
  html = html.replace(/{{SERVICE_TYPE}}/g, data.serviceType || 'Underfloor Heating');
  
  // Tradesperson details
  html = html.replace(/{{TRADESPERSON_NAME}}/g, data.tradespersonName || 'N/A');
  html = html.replace(/{{TRADESPERSON_EMAIL}}/g, data.tradespersonEmail || 'N/A');
  html = html.replace(/{{TRADESPERSON_PHONE}}/g, data.tradespersonPhone || 'N/A');
  html = html.replace(/{{TRADESPERSON_LICENSE}}/g, data.tradespersonLicense || 'N/A');
  
  // Room details with custom pricing data
  html = html.replace(/{{ROOM_ROWS}}/g, generateRoomRows(data.rooms || [], data.roomPricingData));
  
  // Financial summary with detailed logging
  console.log('💰 Totals data:', data.totals);
  console.log('🔍 Breakdown data:', data.breakdown);
  console.log('🔍 Labour value:', data.totals?.labour);
  console.log('🔍 Formatted labour:', safeFormatCurrency(data.totals?.labour || 0));
  
  // ROBUST BREAKDOWN PROCESSING WITH NORMALIZATION
  console.log('🔍 Processing breakdown placeholders with robust normalization...');
  
  // Normalize all data using the robust functions
  const labourData = normalizeLabourData(data);
  const materialsData = normalizeMaterialsData(data);
  const travelData = normalizeTravelData(data);
  
  // Get installation cost from various possible sources
  const installationCost = parseFloat(
    data.totals?.installation || 
    data.totals?.Installation || 
    data.totals?.INSTALLATION ||
    data.breakdown?.installationCost ||
    data.breakdown?.InstallationCost ||
    data.breakdown?.INSTALLATION_COST ||
    data.installationCost ||
    data.InstallationCost ||
    data.INSTALLATION_COST ||
    0
  );
  
  // Get total SQM from various possible sources
  const totalSqm = parseFloat(
    data.breakdown?.totalSqm ||
    data.breakdown?.total_sqm ||
    data.breakdown?.TotalSqm ||
    data.breakdown?.TOTAL_SQM ||
    data.totalSqm ||
    data.total_sqm ||
    data.TotalSqm ||
    data.TOTAL_SQM ||
    0
  );
  
  // Replace all placeholders with normalized data using safe formatting
  html = html.replace(/{{LABOUR_RATE}}/g, safeFormatCurrency(labourData.rate));
  html = html.replace(/{{LABOUR_HOURS}}/g, labourData.hours.toFixed(1));
  html = html.replace(/{{MATERIALS_RATE}}/g, safeFormatCurrency(materialsData.cost));
  html = html.replace(/{{MATERIALS_QUANTITY}}/g, materialsData.quantity.toString());
    html = html.replace(/{{MATERIALS_UNIT}}/g, 'sqm');
  html = html.replace(/{{TRAVEL_RATE}}/g, safeFormatCurrency(travelData.cost));
  html = html.replace(/{{TRAVEL_DISTANCE}}/g, travelData.distance.toString());
  html = html.replace(/{{TOTAL_SQM}}/g, totalSqm.toFixed(1));
  
  console.log('✅ All breakdown placeholders processed with robust normalization');
  console.log('🔍 Sample replacements:', {
    labourRate: safeFormatCurrency(labourData.rate),
    labourHours: labourData.hours.toFixed(1),
    materialsRate: safeFormatCurrency(materialsData.cost),
    materialsQuantity: materialsData.quantity.toString()
  });
  
  // Financial totals using normalized data
  html = html.replace(/{{LABOUR_TOTAL}}/g, safeFormatCurrency(labourData.total));
  html = html.replace(/{{MATERIALS_TOTAL}}/g, safeFormatCurrency(materialsData.total));
  html = html.replace(/{{TRAVEL_TOTAL}}/g, safeFormatCurrency(travelData.total));
  html = html.replace(/{{INSTALLATION_TOTAL}}/g, safeFormatCurrency(installationCost));
  
  // Get totals from various possible sources
  console.log('🔍 PDF Generator - Looking for totals in data:', {
    'data.totals': data.totals,
    'data.subtotal': data.subtotal,
    'data.gst': data.gst,
    'data.final': data.final,
    'data.totals?.subtotal': data.totals?.subtotal,
    'data.totals?.gst': data.totals?.gst,
    'data.totals?.final': data.totals?.final
  });
  
  let subtotal = parseFloat(
    data.totals?.subtotal ||
    data.totals?.Subtotal ||
    data.totals?.SUBTOTAL ||
    data.subtotal ||
    data.Subtotal ||
    data.SUBTOTAL ||
    0
  );
  
  let gst = parseFloat(
    data.totals?.gst ||
    data.totals?.GST ||
    data.totals?.Gst ||
    data.gst ||
    data.GST ||
    data.Gst ||
    0
  );
  
  let finalTotal = parseFloat(
    data.totals?.final ||
    data.totals?.Final ||
    data.totals?.FINAL ||
    data.totals?.total ||
    data.totals?.Total ||
    data.totals?.TOTAL ||
    data.final ||
    data.Final ||
    data.FINAL ||
    data.total ||
    data.Total ||
    data.TOTAL ||
    0
  );
  
  // Calculate totals if not provided
  if (subtotal === 0) {
    subtotal = labourData.total + materialsData.total + travelData.total + installationCost;
    console.log('🔢 Calculated subtotal from components:', subtotal);
  }
  
  if (gst === 0 && subtotal > 0) {
    gst = subtotal * 0.15; // 15% GST
    console.log('🔢 Calculated GST (15%):', gst);
  }
  
  if (finalTotal === 0 && subtotal > 0) {
    finalTotal = subtotal + gst;
    console.log('🔢 Calculated final total:', finalTotal);
  }
  
  console.log('💰 PDF Generator - Final calculated totals:', {
    subtotal: subtotal,
    gst: gst,
    finalTotal: finalTotal
  });
  
  html = html.replace(/{{SUBTOTAL}}/g, safeFormatCurrency(subtotal));
  html = html.replace(/{{GST}}/g, safeFormatCurrency(gst));
  html = html.replace(/{{FINAL_TOTAL}}/g, safeFormatCurrency(finalTotal));
  
  // Robust placeholder mappings for template compatibility
  // Map various placeholder variants to formatted values
  html = html.replace(/\{\{subtotal\}\}/g, safeFormatCurrency(subtotal));
  html = html.replace(/\{\{totals\.subtotal\}\}/g, safeFormatCurrency(subtotal));
  html = html.replace(/\{\{gst\}\}/g, safeFormatCurrency(gst));
  html = html.replace(/\{\{totals\.gst\}\}/g, safeFormatCurrency(gst));
  html = html.replace(/\{\{total\}\}/g, safeFormatCurrency(finalTotal));
  html = html.replace(/\{\{grand_total\}\}/g, safeFormatCurrency(finalTotal));
  html = html.replace(/\{\{totalQuote\}\}/g, safeFormatCurrency(finalTotal));
  html = html.replace(/\{\{totals\.final\}\}/g, safeFormatCurrency(finalTotal));
  
  console.log('✅ Template replacement completed with robust placeholder mappings');
  return html;
}

// ROOM-SPECIFIC RATE CALCULATOR
// This function calculates different rates based on room type complexity
// Uses customizable multipliers that can be passed in the data
function calculateRoomSpecificRates(room, customMultipliers = null) {
  const roomName = (room.name || '').toLowerCase();
  const roomType = room.roomType || room.type || '';
  
  // Use custom multipliers if provided, otherwise use defaults
  const getMultiplier = (key, defaultValue) => {
    if (customMultipliers && customMultipliers[key] !== undefined) {
      return customMultipliers[key];
    }
    return defaultValue;
  };
  
  // Define complexity multipliers for different room types
  const complexityMultipliers = {
    // High complexity rooms (bathrooms, kitchens, laundry)
    bathroom: { 
      labour: getMultiplier('bathroomLabourMultiplier', 1.5), 
      materials: getMultiplier('bathroomMaterialsMultiplier', 2.0), 
      hoursPerSqm: getMultiplier('bathroomHoursPerSqm', 0.8),
      description: 'Bathroom (plumbing, waterproofing, tiling)' 
    },
    kitchen: { 
      labour: getMultiplier('kitchenLabourMultiplier', 1.4), 
      materials: getMultiplier('kitchenMaterialsMultiplier', 1.8), 
      hoursPerSqm: getMultiplier('kitchenHoursPerSqm', 0.7),
      description: 'Kitchen (cabinetry, appliances, plumbing)' 
    },
    laundry: { 
      labour: getMultiplier('bathroomLabourMultiplier', 1.5), // Use bathroom settings
      materials: getMultiplier('bathroomMaterialsMultiplier', 2.0), 
      hoursPerSqm: getMultiplier('bathroomHoursPerSqm', 0.8),
      description: 'Laundry (plumbing, waterproofing)' 
    },
    wetroom: { 
      labour: getMultiplier('bathroomLabourMultiplier', 1.5), // Use bathroom settings
      materials: getMultiplier('bathroomMaterialsMultiplier', 2.0), 
      hoursPerSqm: getMultiplier('bathroomHoursPerSqm', 0.8),
      description: 'Wetroom (extensive waterproofing)' 
    },
    ensuite: { 
      labour: getMultiplier('bathroomLabourMultiplier', 1.5), // Use bathroom settings
      materials: getMultiplier('bathroomMaterialsMultiplier', 2.0), 
      hoursPerSqm: getMultiplier('bathroomHoursPerSqm', 0.8),
      description: 'Ensuite (bathroom complexity)' 
    },
    
    // Medium complexity rooms
    living: { 
      labour: getMultiplier('livingLabourMultiplier', 1.1), 
      materials: getMultiplier('livingMaterialsMultiplier', 1.2), 
      hoursPerSqm: getMultiplier('livingHoursPerSqm', 0.6),
      description: 'Living room (standard installation)' 
    },
    lounge: { 
      labour: getMultiplier('livingLabourMultiplier', 1.1), // Use living room settings
      materials: getMultiplier('livingMaterialsMultiplier', 1.2), 
      hoursPerSqm: getMultiplier('livingHoursPerSqm', 0.6),
      description: 'Lounge (standard installation)' 
    },
    dining: { 
      labour: getMultiplier('livingLabourMultiplier', 1.1), // Use living room settings
      materials: getMultiplier('livingMaterialsMultiplier', 1.2), 
      hoursPerSqm: getMultiplier('livingHoursPerSqm', 0.6),
      description: 'Dining room (standard installation)' 
    },
    family: { 
      labour: getMultiplier('livingLabourMultiplier', 1.1), // Use living room settings
      materials: getMultiplier('livingMaterialsMultiplier', 1.2), 
      hoursPerSqm: getMultiplier('livingHoursPerSqm', 0.6),
      description: 'Family room (standard installation)' 
    },
    
    // Low complexity rooms
    bedroom: { 
      labour: getMultiplier('bedroomLabourMultiplier', 1.0), 
      materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
      hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
      description: 'Bedroom (simple installation)' 
    },
    study: { 
      labour: getMultiplier('bedroomLabourMultiplier', 1.0), // Use bedroom settings
      materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
      hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
      description: 'Study (simple installation)' 
    },
    office: { 
      labour: getMultiplier('bedroomLabourMultiplier', 1.0), // Use bedroom settings
      materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
      hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
      description: 'Office (simple installation)' 
    },
    hallway: { 
      labour: getMultiplier('bedroomLabourMultiplier', 1.0), // Use bedroom settings
      materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
      hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
      description: 'Hallway (simple installation)' 
    },
    corridor: { 
      labour: getMultiplier('bedroomLabourMultiplier', 1.0), // Use bedroom settings
      materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
      hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
      description: 'Corridor (simple installation)' 
    },
    
    // Special cases
    garage: { 
      labour: 0.8, 
      materials: 0.9, 
      hoursPerSqm: 0.3,
      description: 'Garage (basic installation)' 
    },
    basement: { 
      labour: 1.2, 
      materials: 1.3, 
      hoursPerSqm: 0.7,
      description: 'Basement (access challenges)' 
    },
    attic: { 
      labour: 1.3, 
      materials: 1.4, 
      hoursPerSqm: 0.8,
      description: 'Attic (access challenges)' 
    }
  };
  
  // Find matching complexity
  let complexity = { 
    labour: getMultiplier('bedroomLabourMultiplier', 1.0), 
    materials: getMultiplier('bedroomMaterialsMultiplier', 1.0), 
    hoursPerSqm: getMultiplier('bedroomHoursPerSqm', 0.5),
    description: 'Standard room' 
  };
  
  // Check room name for keywords
  for (const [roomType, multiplier] of Object.entries(complexityMultipliers)) {
    if (roomName.includes(roomType) || roomType.includes(roomName)) {
      complexity = multiplier;
      break;
    }
  }
  
  // Check roomType field if provided
  if (roomType && complexityMultipliers[roomType.toLowerCase()]) {
    complexity = complexityMultipliers[roomType.toLowerCase()];
  }
  
  return complexity;
}

function generateRoomRows(rooms, roomPricingData = null) {
  if (!rooms || rooms.length === 0) {
    return `
      <tr>
        <td colspan="5" style="text-align: center; color: #666; font-style: italic;">
          No room details available
        </td>
      </tr>
    `;
  }
  
  return rooms.map((room, index) => {
    const sqm = parseFloat(room.sqm) || 0;
    const dimensions = room.dimensions || room.originalInput || 'N/A';
    const sqmDisplay = sqm > 0 ? `${dimensions} (${sqm.toFixed(1)}m²)` : dimensions;
    
    // Get costs from room data
    const labourCost = parseFloat(room.labourCost || 0);
    const materialsCost = parseFloat(room.materialsCost || 0);
    const roomTotal = labourCost + materialsCost;
    
    return `
    <tr>
      <td>${room.name || 'N/A'}</td>
      <td>${sqmDisplay}</td>
      <td>$${labourCost.toFixed(2)}</td>
      <td>$${materialsCost.toFixed(2)}</td>
      <td style="font-weight: bold; color: #28a745;">$${roomTotal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');
}

async function convertHTMLToPDF(html) {
  // Get current usage and select provider based on quotas
  const usage = await getCurrentPDFUsage();
  
  console.log('🔍 PDF Service Environment Check:');
  console.log('   Adobe PDF Client ID:', process.env.ADOBE_PDF_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('   Adobe PDF Client Secret:', process.env.ADOBE_PDF_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   Adobe PDF Organization ID:', process.env.ADOBE_ORG_ID ? '✅ Set' : '❌ Missing');
  console.log('   PDFShift:', process.env.PDFSHIFT_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   API2PDF:', process.env.API2PDF_API_KEY ? '✅ Set' : '❌ Missing');
  
  // Log current usage
  console.log('📊 Current PDF Usage:', JSON.stringify({
    month: usage.monthKey,
    adobe: `${usage.adobeCount}/500`,
    pdfshift: `${usage.pdfshiftCount}/50`,
    api2pdf: usage.api2pdfCount
  }));
  
  // Create ordered provider list based on requirements and availability
  const providers = [];
  
  // 1. Adobe temporarily disabled due to scope issues
  // if (process.env.ADOBE_PDF_CLIENT_ID && 
  //     process.env.ADOBE_PDF_CLIENT_SECRET && 
  //     process.env.ADOBE_ORG_ID &&
  //     usage.adobeCount < 500) {
  //   providers.push('Adobe');
  // }
  
  // 2. PDFShift second if under quota and API key available
  if (process.env.PDFSHIFT_API_KEY && usage.pdfshiftCount < 50) {
    providers.push('PDFShift');
  }
  
  // 3. API2PDF as final fallback if API key available
  if (process.env.API2PDF_API_KEY) {
    providers.push('API2PDF');
  }
  
  console.log(`🎯 Available providers in order: ${providers.join(', ')}`);
  
  if (providers.length === 0) {
    console.log('⚠️ No PDF service providers available');
    throw new Error('PDF generation requires API service configuration (Adobe PDF, API2PDF, or PDFShift)');
  }
  
  // Try each provider in order
  for (const provider of providers) {
    try {
      console.log(`🎯 Trying ${provider}...`);
      
      let result;
      switch (provider) {
        case 'Adobe':
          result = await convertWithAdobePDF(html);
          break;
        case 'PDFShift':
          result = await convertWithPDFShift(html);
          break;
        case 'API2PDF':
          result = await convertWithAPI2PDF(html);
          break;
        default:
          continue;
      }
      
      console.log(`✅ PDF generation successful with ${provider}`);
      return result;
      
    } catch (error) {
      console.log(`⚠️ ${provider} failed, trying next service:`, error.message);
      continue;
    }
  }
  
  // No PDF service available - will fall back to HTML
  console.log('⚠️ All PDF service providers failed');
  throw new Error('All PDF service providers failed');
}

async function convertWithAdobePDF(html) {
  console.log('🔄 Converting HTML to PDF using Adobe PDF Services...');
  
  try {
    // Check for required credentials
    if (!process.env.ADOBE_PDF_CLIENT_ID || !process.env.ADOBE_PDF_CLIENT_SECRET || !process.env.ADOBE_ORG_ID) {
      throw new Error('Adobe PDF credentials not configured (need CLIENT_ID, CLIENT_SECRET, and ORG_ID)');
    }
    
    // Adobe PDF Services OAuth2 authentication with correct scope
    const authResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.ADOBE_PDF_CLIENT_ID,
        client_secret: process.env.ADOBE_PDF_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Adobe Auth Error:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: errorText
      });
      throw new Error(`Adobe auth failed: ${authResponse.status} - ${errorText}`);
    }
    
    const authData = await authResponse.json();
    console.log('✅ Adobe authentication successful');
    
    // Create PDF using Adobe PDF Services REST API v1
    const headers = {
        'Authorization': `Bearer ${authData.access_token}`,
        'x-api-key': process.env.ADOBE_PDF_CLIENT_ID,
        'Content-Type': 'application/json'
    };
    
    // Add organization ID if available
    if (process.env.ADOBE_ORG_ID) {
      headers['x-gw-ims-org-id'] = process.env.ADOBE_ORG_ID;
    }
    
    const response = await fetch('https://pdf-services.adobe.io/operation/createpdf', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assetID: 'urn:aaid:AS:UE1:' + Date.now(),
        mediaType: 'text/html',
        html: html,
        json: JSON.stringify({
          includeHeaderFooter: false,
          landscape: false,
          paperSize: 'A4',
          marginTop: '0.5in',
          marginBottom: '0.5in',
          marginLeft: '0.5in',
          marginRight: '0.5in'
        })
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Adobe PDF API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Adobe PDF API error: ${response.status} - ${errorText}`);
    }
    
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('✅ Adobe PDF conversion successful, PDF size:', pdfBuffer.length, 'bytes');
    
    // Track PDF usage
    await trackPDFUsage('Adobe');
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ Adobe PDF conversion failed:', error);
    throw error;
  }
}

async function convertWithAPI2PDF(html) {
  console.log('🔄 Converting HTML to PDF using API2PDF...');
  
  const response = await fetch('https://v2018.api2pdf.com/chrome/html', {
    method: 'POST',
    headers: {
      'Authorization': process.env.API2PDF_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: html,
      landscape: true,
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API2PDF Error:', {
      status: response.status,
      error: errorText
    });
    throw new Error(`API2PDF error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  // Download the PDF from the provided URL
  const pdfResponse = await fetch(result.pdf);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF from API2PDF: ${pdfResponse.status}`);
  }
  
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  console.log('✅ API2PDF conversion successful, PDF size:', pdfBuffer.length, 'bytes');
  
  // Track PDF usage
  await trackPDFUsage('API2PDF');
  
  return pdfBuffer;
}

async function convertWithPDFShift(html) {
  console.log('🔄 Converting HTML to PDF using PDFShift...');
  console.log('📄 HTML length:', html.length, 'characters');
  console.log('🔑 API Key present:', process.env.PDFSHIFT_API_KEY ? 'Yes' : 'No');
  
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: html,
      format: 'A4',
      landscape: true,
      margin: {
        top: '0.5in',
        right: '0.5in', 
        bottom: '0.5in',
        left: '0.5in'
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PDFShift API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`PDFShift API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  console.log('✅ PDFShift conversion successful, PDF size:', pdfBuffer.length, 'bytes');
  
  // Track PDF usage
  await trackPDFUsage('PDFShift');
  
  return pdfBuffer;
}

async function convertWithHTMLCSSTOPDF(html) {
  const response = await fetch('https://htmlcsstoimage.com/demo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HTMLCSSTOPDF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: html,
      format: 'pdf',
      landscape: true,
      margin: '20mm'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTML/CSS to PDF API error: ${response.status} ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}



// Client-side PDF generation using jsPDF (fallback)
export function generateClientSidePDF(quoteData) {
  // This would be used if no server-side PDF service is available
  // Implementation would use jsPDF library
  console.log('Client-side PDF generation not implemented yet');
  throw new Error('Client-side PDF generation not implemented');
}

// HTML generation as mobile-friendly backup when PDF fails
// HTML maintains formatting and works perfectly on mobile devices
export function generateQuoteHTML(data) {
  console.log('🔄 Generating formatted HTML for quote:', data.quoteId);
  
  try {
    const htmlTemplate = getQuoteTemplate();
    const htmlContent = fillTemplate(htmlTemplate, data);
    
    // Create a complete HTML document with enhanced styling for standalone viewing
    const standaloneHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote ${data.quoteId} - Kiwi Trade</title>
    <style>
        /* Add print styles for better browser-based PDF generation */
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        /* Add button for manual PDF generation */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            font-weight: bold;
        }
        
        .print-button:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="print-notice no-print" style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; font-weight: bold;">
        🖨️ Use your browser's Print function (Ctrl+P) to save as PDF
    </div>
    ${htmlContent}
</body>
</html>`;
    
    console.log('✅ HTML quote generated successfully');
    return standaloneHTML;
    
  } catch (error) {
    console.error('❌ HTML generation failed:', error);
    throw new Error(`Failed to generate HTML: ${error.message}`);
  }
}

// DOCX generation removed for better mobile experience
// Mobile users prefer PDF (professional) or HTML (responsive) formats
/*
export async function generateQuoteDOCX(data) {
  console.log('🔄 Generating DOCX as final fallback for quote:', data.quoteId);
  
  try {
    // Currency formatting function
    function formatCurrency(amount) {
      if (typeof amount !== 'number') return '0.00';
      return amount.toFixed(2);
    }

    // Date formatting function
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Create document sections
    const sections = [];

    // Header
    const headerParagraphs = [
      new Paragraph({
        text: "🔧 KIWI TRADE - QUOTE",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Quote ID: ${data.quoteId}`, bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Date: ${formatDate(data.quoteDate)}`, bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Valid Until: ${formatDate(data.validUntil)}`, bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" }), // Space
    ];

    // Customer Details Section
    const customerParagraphs = [
      new Paragraph({
        text: "Customer Details",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Name: ", bold: true }),
          new TextRun({ text: data.customerName || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Email: ", bold: true }),
          new TextRun({ text: data.customerEmail || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Phone: ", bold: true }),
          new TextRun({ text: data.customerPhone || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Address: ", bold: true }),
          new TextRun({ text: data.customerAddress || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Service: ", bold: true }),
          new TextRun({ text: data.serviceType || 'N/A' }),
        ],
      }),
      new Paragraph({ text: "" }), // Space
    ];

    // Tradesperson Details Section
    const tradespersonParagraphs = [
      new Paragraph({
        text: "Tradesperson Details",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Name: ", bold: true }),
          new TextRun({ text: data.tradespersonName || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Email: ", bold: true }),
          new TextRun({ text: data.tradespersonEmail || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Phone: ", bold: true }),
          new TextRun({ text: data.tradespersonPhone || 'N/A' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "License: ", bold: true }),
          new TextRun({ text: data.tradespersonLicense || 'N/A' }),
        ],
      }),
      new Paragraph({ text: "" }), // Space
    ];

    // Project Details Table
    const roomRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "Room Name", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [new Paragraph({ text: "Dimensions", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [new Paragraph({ text: "Square Meters", alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
    ];

    // Add room data rows
    if (data.rooms && data.rooms.length > 0) {
      data.rooms.forEach(room => {
        const sqm = parseFloat(room.sqm);
        const sqmDisplay = !isNaN(sqm) ? `${sqm.toFixed(1)}m²` : 'N/A';
        
        roomRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: room.name || 'N/A' })],
              }),
              new TableCell({
                children: [new Paragraph({ text: room.dimensions || 'N/A' })],
              }),
              new TableCell({
                children: [new Paragraph({ text: sqmDisplay })],
              }),
            ],
          })
        );
      });
    }

    const projectTable = new Table({
      rows: roomRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });

    // Quote Summary Table
    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Labour:", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${formatCurrency(data.totals?.labour || 0)}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Materials:", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${formatCurrency(data.totals?.materials || 0)}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Travel:", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${formatCurrency(data.totals?.travel || 0)}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Installation:", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${formatCurrency(data.totals?.installation || 0)}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Subtotal (excl. GST):", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `$${formatCurrency(data.totals?.subtotal || 0)}`, bold: true })], alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "GST (15%):", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${formatCurrency(data.totals?.gst || 0)}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "TOTAL (incl. GST):", bold: true, size: 28 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `$${formatCurrency(data.totals?.final || 0)}`, bold: true, size: 28 })], alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
    ];

    const summaryTable = new Table({
      rows: summaryRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });

    // Terms & Conditions
    const termsParagraphs = [
      new Paragraph({
        text: "Terms & Conditions",
        heading: HeadingLevel.HEADING_3,
      }),
      new Paragraph({
        text: "• This quote is valid for 14 days from the date of issue.",
      }),
      new Paragraph({
        text: "• Payment terms: 50% deposit required to commence work, balance due upon completion.",
      }),
      new Paragraph({
        text: "• All work is covered by our comprehensive warranty.",
      }),
      new Paragraph({
        text: "• We are fully licensed and insured for your peace of mind.",
      }),
      new Paragraph({ text: "" }), // Space
      new Paragraph({
        text: "Thank you for choosing Kiwi Trade for your underfloor heating needs.",
        alignment: AlignmentType.CENTER,
      }),
    ];

    // Combine all content
    const allContent = [
      ...headerParagraphs,
      ...customerParagraphs,
      ...tradespersonParagraphs,
      new Paragraph({
        text: "Project Details",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" }), // Space before table
      projectTable,
      new Paragraph({ text: "" }), // Space after table
      new Paragraph({
        text: "Quote Summary",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" }), // Space before table
      summaryTable,
      new Paragraph({ text: "" }), // Space after table
      ...termsParagraphs,
    ];

    // Create document
    const doc = new Document({
      sections: [
        {
          children: allContent,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`✅ DOCX backup generated successfully for Quote ${data.quoteId}`);
    
    return buffer;

  } catch (error) {
    console.error('❌ DOCX generation failed:', error);
    throw error;
  }
}
*/
