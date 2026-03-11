import 'dotenv/config';
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.split(':')[0]);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
