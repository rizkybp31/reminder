import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
    const superuserEmail = 'superuser@rutan.go.id';
    const superuserName = 'Super User';
    const superuserPassword = 'superuser123';
    const superuserPhoneNumber = '08123456789';

    console.log('Checking for existing superuser...');

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: superuserEmail },
        });

        if (existingUser) {
            console.log('Superuser already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash(superuserPassword, 10);

        const superuser = await prisma.user.create({
            data: {
                name: superuserName,
                email: superuserEmail,
                password: hashedPassword,
                role: 'superuser',
                phoneNumber: superuserPhoneNumber,
            },
        });

        console.log('✅ Superuser created successfully:');
        console.log('Email:', superuser.email);
        console.log('Password:', superuserPassword);
    } catch (error) {
        console.error('Error in seed:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
