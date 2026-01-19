// Aircraft Make and Model lookup data
// Used for logbook entries - Make & Model are for logbook accuracy, not displayed on FAA Form 8710

export const aircraftMakes = [
  'Cessna',
  'Piper',
  'Beechcraft',
  'Mooney',
  'Cirrus',
  'Diamond',
  'Grumman',
  'Bellanca',
  'Aerospatiale',
  'Robinson',
  'Bell',
  'Sikorsky',
  'Eurocopter',
  'Airbus Helicopters',
  'Schweizer',
  'Enstrom',
  'Other'
];

export const aircraftModelsByMake = {
  'Cessna': [
    '150',
    '152',
    '172',
    '172SP',
    '172RG',
    '175',
    '177',
    '180',
    '182',
    '182RG',
    '185',
    '188',
    '190',
    '195',
    '206',
    '207',
    '208',
    '210',
    '310',
    '320',
    '337',
    '340',
    '402',
    '404',
    '414',
    '421',
    '425',
    '441',
    '500',
    '501',
    '510',
    '525',
    '550',
    '560',
    '650',
    '680',
    '750',
    'Citation',
    'Other'
  ],
  'Piper': [
    'PA-18',
    'PA-20',
    'PA-22',
    'PA-23',
    'PA-24',
    'PA-28',
    'PA-30',
    'PA-31',
    'PA-32',
    'PA-34',
    'PA-38',
    'PA-44',
    'PA-46',
    'PA-60',
    'Other'
  ],
  'Beechcraft': [
    'Bonanza',
    'Baron',
    'King Air',
    'Queen Air',
    'Twin Bonanza',
    'Travel Air',
    'Musketeer',
    'Sundowner',
    'Sierra',
    'Skipper',
    'Debonair',
    'Other'
  ],
  'Mooney': [
    'M20',
    'M20A',
    'M20B',
    'M20C',
    'M20D',
    'M20E',
    'M20F',
    'M20G',
    'M20J',
    'M20K',
    'M20L',
    'M20M',
    'M20R',
    'M20S',
    'M20TN',
    'M20U',
    'Other'
  ],
  'Cirrus': [
    'SR20',
    'SR22',
    'SR22T',
    'SF50',
    'Other'
  ],
  'Diamond': [
    'DA20',
    'DA40',
    'DA42',
    'DA62',
    'Other'
  ],
  'Grumman': [
    'AA-1',
    'AA-5',
    'G-164',
    'Other'
  ],
  'Bellanca': [
    'Citabria',
    'Decathlon',
    'Scout',
    'Other'
  ],
  'Aerospatiale': [
    'AS350',
    'AS355',
    'AS365',
    'Other'
  ],
  'Robinson': [
    'R22',
    'R44',
    'R66',
    'Other'
  ],
  'Bell': [
    '206',
    '407',
    '412',
    '429',
    '430',
    'Other'
  ],
  'Sikorsky': [
    'S-76',
    'S-92',
    'Other'
  ],
  'Eurocopter': [
    'EC120',
    'EC130',
    'EC135',
    'EC145',
    'EC155',
    'Other'
  ],
  'Airbus Helicopters': [
    'H125',
    'H130',
    'H135',
    'H145',
    'H155',
    'H175',
    'Other'
  ],
  'Schweizer': [
    '269',
    '300',
    '330',
    'Other'
  ],
  'Enstrom': [
    'F-28',
    '280',
    '480',
    'Other'
  ],
  'Other': []
};

// Helper function to get models for a given make
export const getModelsForMake = (make) => {
  return aircraftModelsByMake[make] || [];
};
