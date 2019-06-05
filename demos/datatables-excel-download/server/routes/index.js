const router = require('express').Router();
const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');
const dataToExcel = require('../middleware/data-to-excel');
const mockData = require('../../data.json');

/**
 * Acts as our stored procedure - serves filtered, sorted mock data
 * @param {Number} page - Page to return
 * @param {Number} limit - How many items per page to return
 * @param {String} orderBy=id - Which column to order by
 * @param {String} orderDir=asc - Which direction to order by
 * @param {String} search - Search string
 * @returns {Object[]} - Array of filtered, sorted data
 */
function parseMockData({
    page,
    limit,
    orderBy = 'id',
    orderDir = 'asc',
    search,
}) {
    return mockData
        // filter out the search term
        .filter(item => {
            if (!search) return item;
            let match = false;
            for (const prop in item) {
                if (item[prop].toString().toLowerCase().includes(search.toLowerCase())) match = true;
            }
            return match;
        })
        // sort results
        .sort((a, b) => {
            if (a[orderBy] > b[orderBy]) {
                if (orderDir === 'asc') return 1;
                return -1;
            }
            if (a[orderBy] < b[orderBy]) {
                if (orderDir === 'asc') return -1;
                return 1;
            }
            return 0;
        })
        // limit the results
        .slice(0, limit || mockData.length)
}

router.route('/')

    // Send the index.html for the example
    .get((req, res, next) =>
        res.sendFile(path.join(__dirname, './dist/index.html'))
    )

    // Datatables server-side endpoint
    .post((req, res, next) => {
        const data = parseMockData({
            page: (+req.body.start / +req.body.length) + 1,
            limit: +req.body.length || 10,
            orderBy: req.body.columns[+req.body.order[0].column].data,
            orderDir: req.body.order[0].dir,
            search: req.body.search.value || null,
        });

        // We need to tell Datatables a few things
        res.json({
            // The data
            data,
            // How many total records in table
            recordsTotal: mockData.length,
            // How many records are left after filtering with the search box
            recordsFiltered: data.length,
        })
    });


router.route('/excel-download')
    .post((req, res, next) => {
        // Important to get the data the same way as in the previous endpoint
        const data = parseMockData({
            page: 1,
            limit: 999999,
            orderBy: req.body.orderBy,
            orderDir: req.body.orderDir,
            search: req.body.search !== 'null' ? req.body.search : null,
        });

        // MUST set the results on the res.locals object
        res.locals.results = data;
        next();
    }, dataToExcel); // Call our middleware here

module.exports = router;
