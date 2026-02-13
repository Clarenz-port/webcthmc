const SiteConfig = require('../models/siteConfig');

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
    if (!config) {
      config = await SiteConfig.create({ siteName, logo });
    } else {
      if (siteName !== undefined) config.siteName = siteName;
      if (logo !== undefined) config.logo = logo;
      await config.save();
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config' });
  }
};
