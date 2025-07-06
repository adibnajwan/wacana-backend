require('dotenv').config();
const Hapi = require('@hapi/hapi');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes'); // Tambahkan routes buku

const init = async () => {
    const server = Hapi.server({
        port: 9000,
        host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // Tambahkan prefix `/api/v1` untuk semua route
    server.realm.modifiers.route.prefix = '/api/v1';

    await server.start();
    console.log(`Server berjalan di ${server.info.uri}/api/v1`);

    // Gabungkan semua routes
    server.route([...authRoutes, ...bookRoutes]);
};

init();
