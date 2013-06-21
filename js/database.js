var database;
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
    window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
    window.msIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
function DB() {
    database = this;
    this.data = [];
    this.produto = null;
    this.db = null;
    this.version = 2
    this.getting = false;
    this.open = function () {
        var request = indexedDB.open('qicaixa2', database.version);
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            
            try {
                var objectStore = db.createObjectStore('produtos', { keyPath: 'id' });
                objectStore.createIndex('id', 'id', { unique: true });
            }
            catch (e){
            }

            try {
                var objectStore = db.createObjectStore('vendas', { keyPath: 'id', autoincrement: true });
                objectStore.createIndex('id', 'id', { unique: true });
            }
            catch (e) {
            }
        };

        request.onsuccess = function (e) {
            database.db = e.target.result;
            database.getAllProdutos();
        };
    };

    this.addProduto = function (produto) {
        var trans = database.db.transaction(['produtos'], 'readwrite');
        trans.oncomplete = function (e) {
            database.getAllProdutos();
        };
        var store = trans.objectStore('produtos');
        var request = store.put(produto);
    };

    this.getAllProdutos = function (callback) {
        var store = database.db.transaction(['produtos'], 'readwrite').objectStore('produtos');
        database.data = [];
        if (!database.getting) {
            database.getting = true;
            store.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;

                if (!cursor) {
                    database.getting = false;
                    if (callback) {
                        callback();
                    }
                    return;
                }

                database.data.push(cursor.value);
                cursor.continue();
            };
        }
    };

    this.getProdutoById = function (id, callback) {
        var store = database.db.transaction(['produtos'], 'readwrite').objectStore('produtos');
        var index = store.index('id');
        index.get(id).onsuccess = function (event) {
            console.log(event.target.result);
            callback(event.target.result);
        };
    };

    this.procurarProd = function (desc, callback) {
        var store = database.db.transaction(['produtos'], 'readwrite').objectStore('produtos');
        if (!database.getting) {
            database.getting = true;
            var tempData = [];
            store.openCursor(IDBKeyRange.bound(desc, desc + '\uffff')).onsuccess = function (e) {
                var cursor = e.target.result;

                if (!cursor) {
                    database.getting = false;
                    if (callback) {
                        callback(tempData);
                    }
                    return;
                }

                tempData.push(cursor.value);
                cursor.continue();
            };
        }
    };
}