// RC Foundation Brand Colors — extracted from official PPT
export const RC = {
  // Primary
  crimson:        '#C2175B',  // main brand — headers, buttons, active states
  crimsonDark:    '#9C1348',  // hover states
  crimsonLight:   '#F48FB1',  // subtle accents

  // Backgrounds
  pinkBg:         '#FBE4EC',  // light pink — card backgrounds
  pinkSoft:       '#FDE8F0',  // very light pink — page tones
  whiteBg:        '#FFFFFF',

  // Green family
  green:          '#66BB6A',  // accent stripe, success badges
  greenDark:      '#2F7D32',  // dark headers, strong text
  greenLight:     '#E8F6E9',  // light green cards
  greenMid:       '#A5D6A7',  // mid-tone

  // Card accent colors (from slide 2 cards)
  cardPink:       '#FBE4EC',
  cardGreen:      '#E8F6E9',
  cardYellow:     '#FFF8E1',
  cardBlue:       '#E3F2FD',
  cardOrange:     '#FFF3E0',

  // Footer / strip
  footerPink:     '#E48FAC',
  footerGreen:    '#66BB6A',

  // Text
  textDark:       '#1A1A2E',
  textMid:        '#4A4A6A',
  textMuted:      '#888888',
  textOnCrimson:  '#FFFFFF',
  textOnGreen:    '#FFFFFF',
};

// Tailwind inline-style helpers (since we can't extend tailwind config at runtime)
export const rcStyle = {
  bgCrimson:    { backgroundColor: RC.crimson },
  bgPink:       { backgroundColor: RC.pinkBg },
  bgGreen:      { backgroundColor: RC.green },
  bgGreenDark:  { backgroundColor: RC.greenDark },
  bgGreenLight: { backgroundColor: RC.greenLight },
  bgYellow:     { backgroundColor: RC.cardYellow },
  bgBlue:       { backgroundColor: RC.cardBlue },
  textCrimson:  { color: RC.crimson },
  textGreen:    { color: RC.greenDark },
  borderCrimson:{ borderColor: RC.crimson },
  borderGreen:  { borderColor: RC.green },
};
