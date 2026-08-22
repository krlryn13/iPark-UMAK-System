// Location & Route Database for University of Makati (UMak)

export const UMAK_COORDINATES = {
  center: [14.56335, 121.05600],
  zoom: 18,
};

export const CAMPUS_GATES = [
  {
    id: 'main-gate',
    name: 'Main Gate (J.P. Rizal Ext Entrance)',
    lat: 14.56405,
    lng: 121.05590,
    icon: 'fa-archway',
    description: 'Main campus vehicle gate on J.P. Rizal Extension at the top north road entrance.',
  },
  {
    id: 'west-rembo-gate',
    name: 'West Rembo Access Gate',
    lat: 14.56410,
    lng: 121.05650,
    icon: 'fa-door-open',
    description: 'Secondary access gate near Lawton Avenue junction.',
  },
  {
    id: 'hpsb-gate',
    name: 'HPSB Parking Entrance Ramp',
    lat: 14.56265,
    lng: 121.05630,
    icon: 'fa-square-parking',
    description: 'Dedicated parking entrance ramp at the Health & Physical Science Building.',
  },
];

export const LOCATION_GUIDES = {
  'ohso-office': {
    title: 'OHSO (Occupational Health & Safety Office)',
    building: 'Administration Building - Ground Floor',
    lat: 14.56345,
    lng: 121.05595,
    icon: 'fa-shield-halved',
    color: 'amber',
    badge: 'Sticker Pickup & Admin',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56345,121.05595&destination_place_id=University+of+Makati',
    waypoints: [
      [14.56405, 121.05590], // Main Gate top entrance
      [14.56360, 121.05585], // Quadrangle walkway
      [14.56345, 121.05595], // Admin Bldg Ground Floor Room 104
    ],
    steps: [
      {
        step: 1,
        title: 'Enter via Main Campus Gate (J.P. Rizal Ext)',
        desc: 'Present your UMak ID or guest appointment slip at the J.P. Rizal Ext main gate at the top entrance road.',
        icon: 'fa-id-card',
      },
      {
        step: 2,
        title: 'Walk towards Administration Building',
        desc: 'Head straight along the covered walkway past the central quadrangle.',
        icon: 'fa-person-walking',
      },
      {
        step: 3,
        title: 'Locate OHSO Office (Ground Floor)',
        desc: 'Turn right at the main lobby. Room 104 - Occupational Health & Safety Office for parking sticker release.',
        icon: 'fa-door-closed',
      },
    ],
    tips: [
      'Bring 1 valid ID and your online sticker application QR code.',
      'Office hours: Mon - Fri, 8:00 AM - 5:00 PM.',
    ],
  },

  'hpsb-ground': {
    title: 'HPSB Parking - Ground Floor',
    building: 'Health & Physical Science Building',
    lat: 14.56265,
    lng: 121.05630,
    icon: 'fa-square-parking',
    color: 'emerald',
    badge: 'Faculty & PWD Priority',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56265,121.05630',
    waypoints: [
      [14.56405, 121.05590], // Main Gate top entrance at J.P. Rizal Ext
      [14.56340, 121.05592], // Driving south along main campus road (between Academic Bldg 2 & Stadium)
      [14.56285, 121.05595], // Southern end of main road
      [14.56275, 121.05615], // Turning east towards HPSB building
      [14.56265, 121.05630], // HPSB Building Parking Entrance Ramp
    ],
    steps: [
      {
        step: 1,
        title: 'Enter via Main Gate at J.P. Rizal Extension',
        desc: 'Drive through the top main gate entrance on J.P. Rizal Ext (between Academic Bldg 2 and UMak Stadium).',
        icon: 'fa-car',
      },
      {
        step: 2,
        title: 'Drive South along Main Campus Road',
        desc: 'Drive straight down the main inner road past the stadium, then turn left towards HPSB.',
        icon: 'fa-diamond-turn-right',
      },
      {
        step: 3,
        title: 'Enter HPSB Parking Entrance Ramp',
        desc: 'Turn right into the dedicated entrance ramp of the Health & Physical Science Building.',
        icon: 'fa-square-parking',
      },
    ],
    tips: ['Motorcycles have designated bays on the right side of the ground floor entrance.'],
  },

  'hpsb-2nd': {
    title: 'HPSB Parking - 2nd Floor',
    building: 'Health & Physical Science Building',
    lat: 14.56268,
    lng: 121.05633,
    icon: 'fa-square-parking',
    color: 'blue',
    badge: 'Student & Employee Parking',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56268,121.05633',
    waypoints: [
      [14.56405, 121.05590],
      [14.56340, 121.05592],
      [14.56285, 121.05595],
      [14.56275, 121.05615],
      [14.56268, 121.05633],
    ],
    steps: [
      {
        step: 1,
        title: 'Enter via Main Gate at J.P. Rizal Extension',
        desc: 'Drive south down the main campus road past the stadium.',
        icon: 'fa-car',
      },
      {
        step: 2,
        title: 'Ascend Level 2 Spiral Ramp',
        desc: 'Keep right on the driving ramp and maintain speed under 15 km/h.',
        icon: 'fa-arrow-up-right-dots',
      },
      {
        step: 3,
        title: 'Park at Level 2 Bays',
        desc: 'Display your official UMak vehicle sticker on the windshield.',
        icon: 'fa-square-parking',
      },
    ],
    tips: ['Speed limit inside ramp is 15 km/h.'],
  },

  'hpsb-3rd': {
    title: 'HPSB Parking - 3rd Floor',
    building: 'Health & Physical Science Building',
    lat: 14.56271,
    lng: 121.05636,
    icon: 'fa-square-parking',
    color: 'purple',
    badge: 'Student & Visitor Overflow',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56271,121.05636',
    waypoints: [
      [14.56405, 121.05590],
      [14.56340, 121.05592],
      [14.56285, 121.05595],
      [14.56275, 121.05615],
      [14.56271, 121.05636],
    ],
    steps: [
      {
        step: 1,
        title: 'Enter HPSB Parking Structure',
        desc: 'Drive into HPSB building parking structure.',
        icon: 'fa-car',
      },
      {
        step: 2,
        title: 'Drive up to 3rd Floor Ramp',
        desc: 'Follow overhead digital directional signage showing available counts.',
        icon: 'fa-arrow-trend-up',
      },
    ],
    tips: ['Elevator access directly leads to 3rd floor academic wing.'],
  },

  'hpsb-4th': {
    title: 'HPSB Parking - 4th Floor',
    building: 'Health & Physical Science Building',
    lat: 14.56275,
    lng: 121.05640,
    icon: 'fa-square-parking',
    color: 'cyan',
    badge: 'Upper Level Reserve',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56275,121.05640',
    waypoints: [
      [14.56405, 121.05590],
      [14.56340, 121.05592],
      [14.56285, 121.05595],
      [14.56275, 121.05615],
      [14.56275, 121.05640],
    ],
    steps: [
      {
        step: 1,
        title: 'Ascend to 4th Level Ramp',
        desc: 'Follow green arrows to the top level parking floor.',
        icon: 'fa-arrow-up',
      },
      {
        step: 2,
        title: 'Select Open Parking Slot',
        desc: 'Covered rooftop bays available for full-day campus parking.',
        icon: 'fa-square-parking',
      },
    ],
    tips: ['Direct stairwell connection to sports complex & auditorium.'],
  },

  'default': {
    title: 'University of Makati Campus',
    building: 'Main Campus Grounds',
    lat: 14.56345,
    lng: 121.05612,
    icon: 'fa-graduation-cap',
    color: 'umak-blue',
    badge: 'Campus General',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=14.56345,121.05612&destination_place_id=University+of+Makati',
    waypoints: [
      [14.56320, 121.05580],
      [14.56345, 121.05612],
    ],
    steps: [
      {
        step: 1,
        title: 'Navigate to J.P. Rizal Extension',
        desc: 'University of Makati is situated near Lawton Ave & Fort Bonifacio junction.',
        icon: 'fa-map-location-dot',
      },
      {
        step: 2,
        title: 'Enter Security Control Gate',
        desc: 'Show QR code or vehicle pass to security officers.',
        icon: 'fa-shield-halved',
      },
    ],
    tips: ['Visitors should register at the gate guard house before entry.'],
  },
};

export const getGuideForLocation = (lotNameOrId) => {
  if (!lotNameOrId) return LOCATION_GUIDES['default'];
  const key = String(lotNameOrId).toLowerCase();

  if (key.includes('ohso') || key.includes('sticker') || key.includes('pickup')) {
    return LOCATION_GUIDES['ohso-office'];
  }
  if (key.includes('ground') || key.includes('1st')) {
    return LOCATION_GUIDES['hpsb-ground'];
  }
  if (key.includes('2nd')) {
    return LOCATION_GUIDES['hpsb-2nd'];
  }
  if (key.includes('3rd')) {
    return LOCATION_GUIDES['hpsb-3rd'];
  }
  if (key.includes('4th')) {
    return LOCATION_GUIDES['hpsb-4th'];
  }

  return LOCATION_GUIDES['default'];
};
