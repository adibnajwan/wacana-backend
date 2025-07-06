// handlers/bookHandler.js
const { db } = require('../config/firebase');
const moment = require('moment-timezone');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: './serviceAccountKey.json' });

// Tambah Buku (Atmin)
// Tambah Buku (Admin)
const addBookHandler = async (request, h) => {
    const { title, author, genre, pageCount, published } = request.payload;

    // Validasi input
    if (!title || !author || !genre || !pageCount || !published) {
        return h.response({
            status: 'fail',
            message: 'All fields (title, author, genre, pageCount, published) are required!',
        }).code(400);
    }

    // Validasi genre agar admin juga tidak salah input
    const validGenres = [
        "Fantasi Tinggi (High Fantasy)",
        "Fantasi Rendah (Low Fantasy)",
        "Fiksi Ilmiah",
        "Horor Gotik",
        "Misteri Klasik",
        "Romansa Kontemporer",
        "Fiksi Sejarah",
        "Petualangan & Aksi",
        "Biografi & Memoar",
        "Pengembangan Diri (Self-help)",
        "Agama & Kepercayaan",
        "Filsafat",
        "Sejarah Dunia",
        "Politik & Sosial",
        "Bisnis & Ekonomi",
        "Kesehatan & Gaya Hidup",
        "Kuliner",
        "Seni & Desain",
        "Bahasa & Sastra",
        "Puisi / Sajak"
    ];

    if (!validGenres.includes(genre)) {
        return h.response({
            status: 'fail',
            message: 'Genre is not valid. Please select a genre from the provided options.',
        }).code(400);
    }

    try {
        // Cek apakah judul buku sudah ada di collection
        const existingBook = await db.collection('books').where('title', '==', title).get();

        if (!existingBook.empty) {
            return h.response({
                status: 'fail',
                message: 'A book with this title already exists!',
            }).code(400);
        }

        // Jika judul belum ada, lanjut menambahkan
        const bookRef = db.collection('books').doc(); // Auto-ID
        const bookId = bookRef.id;

        await bookRef.set({
            id: bookId,
            title,
            author,
            genre,
            pageCount,
            published,
        });

        return h.response({
            status: 'success',
            message: 'Book added successfully',
            data: { bookId },
        }).code(201);
    } catch (error) {
        console.error('Error adding book:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while adding the book',
        }).code(500);
    }
};



// Handler untuk mengambil semua buku
const getAllBooksHandler = async (request, h) => {
    try {
        const booksSnapshot = await db.collection('books').get();

        if (booksSnapshot.empty) {
            return h.response({
                status: 'success',
                message: 'No books found',
                data: [],
            }).code(200);
        }

        // Ambil semua data buku
        const books = booksSnapshot.docs.map(doc => doc.data());

        return h.response({
            status: 'success',
            message: 'Books retrieved successfully',
            data: books,
        }).code(200);
    } catch (error) {
        console.error('Error retrieving books:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while retrieving books',
        }).code(500);
    }
};


// Hapus buku berdasarkan judul
const deleteBookByTitleHandler = async (request, h) => {
    const { title } = request.query;

    if (!title) {
        return h.response({
            status: 'fail',
            message: 'Book title is required in query parameter',
        }).code(400);
    }

    try {
        // Cari buku dengan judul yang sesuai
        const booksSnapshot = await db.collection('books').where('title', '==', title).get();

        if (booksSnapshot.empty) {
            return h.response({
                status: 'fail',
                message: `Book with title "${title}" not found`,
            }).code(404);
        }

        // Hapus buku (karena judul unik, hanya 1 dokumen)
        const bookDoc = booksSnapshot.docs[0];
        await bookDoc.ref.delete();

        return h.response({
            status: 'success',
            message: `Book with title "${title}" deleted successfully`,
        }).code(200);
    } catch (error) {
        console.error('Error deleting book by title:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while deleting the book',
        }).code(500);
    }
};


