// Aircraft Makes and Models Database (for dropdown population)
export const aircraftMakes = [
  'Cessna',
  'Piper',
  'Beechcraft',
  'Cirrus',
  'Diamond',
  'Mooney',
  'Robinson',
  'Bell',
  'Airbus',
  'Boeing',
  'Embraer',
  'Other'
];

export const aircraftModels = {
  'Cessna': [
    '150', '152', '162 Skycatcher', '170', '172 Skyhawk', '172S', '175 Skylark',
    '177 Cardinal', '180 Skywagon', '182 Skylane', '185 Skywagon', '188',
    '206 Stationair', '210 Centurion', '208 Caravan', '310', '337 Skymaster',
    '340', '350', '400 Corvalis', '401', '402', '404 Titan', '411', '414',
    '421 Golden Eagle', '425 Corsair', '441 Conquest', 'Citation I',
    'Citation II', 'Citation III', 'Citation V', 'Citation X', 'Citation CJ',
    'Citation Mustang', 'Citation Sovereign', 'Other'
  ],
  'Piper': [
    'Cub', 'PA-18 Super Cub', 'PA-28 Cherokee', 'PA-28R Arrow', 'PA-32 Cherokee Six',
    'PA-32R Saratoga', 'PA-34 Seneca', 'PA-38 Tomahawk', 'PA-44 Seminole',
    'PA-46 Malibu', 'PA-46 Meridian', 'Archer', 'Warrior', 'Dakota', 'Lance',
    'Seneca', 'Aztec', 'Navajo', 'Cheyenne', 'Chieftain', 'Other'
  ],
  'Beechcraft': [
    'Bonanza', 'Baron', 'King Air 90', 'King Air 200', 'King Air 300', 'King Air 350',
    'Duchess', 'Skipper', 'Sundowner', 'Musketeer', 'Debonair', 'Travel Air',
    'Queen Air', 'Model 18', 'T-34 Mentor', 'Other'
  ],
  'Cirrus': ['SR20', 'SR22', 'SR22T', 'SF50 Vision Jet', 'Other'],
  'Diamond': ['DA20', 'DA40', 'DA42', 'DA50', 'DA62', 'Other'],
  'Mooney': ['M20', 'M20C', 'M20E', 'M20F', 'M20J', 'M20K', 'M20M', 'M20R', 'M20S', 'M20TN', 'Other'],
  'Robinson': ['R22', 'R44', 'R66', 'Other'],
  'Bell': ['206', '407', '429', '505', 'Other'],
  'Airbus': ['A320', 'A321', 'A330', 'A340', 'A350', 'A380', 'Other'],
  'Boeing': ['737', '747', '757', '767', '777', '787', 'Other'],
  'Embraer': ['ERJ-135', 'ERJ-145', 'E170', 'E175', 'E190', 'E195', 'Other'],
  'Other': ['Other']
};

export const getModelsForMake = (make) => {
  return aircraftModels[make] || [];
};

// Aircraft Categories (FAA Standard - Always Available)
export const aircraftCategories = [
  'Airplane',
  'Rotorcraft',
  'Glider',
  'Lighter-than-Air',
  'Powered Lift',
  'Simulator'
];

// Aircraft Classes (FAA)
export const aircraftClasses = {
  'Airplane': ['ASEL', 'AMEL', 'ASES', 'AMES'],
  'Rotorcraft': ['Helicopter', 'Gyroplane'],
  'Glider': ['Glider'],
  'Lighter-than-Air': ['Airship', 'Balloon'],
  'Powered Lift': ['Powered Lift'],
  'Simulator': ['FFS', 'FTD', 'ATD']
};

export const getClassesForCategory = (category) => {
  return aircraftClasses[category] || [];
};

// Simulator Device Types
export const simulatorTypes = [
  { value: 'FFS', label: 'FFS - Full Flight Simulator' },
  { value: 'FTD', label: 'FTD - Flight Training Device' },
  { value: 'ATD', label: 'ATD - Aviation Training Device' }
];
