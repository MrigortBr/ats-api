const { createApp } = require("../dist/lambda");

module.exports = async (req, res) => {
    const app = await createApp();
    app(req, res);
};