//User add wishlist
// handlers/bookHandler.js
const addBookToUserLibraryHandler = async (request, h) => {
    const { userId } = request.auth; // Dapatkan userId dari token
    const { bookId } = request.payload;

    try {
        // Cari buku di public books
        const bookRef = db.collection('books').doc(bookId);
        const bookDoc = await bookRef.get();

        if (!bookDoc.exists) {
            return h.response({
                status: 'fail',
                message: 'Book not found in public collection',
            }).code(404);
        }

        const bookData = bookDoc.data();

        // Tambahkan ke subcollection user
        const userBookRef = db.collection('users').doc(userId).collection('books').doc(bookId);
        const addedAt = moment(new Date()).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
        await userBookRef.set({
            ...bookData,
            currentPage: 0, // User mulai dari halaman 0
            status: 'Unread',
            addedAt, //Konversi ke wib
        });

        return h.response({
            status: 'success',
            message: 'Book successfully added to your library',
        }).code(201);

    } catch (error) {
        console.error('Error adding book to user library:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while adding the book',
        }).code(500);
    }
};


//Get User Library
// handlers/bookHandler.js
const getUserLibraryHandler = async (request, h) => {
    const { userId } = request.auth; // Ambil userId dari token

    try {
        // Ambil semua buku dari subcollection books milik user
        const userBooksSnapshot = await db.collection('users').doc(userId).collection('books').get();

        // Jika user belum punya buku
        if (userBooksSnapshot.empty) {
            return h.response({
                status: 'success',
                message: 'No books found in your library',
                data: [],
            }).code(200);
        }

        // Ambil data semua buku
        const books = userBooksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return h.response({
            status: 'success',
            message: 'Books retrieved successfully',
            data: books,
        }).code(200);

    } catch (error) {
        console.error('Error fetching user library:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while fetching your library',
        }).code(500);
    }
};


//User Update Status Buku
// PATCH /users/books/{bookId}
const updateBookStatusHandler = async (request, h) => {
    try {
        const userId = request.auth?.userId; // Pastikan ambil userId dengan benar
        const { bookId } = request.params;
        const { currentPage } = request.payload;

        console.log('Available collections: books, users');
        console.log('✅ JWT validated successfully. userId:', userId);
        console.log('Book ID:', bookId);

        // Validasi input
        if (currentPage === undefined || currentPage < 0) {
            return h.response({
                status: 'fail',
                message: 'Current page is required and must be >= 0',
            }).code(400);
        }

        // Referensi Firestore dengan path string (lebih presisi)
        const bookPath = `users/${userId}/books/${bookId}`;
        const bookRef = db.doc(bookPath);
        const bookDoc = await bookRef.get();

        console.log('Book Reference Path:', bookPath);
        console.log('Book Document Exists:', bookDoc.exists);
        

        // Jika buku tidak ditemukan
        if (!bookDoc.exists) {
            return h.response({
                status: 'fail',
                message: 'Book not found in your library',
            }).code(404);
        }

        const bookData = bookDoc.data();

        // Tentukan status baru
        let newStatus = 'Unread';
        if (currentPage >= 1 && currentPage < bookData.pageCount) {
            newStatus = 'Reading';
        } else if (currentPage >= bookData.pageCount) {
            newStatus = 'Finished';
        }

        // Update buku
        await bookRef.update({
            currentPage,
            status: newStatus,
        });

        return h.response({
            status: 'success',
            message: `Book status updated to ${newStatus}`,
        }).code(200);

    } catch (error) {
        console.error('Error updating book status:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while updating the book status',
        }).code(500);
    }
};





// Tambah Buku (User)
// (...........)
// Tambah Buku (User) - Manual Input dengan Validasi Genre

const bucketName = 'pemrog-book-img';
const bucket = storage.bucket(bucketName);

