/** Character appearance palette — skin, hair style/color, shirt, pants, shoes */
export interface CharacterPalette {
  skin: string;
  skinShadow: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'ponytail' | 'buzz' | 'curly';
  shirt: string;
  shirtShadow: string;
  pants: string;
  shoes: string;
}

/** 8 predefined palettes for character variety */
const PALETTES: CharacterPalette[] = [
  {
    skin: '#f0d0a0',
    skinShadow: '#d4b080',
    hair: '#5a3820',
    hairStyle: 'short',
    shirt: '#4488cc',
    shirtShadow: '#336699',
    pants: '#3a3a5a',
    shoes: '#2a2a2a',
  },
  {
    skin: '#e8c090',
    skinShadow: '#c9a070',
    hair: '#222222',
    hairStyle: 'curly',
    shirt: '#cc4444',
    shirtShadow: '#993333',
    pants: '#2c3e50',
    shoes: '#1a1a1a',
  },
  {
    skin: '#c68642',
    skinShadow: '#a06830',
    hair: '#1a1a1a',
    hairStyle: 'buzz',
    shirt: '#48a860',
    shirtShadow: '#307040',
    pants: '#34495e',
    shoes: '#222222',
  },
  {
    skin: '#ffe0bd',
    skinShadow: '#ddc0a0',
    hair: '#e8b040',
    hairStyle: 'long',
    shirt: '#8855aa',
    shirtShadow: '#664488',
    pants: '#3a3a5a',
    shoes: '#2a2020',
  },
  {
    skin: '#8d5524',
    skinShadow: '#704218',
    hair: '#1a1a1a',
    hairStyle: 'short',
    shirt: '#e0a030',
    shirtShadow: '#b88020',
    pants: '#2c3444',
    shoes: '#1a1a1a',
  },
  {
    skin: '#f0d0a0',
    skinShadow: '#d4b080',
    hair: '#aa3322',
    hairStyle: 'ponytail',
    shirt: '#3090b0',
    shirtShadow: '#206080',
    pants: '#3a3a5a',
    shoes: '#2a2a2a',
  },
  {
    skin: '#d4a06a',
    skinShadow: '#b08050',
    hair: '#3a2a1a',
    hairStyle: 'curly',
    shirt: '#d06080',
    shirtShadow: '#a04860',
    pants: '#2c3e50',
    shoes: '#222222',
  },
  {
    skin: '#ffe8d0',
    skinShadow: '#e0c8b0',
    hair: '#444444',
    hairStyle: 'long',
    shirt: '#5588aa',
    shirtShadow: '#3a6688',
    pants: '#34495e',
    shoes: '#1a1a1a',
  },
];

/** Hash a character ID to a palette index (0-7) */
export function getPaletteIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PALETTES.length;
}

/** Get palette by index */
export function getPalette(index: number): CharacterPalette {
  return PALETTES[index % PALETTES.length];
}
