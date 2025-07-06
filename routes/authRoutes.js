const { auth } = require('firebase-admin');
const { registerHandler, loginHandler, getUserByIdHandler } = require('../handlers/authHandler');
const { updateUserBookHandler, getUserBookHandler} = require('../handlers/bookHandler')
const { validateToken } = require('../middlewares/authMiddleware');
const authRoutes = [
    {
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return {
                status: 'success',
                message: 'Berhasil',
            };
        }
    },
    {
        method: 'POST',
        path: '/register',
        handler: registerHandler,
    },
    {
        method: 'POST',
        path: '/auth/login',
        handler: loginHandler,
    },
       {
        method: 'GET',
        path: '/users/id',
        handler: getUserByIdHandler,
        options: {
            pre: [
                { method: validateToken, },  // Menggunakan validateToken sebagai middleware
            ],
        },
    },
{
        method: 'POST',
        path: '/users/books',
        handler: updateUserBookHandler,
        options: {
            pre: [
                { method: validateToken },
            ],
            payload: {
                maxBytes: 5 * 1024 * 1024, // Maksimal 5 MB
                output: 'stream', // Untuk upload file
                parse: true, // Otomatis parsing multipart/form-data
                multipart: true, // Support upload file
            },
        },
    },
    {
        method: 'GET',
        path: '/users/book',
        handler: getUserBookHandler,
        options: {
            pre: [
                { method: validateToken, }, // Pastikan token valid
            ],
        },
    },
];


module.exports = authRoutes;
