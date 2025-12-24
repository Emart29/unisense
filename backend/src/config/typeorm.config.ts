import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://unisense_user:unisense_password@localhost:5432/unisense',
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
