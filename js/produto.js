document.addEventListener('DOMContentLoaded', function () {
    if (database == null) {
        database = new DB();
        database.open();
    }
    bind();
});

function bind() {
    document.getElementById('Push').addEventListener('click', pushData);
    document.getElementById('Procurar').addEventListener('click', procurar);
    ativaMenu();
    prepareGrid();
}

function sair() {
    window.close();
}

function procurar() {
    database.procurarProd(document.getElementById('txtProd').value, refreshGrid);
}

function ativaMenu() {
    var theme = getDemoTheme();
    // Create a jqxMenu
    $("#jqxMenu").jqxMenu({ width: '100%', height: '30px', theme: theme });
    $("#jqxMenu").css('visibility', 'visible');
    $("#jqxMenu").jqxMenu({ showTopLevelArrows: true });
}

function refreshGrid(data) {
    data = data || database.data;
    var source =
    {
        localdata: data,
        datatype: "local",
        datafields:
        [
            { name: 'id', type: 'number' },
            { name: 'desc', type: 'string' }
        ]
    };
    var dataAdapter = new $.jqx.dataAdapter(source);
    $('#jqxgrid').jqxGrid({ source: dataAdapter });
}

function prepareGrid() {
    var theme = getDemoTheme();
    var source =
    {
        localdata: database.data,
        datatype: "local",
        datafields:
        [
            { name: 'id', type: 'number' },
            { name: 'desc', type: 'string' }
        ]
    };
    var dataAdapter = new $.jqx.dataAdapter(source);
    $("#jqxgrid").jqxGrid(
    {
        width: 500,
        height: 350,
        source: dataAdapter,
        theme: theme,
        columns: [
            { text: 'Id', datafield: 'id', width: 100 },
            { text: 'Descricao', datafield: 'desc', width: 100 }
        ]
    });
}


function pushData() {
    request('GET', 'http://localhost:28166/Produtos/JSON', function (lastResponse, xhr) {
        var resp = JSON.parse(lastResponse);
        for (var i = 0, entry; entry = resp[i]; ++i) {
            database.addProduto(entry);
        }

        database.getAllProdutos(refreshGrid);
    });
}

function request(method, url, callback) {
    var data = null;
    var headers = {};

    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onload = function (e) {
        callback(xhr.response, this);
    }.bind(this);
    xhr.onerror = function (e) {
        console.log(this, this.status, this.response,
                    this.getAllResponseHeaders());
    };
    xhr.send(data);
}
