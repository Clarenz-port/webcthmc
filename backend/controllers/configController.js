
const SiteConfig = require('../models/siteConfig');
const { logActivity } = require("../utils/activityLogger");

// Get current site config
exports.getConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
};


// Update site config (logo and/or name)
exports.updateConfig = async (req, res) => {
  try {
    const { siteName, logo } = req.body;

    // Validate logo size (base64 string)
    if (logo) {
      // base64 size in bytes: (length * 3/4) - padding
      const base64Length = logo.length - (logo.indexOf(',') + 1);
      const approxBytes = Math.round((base64Length * 3) / 4);
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (approxBytes > maxBytes) {
        return res.status(400).json({ error: 'Logo image is too large. Max size is 2MB.' });
      }
    }

    let config = await SiteConfig.findOne();
    let oldSiteName = config ? config.siteName : undefined;
    let oldLogo = config ? config.logo : undefined;
    let changedFields = [];

    if (!config) {
      config = await SiteConfig.create({ siteName, logo });
      if (siteName !== undefined) changedFields.push("siteName");
      if (logo !== undefined) changedFields.push("logo");
    } else {
      if (siteName !== undefined && siteName !== config.siteName) {
        changedFields.push("siteName");
        config.siteName = siteName;
      }
      if (logo !== undefined && logo !== config.logo) {
        changedFields.push("logo");
        config.logo = logo;
      }
      await config.save();
    }

    // Log activity if any field changed
    if (changedFields.length > 0) {
      const userId = req.user ? req.user.id : null;
      const role = req.user ? req.user.role : null;
      let details = {};
      if (changedFields.includes("siteName")) {
        details.siteName = { from: oldSiteName, to: siteName };
      }
      if (changedFields.includes("logo")) {
        details.logo = { from: oldLogo ? "[set]" : null, to: logo ? "[set]" : null };
      }
      await logActivity({
        userId,
        role,
        action: `Updated site configuration (${changedFields.join(", ")})`,
        details,
        ip: req.ip || null,
      });
    }

    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config' });
  }
};
