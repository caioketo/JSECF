var ecf;

document.addEventListener('DOMContentLoaded', function () {
    bind();
    port = '';
});

function bind() {
    document.getElementById('LeituraX').addEventListener('click', ecf.leituraX);
    document.getElementById('AbreCupom').addEventListener('click', abreCupom);
    port = "COM6";
    ecf = new ECF();
}

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


function ECF() {
    this.connectionId = 0;
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
        ecf.write(bufView);
    }

    this.abreCupom = function (cpf, nome, endereco) {
        var buf = new ArrayBuffer(6 + cpf.length + nome.length + endereco.length);
        var bufView = new Uint8Array(buf);
        bufView[0] = 28;
        bufView[1] = 'F'.charCodeAt(0);
        bufView[2] = 200;
        for (var i = 0; i < cpf.length; i++) {
            bufView[i + 3] = cpf.charCodeAt(i);
        }
        bufView[3 + cpf.length] = 255;
        for (var i = 0; i < nome.length; i++) {
            bufView[i + 4 + cpf.length] = nome.charCodeAt(i);
        }
        bufView[4 + cpf.length + nome.length] = 255;
        for (var i = 0; i < endereco.length; i++) {
            bufView[i + 5 + cpf.length + nome.length] = endereco.charCodeAt(i);
        }
        bufView[5 + cpf.length + nome.length + endereco.length] = 255;

        ecf.write(bufView);
    }

    this.vendeItem = function (aliquota, qtd, valor, desc, codigo, un, desc) {
        //FS + 'F' + #207 + AliquotaECF + QtdStr + ValorStr +
            //DescontoStr + FlagDesc + Codigo + Unidade + ModoCalculo + Descricao
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