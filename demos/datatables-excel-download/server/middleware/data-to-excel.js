const Excel = require('exceljs');

/**
 * Convert a dataset to an Excel file
 * @param {Object} req
 * @param {Object} req.body
 * @param {Object} req.body.fileName - Name of file
 * @param {Object} req.body.sheetName - Name of sheet
 * @param {Object[]} req.body.columns - Array of column definitions
 * @param {(String|Number)} [req.body.token] - Optional token to set a cookie when complete
 * @param {Object} res
 * @param {Function} next
 */
function dataToExcel(req, res, next) {

    // First we need to get the data from the previous middleware
    const sheetData = res.locals.results;

    // Create the workbook
    const workbook = new Excel.Workbook();

    // Set some metadata
    workbook.creator = 'Justin Williamson';
    workbook.lastModifiedBy = 'Justin Williamson';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.date1904 = true;

    // (optional) - Freeze the header
    workbook.views = [
        {
            state: 'frozen',
            ySplit: 1,
        },
    ];

    // Create the worksheet
    const worksheet = workbook.addWorksheet(req.body.sheetName || 'Sheet 1');

    // Set up the columns
    const columns = JSON.parse(req.body.columns)
        .filter(column =>
            column.exportable === undefined || column.exportable
        )
        .map(column => ({
            header: column.title || '',
            key: column.data || '',
            formula: column.formula || '',
            width: 20,
            style: {
                numFmt: column.numberFormat || '',
                font: {
                    name: 'Arial',
                    size: 10,
                },
            },
        }));

    worksheet.columns = columns;

    // Add the row data
    worksheet.addRows(
        sheetData.map(row =>
            columns.reduce((array, column) => {
                array.push(row[column.key]);
                return array;
            }, [])
        )
    );

    // Format the header text
    worksheet.getRow(1).font = {
        name: 'Arial Black',
        size: 10,
    };

    // Set headers for download
    const fileName = `${req.body.fileName}.xlsx`;
    res.type('application/octet-stream');
    res.set('Content-Disposition', `attachment;filename="${fileName}"`);

    // Sometimes we need to notify the client when the download is complete.
    // We do that by setting a cookie
    if (req.body.token) {
        res.set({
            'Access-Control-Allow-Credentials': true,
            'Set-Cookie': `DownloadComplete=${req.body.token}; Path=/;`,
        });
    }

    // Response
    return workbook.xlsx.writeBuffer()
        .then(buffer => res.send(buffer))
        .catch(next);

}

module.exports = dataToExcel;
