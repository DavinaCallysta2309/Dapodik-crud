const mongoose = require('mongoose');

// Koneksi ke MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/dapodik', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});


// Menambahkan 1 data
// const contact1 = new Contact({
//     nama: 'Devi subianti',
//     jk: 'P',
//     nisn: '12329233',
//     nik: '5206085405880001 ',
//     nokk: '5315031911150001',
//     tingkat: 'X',
//     rombel: 'PPLG 1',
//     tgl_masuk: new Date('2023-06-23'), // Format tanggal yang benar
//     terdaftar: 'Siswa Baru',
//     ttl: '29-06-2007'
// });

// // Simpan ke collection
// contact1.save()
//     .then((contact) => console.log('Data berhasil disimpan:', contact))
//     .catch((err) => console.error('Terjadi kesalahan:', err));
