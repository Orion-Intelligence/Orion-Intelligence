export const LANGUAGE_MAP: Record<string, { iso1: string, name: string }> = {
  eng: {iso1: 'en', name: 'English'},
  fra: {iso1: 'fr', name: 'French'},
  spa: {iso1: 'es', name: 'Spanish'},
  deu: {iso1: 'de', name: 'German'},
  ita: {iso1: 'it', name: 'Italian'},
  por: {iso1: 'pt', name: 'Portuguese'},
  rus: {iso1: 'ru', name: 'Russian'},
  zho: {iso1: 'zh', name: 'Chinese'},
  jpn: {iso1: 'ja', name: 'Japanese'},
  kor: {iso1: 'ko', name: 'Korean'},
  ara: {iso1: 'ar', name: 'Arabic'},
  hin: {iso1: 'hi', name: 'Hindi'},
  ben: {iso1: 'bn', name: 'Bengali'},
  tur: {iso1: 'tr', name: 'Turkish'},
  nld: {iso1: 'nl', name: 'Dutch'},
  swe: {iso1: 'sv', name: 'Swedish'},
  pol: {iso1: 'pl', name: 'Polish'},
  ces: {iso1: 'cs', name: 'Czech'}
};

export const DUMP_SOURCE_MAP: Record<number, { name: string }> = {
  1: { name: 'Telegram' },
};

export const DUMP_GROUP_MAP: Record<number, { name: string }> = {
  1: { name: 'Dataleak 2025' },
};

export const ChannelTypeKeys = [
  'BREACH',
  'CVE',
  'ZERODAY',
  'TOOLS',
  'WARFARE',
  'EMAIL',
  'LOGS',
  'CLOUD',
  'NEWS'
];
