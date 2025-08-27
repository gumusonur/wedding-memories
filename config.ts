export enum StorageProvider {
  Cloudinary = 'cloudinary',
  S3 = 's3',
}

export enum Language {
  English = 'en',
  Turkish = 'tr',
}

export const appConfig = {
  brideName: 'Cathlene',
  groomName: 'Onur',
  guestIsolation: false,
  storage: StorageProvider.S3,
  defaultLanguage: Language.English,
  supportedLanguages: [Language.English, Language.Turkish],
};
