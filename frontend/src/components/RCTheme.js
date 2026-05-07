export const RC = {
  // Brand
  crimson:      '#C2175B',
  crimsonDark:  '#9C1348',
  crimsonLight: '#F48FB1',
  pinkBg:       '#FBE4EC',
  pinkSoft:     '#FDE8F0',

  // Success / green
  green:        '#43A047',
  greenDark:    '#2E7D32',
  greenLight:   '#E8F5E9',
  greenMid:     '#A5D6A7',

  // Status card backgrounds
  cardPink:     '#FBE4EC',
  cardGreen:    '#E8F5E9',
  cardYellow:   '#FFF8E1',
  cardBlue:     '#E3F2FD',
  cardOrange:   '#FFF3E0',

  // Text
  textDark:     '#1A1A2E',
  textMid:      '#4A4A6A',
  textMuted:    '#9E9E9E',

  // Utility
  border:       '#E8E8F0',
  surface:      '#FFFFFF',
  bg:           '#F8F4F6',
};

// Status badge config — centralised so every dashboard is consistent
export const STATUS_CONFIG = {
  PENDING:    { bg: '#FFF8E1', color: '#E65100',  border: '#FFCC02', label: 'Pending'    },
  ACCEPTED:   { bg: '#E8F5E9', color: '#2E7D32',  border: '#81C784', label: 'Accepted'   },
  REJECTED:   { bg: '#FBE4EC', color: '#C2175B',  border: '#F48FB1', label: 'Rejected'   },
  CANCELLED:  { bg: '#F5F5F5', color: '#757575',  border: '#BDBDBD', label: 'Cancelled'  },
  ASSIGNED:   { bg: '#EDE7F6', color: '#512DA8',  border: '#B39DDB', label: 'Assigned'   },
  IN_TRANSIT: { bg: '#E3F2FD', color: '#1565C0',  border: '#90CAF9', label: 'In Transit' },
  DELIVERED:  { bg: '#E8F5E9', color: '#2E7D32',  border: '#81C784', label: 'Delivered'  },
};
