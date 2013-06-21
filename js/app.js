var ecf;
var selectedRow = 0;
var prodTable;
var db;
document.addEventListener('DOMContentLoaded', function () {
    db = new DB();
    port = "COM6";
    ecf = new ECF();
    bind();
});

function bind() {
    document.getElementById('LeituraX').addEventListener('click', leituraX);
    document.getElementById('AbreCupom').addEventListener('click', abreCupom);
    document.getElementById('CancelaCupom').addEventListener('click', cancelaCupom);
    document.getElementById('Push').addEventListener('click', pushData);    
    ativaMenu();
    document.getElementById('Sair').addEventListener('click', sair);
    document.getElementById('ConsultarProdutos').addEventListener('click', produtos);    
    db.open();
    prepareGrid();
}


function produtos() {
    chrome.app.window.create('produtos.html', {
        singleton: true,
        frame: 'chrome'
    },
    function (win) {
        win.maximize();
    });
}

function sair() {
    window.close();
}

function ativaMenu() {
    var theme = getDemoTheme();
    // Create a jqxMenu
    $("#jqxMenu").jqxMenu({ width: '100%', height: '30px', theme: theme });
    $("#jqxMenu").css('visibility', 'visible');
    $("#jqxMenu").jqxMenu({ showTopLevelArrows: true });
}

function refreshGrid() {
    var source =
    {
        localdata: db.data,
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
        localdata: db.data,
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
            db.addProduto(entry);
        }

        db.getAllProdutos(refreshGrid);
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




//ECF

function write() {
    var buf = new ArrayBuffer(2);
    var bufView = new Uint8Array(buf);
    bufView[0] = 29;
    bufView[1] = 8;
    ecf.write(bufView);
}

function abreCupom() {
    var cpf = '35985256804';
    var nome = 'CAIO N MORENO';
    var endereco = 'AV BERNARDINO DE CAMPOS';
    ecf.abreCupom(cpf, nome, endereco);
}

function cancelaCupom() {
    ecf.cancelaCupom();
}

function leituraX() {
    ecf.leituraX();
}


function ECF() {
    this.connectionId = 0;
    this.dataRead = '';

    var onOpen = function (connectionInfo) {
        ecf.connectionId = connectionInfo.connectionId;
        ecf.comutaOnline();
    }
    chrome.serial.open(port, { bitrate: 9600 }, onOpen);

    this.close = function () {
        var onClose = function(result) {
            console.log('Serial port closed');
        }
        chrome.serial.close(ecf.connectionId, onClose);
    }

    this.write = function (cmd) {
        var onWrite = function (writeInfo) {
            console.log(writeInfo);
        }
        cmd = this.prepareCmd(cmd);
        chrome.serial.write(ecf.connectionId, cmd, onWrite);
    }

    this.onCharRead = function (readInfo) {
        if (!connectionInfo) {
            return;
        }
        if (readInfo && readInfo.bytesRead > 0 && readInfo.data) {
            var str = ab2str(readInfo.data);
            if (str[readInfo.bytesRead - 1] === '\n') {
                this.dataRead += str.substring(0, readInfo.bytesRead - 1);
                onLineRead(this.dataRead);
                this.dataRead = "";
            } else {
                this.dataRead += str;
            }
        }
        chrome.serial.read(connectionId, 128, onCharRead);
    }

    this.read = function () {
        chrome.serial.read(connectionId, 128, this.onCharRead);
    }

    this.prepareCmd = function (cmd) {
        if (cmd.byteLength == 0) {
            return;
        }

        if (cmd[0] == 28 || (cmd[0] == 29 && cmd[1] == 6)) {
            var checksum = 0;
            var len = cmd.byteLength;
            for (var i = 0; i < len; i++) {
                checksum = checksum ^ cmd[i];
            }

            var buf = new ArrayBuffer(cmd.byteLength + 2);
            var bufView = new Uint8Array(buf);
            for (var i = 0; i < cmd.byteLength; i++) {
                bufView[i] = cmd[i];
            }
            bufView[cmd.byteLength] = checksum;
            bufView[cmd.byteLength + 1] = 0;
            
            return bufView.buffer;
        }
        else {
            var buf = new ArrayBuffer(cmd.byteLength + 1);
            var bufView = new Uint8Array(buf);

            for (var i = 0; i < cmd.byteLength; i++) {
                bufView[i] = cmd[i];
            }
            bufView[cmd.byteLength] = 13;
            return bufView.buffer;
        }
    }

    this.addField = function (bufView, field, index) {
        for (var i = 0; i < field.length; i++) {
            bufView[i + index] = field.charCodeAt(i);
        }
    }

    //Funções ECF
    this.comutaOnline = function () {
        var buf = new ArrayBuffer(2);
        var bufView = new Uint8Array(buf);
        bufView[0] = 29;
        bufView[1] = 8;
        this.write(bufView);
    }

    this.leituraX = function () {
        var buf = new ArrayBuffer(4);
        var bufView = new Uint8Array(buf);
        bufView[0] = 28;
        bufView[1] = 'F'.charCodeAt(0);
        bufView[2] = 235;
        bufView[3] = '0'.charCodeAt(0);
        this.write(bufView);
    }

    this.abreCupom = function (cpf, nome, endereco) {
        var buf = new ArrayBuffer(6 + cpf.length + nome.length + endereco.length);
        var bufView = new Uint8Array(buf);
        bufView[0] = 28;
        bufView[1] = 'F'.charCodeAt(0);
        bufView[2] = 200;
        this.addField(bufView, cpf, 3);
        bufView[3 + cpf.length] = 255;
        this.addField(bufView, nome, 4 + cpf.length);
        bufView[4 + cpf.length + nome.length] = 255;
        this.addField(bufView, endereco, 5 + cpf.length + nome.length);
        bufView[5 + cpf.length + nome.length + endereco.length] = 255;

        this.write(bufView);
    }

    this.vendeItem = function (aliquota, qtd, valor, desc, flagDesc, codigo, un, desc) {
        var buf = new ArrayBuffer(4 + aliquota.length + qtd.length + valor.length + desc.length + flagDesc.length + codigo.length +
            un.length + desc.length);
        var bufView = new Uint8Array(buf);
        bufView[0] = 28;
        bufView[1] = 'F'.charCodeAt(0);
        bufView[2] = 207;
        var index = 3;
        this.addField(bufView, aliquota, index);
        index += aliquota.length;
        this.addField(bufView, qtd, index);
        index += qtd.length;
        this.addField(bufView, valor, index);
        index += valor.length;
        this.addField(bufView, desc, index);
        index += desc.length;
        this.addField(bufView, flagDesc, index);
        index += flagDesc.length;
        this.addField(bufView, codigo, index);
        index += codigo.length;
        this.addField(bufView, un, index);
        index += un.length;
        this.addField(bufView, 'A', index);
        index += 1;
        this.addField(bufView, desc, index);

        this.write(bufView);
    }

    this.cancelaCupom = function () {
        var buf = new ArrayBuffer(3);
        var bufView = new Uint8Array(buf);
        bufView[0] = 28;
        bufView[1] = 'F'.charCodeAt(0);
        bufView[2] = 211;
        
        this.write(bufView);
    }
}

var str2ab = function (str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

var ab2str = function (buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
};