const updateUserBookHandler = async (request, h) => {
    const { title, author, genre, pageCount, published, targetFinishDate } = request.payload;
    const { userId } = request.auth;
    const file = request.payload.image;

    // Validasi input
    if (!title || !author || !genre || !pageCount || !published || !targetFinishDate || !file) {
        return h.response({
            status: 'fail',
            message: 'All fields and image are required!',
        }).code(400);
    }

    // Konversi input string menjadi number
    const pageCountNum = parseInt(pageCount);
    const publishedNum = parseInt(published);

    if (isNaN(pageCountNum) || isNaN(publishedNum)) {
        return h.response({
            status: 'fail',
            message: 'pageCount and published must be numbers!',
        }).code(400);
    }

    // Validasi genre
    const validGenres = [
        "Fantasi Tinggi (High Fantasy)",
        "Fantasi Rendah (Low Fantasy)",
        "Fiksi Ilmiah",
        "Horor Gotik",
        "Misteri Klasik",
        "Romansa Kontemporer",
        "Fiksi Sejarah",
        "Petualangan & Aksi",
        "Biografi & Memoar",
        "Pengembangan Diri (Self-help)",
        "Agama & Kepercayaan",
        "Filsafat",
        "Sejarah Dunia",
        "Politik & Sosial",
        "Bisnis & Ekonomi",
        "Kesehatan & Gaya Hidup",
        "Kuliner",
        "Seni & Desain",
        "Bahasa & Sastra",
        "Puisi / Sajak"
    ];

    if (!validGenres.includes(genre)) {
        return h.response({
            status: 'fail',
            message: 'Genre is not valid. Please select a genre from the provided options.',
        }).code(400);
    }

    // Validasi targetFinishDate tidak boleh masa lalu
    const inputDate = new Date(targetFinishDate);
    const currentDate = new Date();
    if (inputDate < currentDate) {
        return h.response({
            status: 'fail',
            message: 'Target finish date cannot be in the past.',
        }).code(400);
    }

    // Upload gambar ke Google Cloud Storage
    const filename = `${Date.now()}-${file.hapi.filename}`;
    const fileRef = bucket.file(filename);

    const stream = fileRef.createWriteStream({
        metadata: { contentType: file.hapi.headers['content-type'] },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
            console.error(err);
            reject(h.response({
                status: 'error',
                message: 'Error uploading image',
            }).code(500));
        });

        stream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

            try {
                const bookRef = db.collection('users').doc(userId).collection('books').doc();
                const bookId = bookRef.id;

                await bookRef.set({
                    id: bookId,
                    title,
                    author,
                    genre,
                    pageCount: pageCountNum,
                    published: publishedNum,
                    currentPage: 0,
                    status: 'Unread',
                    imageUrl: publicUrl,
                    targetFinishDate: new Date(targetFinishDate),
                });

                resolve(h.response({
                    status: 'success',
                    message: 'Book added successfully to your library',
                    bookId,
                    imageUrl: publicUrl,
                }).code(201));
            } catch (error) {
                console.error('Error adding book to user library:', error.message);
                reject(h.response({
                    status: 'error',
                    message: 'An error occurred while adding the book to your library',
                }).code(500));
            }
        });

        file.pipe(stream);
    });
};


//User Delete Buku
// DELETE /users/books/{bookId}
const deleteUserBookHandler = async (request, h) => {
    const { userId } = request.auth;
    const { bookId } = request.params;

    try {
        // Referensi dokumen buku di subcollection
        const bookRef = db.collection('users').doc(userId).collection('books').doc(bookId);

        // Cek apakah buku ada
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) {
            return h.response({
                status: 'fail',
                message: 'Book not found in your library',
            }).code(404);
        }

        // Hapus buku
        await bookRef.delete();

        return h.response({
            status: 'success',
            message: 'Book successfully deleted from your library',
        }).code(200);
    } catch (error) {
        console.error('Error deleting book:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while deleting the book',
        }).code(500);
    }
};



// handlers/bookHandler.js (lanjutan)

