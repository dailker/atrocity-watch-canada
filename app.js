const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Atrocity = require('./models/Atrocity');
const AtrocityType = require('./models/AtrocityType');
const AtrocityLog = require('./models/AtrocityLog');
const Publication = require('./models/Publication');
const PressRelease = require('./models/PressRelease');
const PublicationLog = require('./models/PublicationLog');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'S6CRET@**!(()!)!)!', resave: false, saveUninitialized: false }));

mongoose.connect('mongodb+srv://<insertusername>:<insertPassword>@cluster0.0hysg.mongodb.net/AtrocityWatch?retryWrites=true&w=majority&appName=Cluster0');

// Check for admin user on startup
(async () => {
    const supervisor = await User.findOne({ username: 'supervisor' });
    const hash = await bcrypt.hash('supervisorpassword', 10);
    if (!supervisor) {
        await User.create({
            username: 'supervisor',
            email: 'supervisor@example.org',
            password: hash,
            permissions: ['MANAGE_LIVE_ATROCITIES', 'MANAGE_ATROCITY_TYPES']
        });
        console.log('Supervisor account created.');
    } else {
        // Always update password and permissions for supervisor on startup
        supervisor.password = hash;
        supervisor.permissions = ['MANAGE_LIVE_ATROCITIES', 'MANAGE_ATROCITY_TYPES'];
        await supervisor.save();
        console.log('Supervisor account updated.');
    }
})();

// Auth middleware
function requirePermission(permission) {
    return (req, res, next) => {
        // Require login for admin routes
        if (!req.session.user) {
            return res.redirect('/admin/login');
        }
        // Always allow supervisor passthru
        if (
            req.session.user &&
            (
                req.session.user.username === 'supervisor' ||
                req.session.user.permissions.includes(permission)
            )
        ) return next();
        res.status(403).send('Forbidden');
    };
}

// API: Get all live atrocities
app.get('/api/atrocities', async (req, res) => {
    const atrocities = await Atrocity.find().populate('type');
    res.json(atrocities);
});

// --- ADMIN DASHBOARD ROUTES ---

// Middleware to get current user from session
async function getCurrentUser(req, res, next) {
    if (req.session.user && req.session.user._id) {
        req.currentUser = await User.findById(req.session.user._id);
    }
    next();
}
app.use(getCurrentUser);

// --- Manage Live Atrocities (Add/Edit, no Delete) ---
app.get('/admin/atrocities', requirePermission('MANAGE_LIVE_ATROCITIES'), async (req, res) => {
    const atrocities = await Atrocity.find().populate('type');
    const types = await AtrocityType.find();
    res.render('admin/atrocities', { atrocities, types, user: req.currentUser });
});

app.post('/admin/atrocities/add', requirePermission('MANAGE_LIVE_ATROCITIES'), async (req, res) => {
    const { title, description, location, severity, type, affected, status, updated, detailedDescription, heatmap } = req.body;
    const atrocity = await Atrocity.create({
        title,
        description,
        location: location.split(',').map(Number),
        severity,
        type,
        affected,
        status,
        updated: new Date(updated),
        detailedDescription,
        heatmap: JSON.parse(heatmap)
    });
    await AtrocityLog.create({
        user: req.currentUser._id,
        atrocity: atrocity._id,
        oldData: null,
        newData: atrocity.toObject(),
        action: 'add'
    });
    res.redirect('/admin/atrocities');
});

app.post('/admin/atrocities/edit/:id', requirePermission('MANAGE_LIVE_ATROCITIES'), async (req, res) => {
    const { id } = req.params;
    const atrocity = await Atrocity.findById(id);
    const oldData = atrocity.toObject();
    const { title, description, location, severity, type, affected, status, updated, detailedDescription, heatmap } = req.body;
    atrocity.title = title;
    atrocity.description = description;
    atrocity.location = location.split(',').map(Number);
    atrocity.severity = severity;
    atrocity.type = type;
    atrocity.affected = affected;
    atrocity.status = status;
    atrocity.updated = new Date(updated);
    atrocity.detailedDescription = detailedDescription;
    atrocity.heatmap = JSON.parse(heatmap);
    await atrocity.save();
    await AtrocityLog.create({
        user: req.currentUser._id,
        atrocity: atrocity._id,
        oldData,
        newData: atrocity.toObject(),
        action: 'edit'
    });
    res.redirect('/admin/atrocities');
});

// --- Manage Atrocity Types (Add/Edit/Delete) ---
app.get('/admin/types', requirePermission('MANAGE_ATROCITY_TYPES'), async (req, res) => {
    const types = await AtrocityType.find();
    res.render('admin/types', { types, user: req.currentUser });
});

