import {EventEmitter, Injectable, Output} from '@angular/core';
import * as config from 'variables';
import PouchDB from 'pouchdb';

@Injectable()
export class DatabaseService {

  db: any;
  dbRemote: any;
  dbList: Array<any> = [];
  options: any;
  changes: EventEmitter<any> = new EventEmitter();

  @Output()
  change = new EventEmitter();

  constructor() {

    this.db = new PouchDB('localDatabase');
    this.dbRemote = new PouchDB(`${config.HOST}${config.PORT}/userList`);
    this.dbRemote.info()
      .then((infos) => {
        this.options = {
          live: true,
          retry: true,
        };

        console.log(infos);

        const tempOptions = this.options;
        tempOptions.filter = function (doc) {
          return doc.dbName === 'userList';
        };

        this.dbList.push(config.HOST + config.PORT + '/userList');
        this.db.replicate.from(this.dbRemote, tempOptions);
        this.db.replicate.to(this.dbRemote, tempOptions);

        this.db.changes({
          since: 'now',
          live: true,
          include_docs: true
        }).on('change', change => {
          console.log("changes");
          this.handleChange(change);
        }).on('paused', function (info) {
          // replication was paused, usually because of a lost connection
        }).on('active', function (info) {
          // replication was resumed
        }).on('error', function (err) {
          console.log('activities', err);
        });
      });
  }

  /**
   * Handle changes
   * @param change
   */
  handleChange(change) {
    this.changes.emit({type: change.doc.documentType, doc: change.doc});
  }

  /**
   * Add a new external database to the local databse
   * @param {string} databaseName
   * @param {any} options
   * @returns {Promise<any>}
   */
  addDatabase(databaseName: string, options = this.options) {
    return new Promise(resolve => {
      if (this.dbList.indexOf(databaseName) !== -1) {
        resolve(databaseName);
      } else {
        const dbToAdd = new PouchDB(`${config.HOST}${config.PORT}/${databaseName}`);
        dbToAdd.info()
          .then(() => {
            const tempOptions = this.options;
            tempOptions.filter = function (doc) {
              return doc.dbName === databaseName;
            };
            this.dbList.push(databaseName);
            this.db.replicate.from(dbToAdd, tempOptions);
            this.db.replicate.to(dbToAdd, tempOptions);
            resolve(dbToAdd);
          });
      }
    });
  }

  createDatabase(databaseName: string, options = this.options) {
    return new Promise(resolve => {
      const guid = this.guid();
      const dbToAdd = new PouchDB(`${config.HOST}${config.PORT}/${databaseName}_${guid}`);
      dbToAdd.info()
        .then(() => {
          const tempOptions = this.options;
          tempOptions.filter = function (doc) {
            return doc.dbName === `${databaseName}_${guid}`;
          };
          this.dbList.push(`${databaseName}_${guid}`);
          this.db.replicate.from(dbToAdd, tempOptions);
          this.db.replicate.to(dbToAdd, tempOptions);
          resolve(dbToAdd);
        });
    });
  }

  /**
   * add document to a database
   * @param document
   * @returns {Promise<any>}
   */
  addDocument(document: any) {
    return new Promise(resolve => {
      this.db.put(document)
        .then(response => {
          resolve(response);
        })
        .catch(err => {
          console.log(`Error in database service whith call to addDocument:
          ${err}`);
        });
    });
  }

  /**
   * Get a document from a database
   * @param {string} docId
   * @returns {Promise<any>}
   */
  getDocument(docId: string) {
    console.log(docId);
    return new Promise(resolve => {
      return this.db.allDocs().then(res => {
        console.log(res);
      })
        .then(() => {
          return this.db.get(docId);
        })
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          console.log(`Error in database service whith call to getDocument:
          ${err}`);
        });
    });
  }

  /**
   * Generates a GUID string.
   * @returns {String} The generated GUID.
   * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
   * @author Slavik Meltser (slavik@meltser.info).
   * @link http://slavik.meltser.info/?p=142
   */
  guid() {
    function _p8(s) {
      const p = (Math.random().toString(16) + '000000000').substr(2, 8);
      return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
    }

    return _p8(false) + _p8(true) + _p8(true) + _p8(false);
  }

  /**
   * Update an existing document
   * @param {any} doc
   */
  updateDocument(doc: any) {
    return new Promise(resolve => {
      this.db.put(doc)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          console.log(`Error in database service whith call to updateDocument:
          ${err}`);
        });
    });
  }
}