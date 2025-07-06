    const { validateToken } = require('../middlewares/authMiddleware');
    const { addBookHandler, getAllBooksHandler, deleteBookByTitleHandler, addBookToUserLibraryHandler, getUserLibraryHandler, updateBookStatusHandler, deleteUserBookHandler, updateUserBookDataHandler} = require('../handlers/bookHandler')

    const bookRoutes = [ 
        {
            method: 'POST',
            path: '/admin/addBooks',
            handler: addBookHandler,
            options: {
                // Untuk sekarang tanpa proteksi admin dulu
                // Nanti bisa ditambahkan role admin di sini
            },
        },
        {
            method: 'GET',
            path: '/admin/getBooks',
            handler: getAllBooksHandler,
        },
                {
            method: 'DELETE',
            path: '/admin/deleteBooks',
            handler: deleteBookByTitleHandler,
        },
        {
            method: 'POST',
            path: '/users/libBooks',
            handler: addBookToUserLibraryHandler,
            options: {
                pre: [{ method: validateToken }],
            },
        },
        // routes/bookRoutes.js
        {
            method: 'GET',
            path: '/users/libBooks',
            handler: getUserLibraryHandler,
            options: {
                pre: [{ method: validateToken }],
            },
        }, // routes/bookRoutes.js
        {
            method: 'PATCH',
            path: '/users/booksStatus/{bookId}',
            handler: updateBookStatusHandler,
            options: {
                pre: [{ method: validateToken }],
            },
        },

        {
            method: 'DELETE',
            path: '/users/books/{bookId}',
            handler: deleteUserBookHandler,
            options: {
                pre: [
                    { method: validateToken },
                ],
            },
        },
        {
            method: 'PATCH',
            path: '/users/books/{bookId}',
            handler: updateUserBookDataHandler,
            options: {
                payload: {
                    output: 'stream',
                    parse: true,
                    multipart: true,
                    maxBytes: 10485760, // 10 MB
                },
                pre: [
                    { method: validateToken },
                ],
            },
        },




    ];

    module.exports = bookRoutes;