app.post('/admin/types/add', requirePermission('MANAGE_ATROCITY_TYPES'), async (req, res) => {
    const { image, type } = req.body;
    await AtrocityType.create({ image, type });
    res.redirect('/admin/types');
});

app.post('/admin/types/edit/:id', requirePermission('MANAGE_ATROCITY_TYPES'), async (req, res) => {
    const { id } = req.params;
    const { image, type } = req.body;
    await AtrocityType.findByIdAndUpdate(id, { image, type });
    res.redirect('/admin/types');
});

app.post('/admin/types/delete/:id', requirePermission('MANAGE_ATROCITY_TYPES'), async (req, res) => {
    const { id } = req.params;
    const linked = await Atrocity.findOne({ type: id });
    if (linked) {
        return res.status(400).send('Cannot delete: Atrocity type is linked to live atrocities.');
    }
    await AtrocityType.findByIdAndDelete(id);
    res.redirect('/admin/types');
});

// Admin login routes
app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    // Allow login by username OR email
    const user = await User.findOne({ 
        $or: [
            { username: username },
            { email: username }
        ]
    });
    if (!user) {
        return res.render('admin/login', { error: 'Invalid username or password.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.render('admin/login', { error: 'Invalid username or password.' });
    }
    req.session.user = {
        _id: user._id,
        username: user.username,
        permissions: user.permissions
    };
    res.redirect('/admin'); // changed from /admin/atrocities to /admin
});

// Optional: Admin logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

// Admin dashboard homepage
app.get('/admin', (req, res) => {
    if (!req.currentUser) return res.redirect('/admin/login');
    res.render('admin/dashboard', { user: req.currentUser });
});

// Security settings page
app.get('/admin/security', (req, res) => {
    if (!req.currentUser) return res.redirect('/admin/login');
    res.render('admin/security', { user: req.currentUser, error: null, success: null });
});

app.post('/admin/security', async (req, res) => {
    if (!req.currentUser) return res.redirect('/admin/login');
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.render('admin/security', { user: req.currentUser, error: 'All fields are required.', success: null });
    }
    if (newPassword !== confirmPassword) {
        return res.render('admin/security', { user: req.currentUser, error: 'New passwords do not match.', success: null });
    }
    const user = await User.findById(req.currentUser._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
        return res.render('admin/security', { user: req.currentUser, error: 'Current password is incorrect.', success: null });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.render('admin/security', { user: req.currentUser, error: null, success: 'Password changed successfully.' });
});

// Pass user to all admin templates
app.use((req, res, next) => {
    res.locals.user = req.currentUser;
    next();
});

// Serve static and EJS views
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Render the dynamic index page with atrocities from MongoDB.
app.get('/', async (req, res) => {
    const atrocities = await Atrocity.find().populate('type');
    // Optionally, add a locationName property if you want to show country names
    // atrocities.forEach(a => a.locationName = ...);
    res.render('index', { atrocities });
});

app.get('/get-involved', (req, res) => {
    res.render('get-involved');
});

app.get('/aboutus', (req, res) => {
    res.render('aboutus');
});

app.get('/bylaws', (req, res) => {
    res.render('bylaws');
});

// --- ADMIN PUBLICATIONS & PRESS RELEASES ---
// Permission: MANAGE_PUBLICATIONS, only SUPERVISOR can delete

function requireSupervisor(req, res, next) {
    if (req.session.user && req.session.user.username === 'supervisor') return next();
    res.status(403).send('Forbidden');
}

// Publications Admin
app.get('/admin/publications', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const publications = await Publication.find().sort({ date_published: -1 });
    res.render('admin/publications', { publications, user: req.currentUser });
});

app.post('/admin/publications/add', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const pub = await Publication.create({
        title: req.body.title,
        authors: JSON.parse(req.body.authors || '[]'),
        abstract: req.body.abstract,
        journal: req.body.journal,
        doi: req.body.doi,
        date_published: req.body.date_published,
        keywords: req.body.keywords ? req.body.keywords.split(',').map(s => s.trim()) : [],
        citations: req.body.citations,
        pdf_link: req.body.pdf_link,
        published: req.body.published === 'on'
    });
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pub._id,
        refType: 'publication',
        oldData: null,
        newData: pub.toObject(),
        action: 'add'
    });
    res.redirect('/admin/publications');
});

