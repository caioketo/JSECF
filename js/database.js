var database;
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
    window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
    window.msIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
function DB() {
    database = this;
    this.data = [];
    this.db = null;
    this.version = 5;
    this.open = function () {
        var request = indexedDB.open('qicaixa', database.version);
        request.onupgradeneeded = function (event) {
            var db = event.target.result;

            var objectStore = db.createObjectStore('produtos2', { keyPath: 'Id' });
        };

        request.onsuccess = function (e) {
            database.db = e.target.result;
            database.getAllProdutos();
        };
    };

    this.addProduto = function (produto) {
        var trans = database.db.transaction(['produtos2'], "readwrite");
        trans.oncomplete = function (e) {
            database.getAllProdutos();
        };
        var store = trans.objectStore('produtos2');
        var request = store.add(produto);
    };

    this.getAllProdutos = function () {
        var store = database.db.transaction(['produtos2'], "readwrite").objectStore('produtos2');
        store.openCursor().onsuccess = function (e) {
            var cursor = e.target.result;

            if (!cursor) {
                return;
            }

            database.data.push(cursor.value);
            cursor.continue();
        };
    };
}