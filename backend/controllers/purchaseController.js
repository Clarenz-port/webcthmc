// controllers/purchasesController.js
const Purchase = require("../models/purchase");
const { logActivity } = require("../utils/activityLogger");

// Helper to detect one-month payment method
function isOneMonthMethod(pm) {
  if (!pm) return false;
  const s = String(pm).toLowerCase();
  return s.includes("1month") || s.includes("1 month") || s.includes("month to pay") || s.includes("share-deduction") || s.includes("share");
}

exports.createPurchase = async (req, res) => {
  try {
    console.log("[createPurchase] req.user:", req.user);
    console.log("[createPurchase] req.body:", JSON.stringify(req.body));

    const { userId: bodyUserId, items, paymentMethod, notes, memberName, subtotal: bodySubtotal, surcharge: bodySurcharge, total: bodyTotal, dueDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // Decide memberId: prefer body.userId then req.user.id
    const requester = req.user ?? null;
    const memberId = bodyUserId ?? (requester && requester.id) ?? null;
    if (!memberId) {
      console.warn("[createPurchase] Missing member id");
      return res.status(400).json({ message: "Missing member id" });
    }

    // Normalize items and compute subtotal
    let computedSubtotal = 0;
    const normalizedItems = items.map((it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      const lineTotal = Number((qty * unitPrice).toFixed(2));
      computedSubtotal += lineTotal;
      return {
        name: it.name ?? "Item",
        qty,
        unitPrice: Number(unitPrice.toFixed(2)),
        lineTotal,
      };
    });

    const validatedSubtotal = (typeof bodySubtotal === "number" && !Number.isNaN(bodySubtotal))
      ? Number(bodySubtotal.toFixed(2))
      : Number(computedSubtotal.toFixed(2));

    const oneMonth = isOneMonthMethod(paymentMethod);
    const validatedSurcharge = (typeof bodySurcharge === "number" && !Number.isNaN(bodySurcharge))
      ? Number(bodySurcharge.toFixed(2))
      : (oneMonth ? Number((validatedSubtotal * 0.01).toFixed(2)) : 0);

    const validatedTotal = (typeof bodyTotal === "number" && !Number.isNaN(bodyTotal))
      ? Number(bodyTotal.toFixed(2))
      : Number((validatedSubtotal + validatedSurcharge).toFixed(2));

    const status = oneMonth ? "not paid" : "paid";

    const purchase = await Purchase.create({

      userId: String(memberId),
      memberName: memberName ?? (requester ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim() : null),
      items: normalizedItems,
      subtotal: validatedSubtotal,
      surcharge: validatedSurcharge,
      total: validatedTotal,
      dueDate: dueDate ?? (oneMonth ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null),
      paymentMethod: paymentMethod ?? "cash",
      status,
      notes: notes ?? null,
    });
     await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Create Purchase",
      details: { purchaseId: purchase.id, memberId: purchase.userId, total: purchase.total, paymentMethod: purchase.paymentMethod },
      ip: req.ip,
    });

    console.log("[createPurchase] CREATED =>", { id: purchase.id, paymentMethod: purchase.paymentMethod, status: purchase.status, total: purchase.total, dueDate: purchase.dueDate });

    return res.status(201).json({ message: "Purchase recorded", purchase });
  } catch (err) {
    console.error("[createPurchase] ERROR:", err);
    return res.status(500).json({ message: "Error recording purchase" });
  }
};

exports.getMemberPurchases = async (req, res) => {
  try {
    const memberIdRaw = req.params.id;
    const memberId = memberIdRaw;
    if (!memberId) return res.status(400).json({ message: "Invalid member id" });

    const purchases = await Purchase.findAll({
      where: { userId: String(memberId) },
      order: [["createdAt", "DESC"]],
    });

    return res.json(purchases);
  } catch (err) {
    console.error("[getMemberPurchases] Error:", err);
    return res.status(500).json({ message: "Error fetching purchases" });
  }
};

exports.payPurchase = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing purchase id" });

    const purchase = await Purchase.findByPk(id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    purchase.status = "paid";
    await purchase.save();

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Paid Purchase",
      details: { purchaseId: purchase.id, memberId: purchase.userId, total: purchase.total },
      ip: req.ip,
    });

    console.log(`[payPurchase] purchase ${id} marked paid`);
    return res.json({ message: "Purchase marked as paid", purchase });
  } catch (err) {
    console.error("[payPurchase] Error:", err);
    return res.status(500).json({ message: "Error marking purchase as paid" });
  }
};
exports.getAllPurchases = async (req, res) => {
  try {
    // OPTIONAL: restrict to admins only
    // if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const purchases = await Purchase.findAll({
      order: [["createdAt", "DESC"]],
    });

    // Normalize and ensure one-month purchases have dueDate (if missing)
    const normalized = purchases.map((p) => {
      // convert sequelize model instance to plain object if needed
      const obj = (typeof p.toJSON === "function") ? p.toJSON() : p;

      const pm = obj.paymentMethod ?? obj.payment_method ?? obj.method ?? obj.paymentType ?? obj.payment ?? null;
      const oneMonth = isOneMonthMethod(pm);

      // determine a dueDate: prefer stored dueDate; if missing and oneMonth, compute createdAt + 30 days
      let due = obj.dueDate ?? obj.due_date ?? obj.due ?? null;
      if (!due && oneMonth) {
        const created = obj.createdAt ?? obj.created_at ?? new Date();
        const base = new Date(created);
        const d = new Date(base);
        d.setDate(d.getDate() + 30);
        due = d;
      } else if (due && typeof due === "string") {
        const parsed = new Date(due);
        if (!Number.isNaN(parsed.getTime())) due = parsed;
      }

      return {
        ...obj,
        paymentMethod: pm,
        isOneMonth: oneMonth,
        dueDate: due instanceof Date ? due : due ? new Date(due) : null,
      };
    });

    return res.json(normalized);
  } catch (err) {
    console.error("[getAllPurchases] Error:", err);
    return res.status(500).json({ message: "Error fetching purchases" });
  }
};

exports.getPendingPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      where: { status: "not paid" },
      order: [["createdAt", "DESC"]],
    });

    // Ensure DUEDATE is always present for 1-month-to-pay
    const normalized = purchases.map((p) => {
      const obj = p.toJSON();
      const pm = obj.paymentMethod;

      // Detect 1-month-to-pay purchases
      const oneMonth = isOneMonthMethod(pm);

      // If no dueDate, calculate it = createdAt + 30 days
      let due = obj.dueDate;
      if (!due && oneMonth) {
        const base = new Date(obj.createdAt);
        const d = new Date(base);
        d.setDate(d.getDate() + 30);
        due = d;
      }

      return {
        ...obj,
        isOneMonth: oneMonth,
        dueDate: due,
      };
    });

    return res.json(normalized);
  } catch (err) {
    console.error("[getPendingPurchases] Error:", err);
    return res.status(500).json({ message: "Error fetching pending purchases" });
  }
};