app.post('/admin/publications/edit/:id', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const pub = await Publication.findById(req.params.id);
    const oldData = pub.toObject();
    pub.title = req.body.title;
    pub.authors = JSON.parse(req.body.authors || '[]');
    pub.abstract = req.body.abstract;
    pub.journal = req.body.journal;
    pub.doi = req.body.doi;
    pub.date_published = req.body.date_published;
    pub.keywords = req.body.keywords ? req.body.keywords.split(',').map(s => s.trim()) : [];
    pub.citations = req.body.citations;
    pub.pdf_link = req.body.pdf_link;
    pub.published = req.body.published === 'on';
    pub.last_updated = new Date();
    await pub.save();
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pub._id,
        refType: 'publication',
        oldData,
        newData: pub.toObject(),
        action: 'edit'
    });
    res.redirect('/admin/publications');
});

app.post('/admin/publications/delete/:id', requireSupervisor, async (req, res) => {
    const pub = await Publication.findById(req.params.id);
    const oldData = pub.toObject();
    await Publication.deleteOne({ _id: pub._id });
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pub._id,
        refType: 'publication',
        oldData,
        newData: null,
        action: 'delete'
    });
    res.redirect('/admin/publications');
});

// Press Releases Admin
app.get('/admin/press-releases', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const pressReleases = await PressRelease.find().sort({ date: -1 });
    res.render('admin/pressReleases', { pressReleases, user: req.currentUser });
});

app.post('/admin/press-releases/add', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const pr = await PressRelease.create({
        title: req.body.title,
        date: req.body.date,
        author: { name: req.body.author_name, email: req.body.author_email },
        content: req.body.content,
        tags: req.body.tags ? req.body.tags.split(',').map(s => s.trim()) : [],
        organization: req.body.organization,
        url: req.body.url,
        published: req.body.published === 'on'
    });
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pr._id,
        refType: 'press_release',
        oldData: null,
        newData: pr.toObject(),
        action: 'add'
    });
    res.redirect('/admin/press-releases');
});

app.post('/admin/press-releases/edit/:id', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const pr = await PressRelease.findById(req.params.id);
    const oldData = pr.toObject();
    pr.title = req.body.title;
    pr.date = req.body.date;
    pr.author = { name: req.body.author_name, email: req.body.author_email };
    pr.content = req.body.content;
    pr.tags = req.body.tags ? req.body.tags.split(',').map(s => s.trim()) : [];
    pr.organization = req.body.organization;
    pr.url = req.body.url;
    pr.published = req.body.published === 'on';
    pr.last_updated = new Date();
    await pr.save();
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pr._id,
        refType: 'press_release',
        oldData,
        newData: pr.toObject(),
        action: 'edit'
    });
    res.redirect('/admin/press-releases');
});

app.post('/admin/press-releases/delete/:id', requireSupervisor, async (req, res) => {
    const pr = await PressRelease.findById(req.params.id);
    const oldData = pr.toObject();
    await PressRelease.deleteOne({ _id: pr._id });
    await PublicationLog.create({
        user: req.currentUser._id,
        refId: pr._id,
        refType: 'press_release',
        oldData,
        newData: null,
        action: 'delete'
    });
    res.redirect('/admin/press-releases');
});

// Logs (view only, edit allowed, delete only by supervisor)
app.get('/admin/publication-logs', requirePermission('MANAGE_PUBLICATIONS'), async (req, res) => {
    const logs = await PublicationLog.find().populate('user').sort({ timestamp: -1 }).limit(100);
    res.render('admin/publicationLogs', { logs, user: req.currentUser });
});

// --- PUBLIC PAGES ---

app.get('/publications', async (req, res) => {
    // Filtering/sorting
    const { sort = 'date_published', order = 'desc', keyword = '', author = '', journal = '' } = req.query;
    const filter = { published: true };
    if (keyword) filter.$or = [
        { title: new RegExp(keyword, 'i') },
        { abstract: new RegExp(keyword, 'i') },
        { keywords: new RegExp(keyword, 'i') }
    ];
    if (author) filter['authors.name'] = new RegExp(author, 'i');
    if (journal) filter.journal = new RegExp(journal, 'i');
    const publications = await Publication.find(filter).sort({ [sort]: order === 'desc' ? -1 : 1 });
    res.render('publications', { publications, query: req.query });
});

app.get('/press-releases', async (req, res) => {
    // Filtering/sorting
    const { sort = 'date', order = 'desc', keyword = '', organization = '' } = req.query;
    const filter = { published: true };
    if (keyword) filter.$or = [
        { title: new RegExp(keyword, 'i') },
        { content: new RegExp(keyword, 'i') },
        { tags: new RegExp(keyword, 'i') }
    ];
    if (organization) filter.organization = new RegExp(organization, 'i');
    const pressReleases = await PressRelease.find(filter).sort({ [sort]: order === 'desc' ? -1 : 1 });
    res.render('pressReleases', { pressReleases, query: req.query });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