const getUserBookHandler = async (request, h) => {
    const { userId } = request.auth;

    try {
        const booksSnapshot = await db.collection('users').doc(userId).collection('books').get();

        if (booksSnapshot.empty) {
            return h.response({
                status: 'success',
                message: 'No books found for this user',
                data: [],
            }).code(200);
        }

        const books = booksSnapshot.docs.map(doc => doc.data());

        return h.response({
            status: 'success',
            message: 'Books retrieved successfully',
            data: books,
        }).code(200);
    } catch (error) {
        console.error('Error retrieving books:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while retrieving books',
        }).code(500);
    }
};

const updateUserBookDataHandler = async (request, h) => {
    const { userId } = request.auth;
    const { bookId } = request.params;
    const payload = request.payload;

    try {
        const bookRef = db.collection('users').doc(userId).collection('books').doc(bookId);
        const bookDoc = await bookRef.get();

        if (!bookDoc.exists) {
            return h.response({
                status: 'fail',
                message: 'Book not found in your library',
            }).code(404);
        }

        const updateData = {};

        // Validasi dan tambahkan data yang dikirimkan
        if (payload.title) updateData.title = payload.title;
        if (payload.author) updateData.author = payload.author;
        if (payload.genre) {
            const validGenres = [
                "Fantasi Tinggi (High Fantasy)", "Fantasi Rendah (Low Fantasy)", "Fiksi Ilmiah",
                "Horor Gotik", "Misteri Klasik", "Romansa Kontemporer", "Fiksi Sejarah",
                "Petualangan & Aksi", "Biografi & Memoar", "Pengembangan Diri (Self-help)",
                "Agama & Kepercayaan", "Filsafat", "Sejarah Dunia", "Politik & Sosial",
                "Bisnis & Ekonomi", "Kesehatan & Gaya Hidup", "Kuliner", "Seni & Desain",
                "Bahasa & Sastra", "Puisi / Sajak"
            ];

            if (!validGenres.includes(payload.genre)) {
                return h.response({
                    status: 'fail',
                    message: 'Genre is not valid.',
                }).code(400);
            }
            updateData.genre = payload.genre;
        }

        if (payload.pageCount) {
            const pageCountNum = parseInt(payload.pageCount);
            if (isNaN(pageCountNum)) {
                return h.response({
                    status: 'fail',
                    message: 'pageCount must be a number!',
                }).code(400);
            }
            updateData.pageCount = pageCountNum;
        }

        if (payload.published) {
            const publishedNum = parseInt(payload.published);
            if (isNaN(publishedNum)) {
                return h.response({
                    status: 'fail',
                    message: 'published must be a number!',
                }).code(400);
            }
            updateData.published = publishedNum;
        }

        if (payload.targetFinishDate) {
            const inputDate = new Date(payload.targetFinishDate);
            const currentDate = new Date();
            if (inputDate < currentDate) {
                return h.response({
                    status: 'fail',
                    message: 'Target finish date cannot be in the past.',
                }).code(400);
            }
            updateData.targetFinishDate = inputDate;
        }

        // Jika ada gambar baru
        if (payload.image) {
            const file = payload.image;
            const filename = `${Date.now()}-${file.hapi.filename}`;
            const fileRef = bucket.file(filename);

            const stream = fileRef.createWriteStream({
                metadata: { contentType: file.hapi.headers['content-type'] },
            });

            await new Promise((resolve, reject) => {
                stream.on('error', (err) => {
                    console.error(err);
                    reject(err);
                });

                stream.on('finish', () => resolve());
                file.pipe(stream);
            });

            // Buat URL gambar baru
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
            updateData.imageUrl = publicUrl;
        }

        // Lakukan update
        await bookRef.update(updateData);

        return h.response({
            status: 'success',
            message: 'Book updated successfully',
            data: updateData,
        }).code(200);

    } catch (error) {
        console.error('Error updating book:', error.message);
        return h.response({
            status: 'error',
            message: 'An error occurred while updating the book',
        }).code(500);
    }
};


module.exports = { addBookHandler, getAllBooksHandler, deleteBookByTitleHandler, addBookToUserLibraryHandler , getUserLibraryHandler, updateBookStatusHandler, deleteUserBookHandler, updateUserBookHandler, getUserBookHandler, updateUserBookDataHandler };


