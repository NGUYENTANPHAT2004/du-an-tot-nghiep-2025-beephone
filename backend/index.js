/* eslint-disable @typescript-eslint/no-var-requires */
// Load environment variables first before any other code
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const db = require('./models/db');
const http = require("http");
const fs = require('fs');
const cors = require('cors');

// Import routes
const userroutes = require('./routes/UserRouter');
const sanphamroutes = require('./routes/SanPhamRoutes');
const loaisanphamroutes = require('./routes/LoaiSanPhamRoutes');
const dungluongroutes = require('./routes/DungLuongRoutes');
const categoryrouter = require('./routes/CategoryRoutes.js');
const blogroutes = require('./routes/BlogRoutes');
const mausacriengroutes = require('./routes/MauSacRiengRoutes');
const magiamgiaroutes = require('./routes/MaGiamGiaRoutes');
const danhgiaroutes = require('./routes/DanhGiaRoutes');
const hoadonrouter = require('./routes/HoaDonRoutes');
const stockrouter = require('./routes/stockrouter');
const authroutes = require("./routes/Authroutes.js");
const orderrating = require('./routes/OrderRatingRoutes');
const chatroutes = require('./routes/ChatRoutes');
const loyaltyPointsRoutes = require('./routes/LoyaltyPointsRoutes');

// Socket.io and services
const { initSocket } = require('./config/socket');
const { initSocketHandlers } = require('./socket/index');
const chatAnalyticsService = require('./socket/chat/services/ChatAnalyticsService');

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI || 'mongodb+srv://phat1z:123@ez88.akrq2.mongodb.net/datn?retryWrites=true&w=majority&appName=ez88';

// Log environment configuration
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3005);

const mongoStoreOptions = {
  mongooseConnection: db.mongoose.connection,
  mongoUrl: uri,
  collection: 'sessions'
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
// Initialize socket handlers
const socketNamespaces = initSocketHandlers(io);

// Configure Express
app.use(express.json());
app.use(cors());
console.log("🚀 Server starting...");

app.use(
  session({
    secret: process.env.JWT_SECRET || 'adscascd8saa8sdv87ds78v6dsv87asvdasv8',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create(mongoStoreOptions)
    // ,cookie: { secure: true } // Enable for HTTPS
  })
);

// Ensure data directory exists for chat
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory for chat');
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/uploads')));

// Register routes
app.use('/', userroutes);
app.use('/', sanphamroutes);
app.use('/', loaisanphamroutes);
app.use('/', dungluongroutes);
app.use('/', categoryrouter);
app.use('/', blogroutes);
app.use('/', mausacriengroutes);
app.use('/', danhgiaroutes);
app.use('/', magiamgiaroutes);
app.use('/', authroutes);
app.use('/', hoadonrouter);
app.use('/', stockrouter);
app.use('/', orderrating);
app.use('/', chatroutes); 
app.use('/', loyaltyPointsRoutes);

// Setup daily analytics job
const setupDailyAnalytics = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  // Calculate time until midnight
  const delay = midnight.getTime() - now.getTime();
  
  setTimeout(() => {
    // Run first time
    chatAnalyticsService.updateDailyAnalytics();
    
    // Then run every 24 hours
    setInterval(() => {
      chatAnalyticsService.updateDailyAnalytics();
    }, 24 * 60 * 60 * 1000);
  }, delay);
  
  console.log('✅ Daily analytics job scheduled');
};

// Start scheduled tasks
setupDailyAnalytics();

// Get port from environment variables or default to 3005
const PORT = process.env.PORT || 3005;

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = { io, app, server };