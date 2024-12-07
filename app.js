const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult } = require('express-validator');
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const moment = require('moment');

require('./utils/db');
const Contact = require('./model/contact');
const Admin = require('./model/admin');  // Menambahkan model Admin

const app = express();
const port = 3000;

// Setup method override
app.use(methodOverride('_method'));

// Setup moment
app.locals.moment = moment;

// Setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 600000 }, // Durasi sesi 10 menit
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Halaman Login Admin
app.get('/login', (req, res) => {
  const msg = req.flash('msg')[0] || ''; // Mengambil pesan pertama dari flash message, atau default ke string kosong
  res.render('login', { title: 'Login Admin', layout: 'layouts/layout-admin', msg });
});

// Proses Login Admin
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      req.flash('msg', 'Username tidak ditemukan');
      return res.redirect('/login');
    }

    if (admin.password !== password) {
      req.flash('msg', 'Password salah');
      return res.redirect('/login');
    }

    // Menyimpan data admin dalam session
    req.session.admin = admin;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat login');
  }
});



// Halaman Home (Admin harus login)
app.get('/', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login'); // Jika admin belum login, arahkan ke halaman login
  }
  res.render('index', {
    username: req.session.admin.username,
    title: 'Halaman utama',
    layout: 'layouts/main-layout',
  });
});



// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Terjadi kesalahan saat logout');
    }
    res.redirect('/login');  
  });
});  





// Halaman About
app.get('/about', (req, res) => {
  res.render('about', {
    layout: 'layouts/main-layout',
    title: 'Halaman About',
  });
});

// Halaman Contact
app.get('/contact', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login'); // Jika admin belum login, arahkan ke halaman login
  }

  try {
    const contacts = await Contact.find();
    const formattedContacts = contacts.map((contact) => ({
      ...contact._doc,
      tgl_masuk: moment(contact.tgl_masuk).format('DD-MM-YYYY'),
    }));

    res.render('contact', {
      layout: 'layouts/main-layout',
      title: 'Halaman Contact',
      contacts: formattedContacts,
      msg: req.flash('msg'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat mengambil data kontak');
  }
});





// Halaman tambah contact
app.get('/contact/add', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/login');
  }
  res.render('add-contact', {
    layout: 'layouts/main-layout',
    title: 'Form Tambah Data Contact',
  });
});

// Proses tambah data contact
app.post('/contact', [
  body('nisn').custom(async (value) => {
    const duplicate = await Contact.findOne({ nisn: value });
    if (duplicate) {
      throw new Error('NISN tidak valid / sudah digunakan');
    }
    return true;
  }),
  body('nik').custom(async (value) => {
    const duplicate = await Contact.findOne({ nik: value });
    if (duplicate) {
      throw new Error('NIK tidak valid / sudah digunakan');
    }
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('add-contact', {
      title: 'Form Tambah Data Contact',
      layout: 'layouts/main-layout',
      errors: errors.array(),
    });
  }

  try {
    await Contact.create(req.body);
    req.flash('msg', 'Data berhasil disimpan');
    res.redirect('/contact');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat menyimpan data');
  }
});

// Hapus data contact
app.get('/contact/delete/:nisn', async (req, res) => {
  try {
    const contact = await Contact.findOne({ nisn: req.params.nisn });
    if (!contact) {
      return res.status(404).send('<h1>404 Not Found</h1>');
    }
    await Contact.deleteOne({ nisn: req.params.nisn });
    req.flash('msg', 'Data berhasil dihapus');
    res.redirect('/contact');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat menghapus data');
  }
});

// Halaman edit contact
app.get('/contact/edit/:nisn', async (req, res) => {
  const contact = await Contact.findOne({ nisn: req.params.nisn });
  if (!contact) {
    return res.status(404).send('<h1>404 Not Found</h1>');
  }
  res.render('edit-contact', {
    layout: 'layouts/main-layout',
    title: 'Form Ubah Data Contact',
    contact,
  });
});

// Proses update data contact
app.put('/contact/update', [
  body('tingkat').notEmpty().withMessage('Tingkat tidak boleh kosong'),
  body('rombel').notEmpty().withMessage('Rombel tidak boleh kosong'),
  body('tgl_masuk').isISO8601().withMessage('Tanggal masuk harus format tanggal yang valid'),
  body('terdaftar').notEmpty().withMessage('Status terdaftar tidak boleh kosong'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const contact = await Contact.findById(req.body._id);
    return res.render('edit-contact', {
      title: 'Form Ubah Data Contact',
      layout: 'layouts/main-layout',
      errors: errors.array(),
      contact,
    });
  }

  try {
    await Contact.updateOne(
      { _id: req.body._id },
      { $set: req.body }
    );
    req.flash('msg', 'Data berhasil diubah!');
    res.redirect('/contact');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat memperbarui data');
  }
});

// Start server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
