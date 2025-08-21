export enum StorageProvider {
  Cloudinary = 'cloudinary',
  S3 = 's3',
}

export const appConfig = {
  brideName: 'Cathlene',
  groomName: 'Onur',
  guestIsolation: true,
  storage: StorageProvider.S3,
};
