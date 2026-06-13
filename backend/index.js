require("dotenv").config();
const bcrypt = require('bcryptjs');
const User = require('./models/users');
const express = require("express");
const cors = require("cors");
const app = express();
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const memberRoutes = require("./routes/memberRoutes");
const loanRoutes = require("./routes/loanRoutes");
const sharesRoutes = require("./routes/sharesRoutes");
const purchasesRoutes = require("./routes/purchaseRoutes");
const billpayRoutes = require("./routes/billsRoutes");
const dividendRoutes = require("./routes/dividendRoutes");
const reportRoutes = require("./routes/reportRoutes");
const NoticeRoutes = require("./routes/noticeRoutes");
const activityRoutes = require("./routes/activityRoutes");
const configRoutes = require("./routes/configRoutes");

const path = require("path");

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/shares", sharesRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/bills", billpayRoutes);
app.use("/api/dividends", dividendRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/reports", reportRoutes);
app.use("/api/notices", NoticeRoutes);

app.use("/api/activity", activityRoutes);
app.use("/api/config", configRoutes);

app.get("/", (req, res) => {
  res.send("✅ Server is running correctly");
});

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database authenticated");
    return sequelize.sync();
  })
  .then(() => {
    console.log("✅ Database models synced");

    // Auto-create default superadmin if none exists
    (async () => {
      try {
        const existingSuper = await User.findOne({ where: { role: "superadmin" } });
        if (!existingSuper) {
          const username = process.env.DEFAULT_SUPERADMIN_USERNAME || "sadmin";
          const passwordPlain = process.env.DEFAULT_SUPERADMIN_PASSWORD || "sadmin";
          const email = process.env.DEFAULT_SUPERADMIN_EMAIL || "superadmin@example.com";

          const hashedPassword = await bcrypt.hash(passwordPlain, 10);

          await User.create({
            firstName: "Super",
            lastName: "Admin",
            username,
            password: hashedPassword,
            email,
            role: "superadmin",
          });

          console.log(`✅ Default superadmin created (username='${username}', email='${email}')`);
          if (!process.env.DEFAULT_SUPERADMIN_PASSWORD) {
            console.warn("⚠️ WARNING: DEFAULT_SUPERADMIN_PASSWORD not set — using insecure default. Set env var to secure it.");
          }
        }
      } catch (err) {
        console.error("❌ Error creating default superadmin:", err);
      }
    })();

    // --- SOCKET.IO SERVER ---
    const http = require('http');
    const { Server } = require('socket.io');
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" } });
    app.set('io', io);

    // Handle Socket.IO connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Allow clients to join a room based on their userId
      socket.on('join-user-room', (userId) => {
        if (userId) {
          socket.join(`user-${userId}`);
          console.log(`User ${userId} joined room: user-${userId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => console.log(`🚀 Server running with Socket.IO on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("Troubleshooting:");
    console.error("1. Check DB_HOST, DB_USER, DB_PASS, DB_NAME in environment variables");
    console.error("2. Verify FreEDB/Railway database is active and running");
    console.error("3. Check firewall/network connectivity to database server");
    process.exit(1);
  });
