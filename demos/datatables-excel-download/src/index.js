import $ from 'jquery';

require('datatables.net-bs4')();
require('datatables.net-buttons-bs4')();

const $table = $('#mytable');

$table.DataTable({
    // Sorry for the confusing DOM stuff. I'm using bootstrap4 and I love flexbox
    dom: '<"btn-container d-flex align-items-center justify-content-center justify-content-sm-between flex-wrap flex-md-nowrap pb-3"B><"d-flex align-items-center justify-content-center justify-content-sm-between flex-wrap flex-md-nowrap pt-2"lf>r<"table-responsive pb-3"t><"d-flex align-items-center justify-content-center justify-content-sm-between flex-wrap flex-md-nowrap pt-3"ip>',
    serverSide: true,
    processing: true,
    deferRender: true,
    ajax: {
        url: './',
        type: 'POST',
    },
    lengthMenu: [
        [
            10,
            25,
            50,
            100,
            999999,
        ],
        [
            10,
            25,
            50,
            100,
            'All',
        ],
    ],
    pageLength: 10,
    order: [
        [
            0, 'asc',
        ],
    ],
    buttons: [
        {
            text: 'Download Excel',
            action: (e, dt) => {
                // Set the file and sheet names
                const fileName = 'people';
                const sheetName = 'People';

                // Organize table data
                const order = dt.order();
                const orderDir = order[0][1];
                const orderBy = dt.init().columnDefs[order[0][0]].data;
                const search = dt.search() || null;
                const columns = JSON.stringify(dt.init().columnDefs);

                // This is used to send to the backend, where a
                // cookie will be created. We will later check that
                // cookie against this. When it exists, that means
                // our download is complete (pretty hacky)
                const token = Date.now();

                // Dynamically create and submit a form
                function nonAjaxPost(path, params, method = 'POST') {
                    const tempForm = document.createElement('form');
                    tempForm.setAttribute('method', method);
                    tempForm.setAttribute('action', path);

                    for (const key in params) {
                        if (params.hasOwnProperty(key)) {
                            const hiddenField = document.createElement('input');
                            hiddenField.setAttribute('type', 'hidden');
                            hiddenField.setAttribute('name', key);
                            hiddenField.setAttribute('value', params[key]);
                            tempForm.appendChild(hiddenField);
                        }
                    }

                    document.body.appendChild(tempForm);
                    tempForm.submit();
                    tempForm.remove();
                }

                // Get cookie by name
                function getCookie(cname) {
                    const name = cname + '=';
                    const decodedCookie = decodeURIComponent(document.cookie);
                    const ca = decodedCookie.split(';');
                    for (let i = 0; i < ca.length; i++) {
                        let c = ca[i];
                        while (c.charAt(0) === ' ') {
                            c = c.substring(1);
                        }
                        if (c.indexOf(name) === 0) {
                            return c.substring(name.length, c.length);
                        }
                    }
                    return '';
                }

                // Delete cookie by name
                function deleteCookie(name) {
                    document.cookie = `${name}=; Max-Age=-99999999;`;
                }

                // Show a spinner when the download starts
                $('#spinner').show();

                // Initialize download
                nonAjaxPost('./excel-download', {
                    search,
                    orderBy,
                    orderDir,
                    columns,
                    fileName,
                    sheetName,
                    token,
                });

                // Now we need to check for the existence of a cookie that
                // signals the end of the download. Then we can hide
                // our spinner.
                const checkIfDownloadIsComplete = setInterval(() => {
                    if (getCookie('DownloadComplete') === token.toString()) {
                        clearInterval(checkIfDownloadIsComplete);
                        $('#spinner').hide();
                        deleteCookie('DownloadComplete');
                    }
                }, 500);
            },
        }
    ],
    // Define all columns
    // 'numberFormat' and 'exportable' are custom properties that we are adding
    // in order to communicate with the backend for Excel file creation
    columnDefs: [
        {
            targets: 0,
            data: 'id',
            title: 'ID',
        },
        {
            targets: 1,
            data: 'first_name',
            title: 'First Name',
        },
        {
            targets: 2,
            data: 'last_name',
            title: 'Last Name',
        },
        {
            targets: 3,
            data: 'dob',
            title: 'Date of Birth',
            // Set the number format in Excel
            numberFormat: 'mm/dd/yyyy',
        },
        {
            targets: 4,
            data: 'age',
            title: 'Age',
            className: 'text-center',
            // Set the number format in Excel
            numberFormat: '0',
        },
        {
            targets: 5,
            data: 'id',
            title: 'Ignored Column',
            className: 'text-center',
            // This column will be ignored in the Excel download
            exportable: false,
            render() {
                return 'Ignored in Excel';
            },
        },
    ],
});
