const express = require('express');
const SearchController = require('./search.controller');

const router = express.Router();

/**
 * Route: GET /api/v1/search
 * Query Params: ?query=text&page=1&limit=10
 */
router.get('/', SearchController.search);

module.exports = router;
