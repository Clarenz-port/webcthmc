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

const path = require("path");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
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

app.get("/", (req, res) => {
  res.send("✅ Server is running correctly");
});

sequelize
  .sync()
  .then(() => {
    console.log("✅ Database connected and models synced");

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

    app.listen(8000, () => console.log("🚀 Server running on port 8000"));
  })
  .catch((err) => console.error("❌ Database connection failed:", err));
