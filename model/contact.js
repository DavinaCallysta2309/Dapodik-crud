// Membuat skema
const mongoose = require('mongoose');
const Contact = mongoose.model('Siswa', {
    nama: { type: String, required: true },
    jk: { type: String, required: true },
    nisn: { type: String, required: true },
    nik: { type: String, required: true },
    nokk: { type: String, required: true },
    tingkat: { type: String, required: true },
    rombel: { type: String, required: true },
    tgl_masuk: { type: Date, required: true },
    terdaftar: { type: String, required: true },
    ttl: { type: String, required: true },
});



module.exports = Contact ;