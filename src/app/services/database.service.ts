import {EventEmitter, Injectable, Output} from '@angular/core';
import PouchDB from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
import {environment} from 'environments/environment.prod';
import {isNullOrUndefined} from "util";

@Injectable()
export class DatabaseService {

  db: any;
  dbRemote: any;
  dbList: Array<any> = [];
  options: any;
  optionsReplication: any;
  dbSync: any;
  changes: EventEmitter<any> = new EventEmitter();
  dbNames: Array<string> = [];
  room: string;

  @Output()
  change = new EventEmitter();

  /**
   * Construct the service to communicate with the local and remote database
   */
  constructor() {
    require('events').EventEmitter.defaultMaxListeners = 0;

    PouchDB.plugin(PouchdbFind);
    PouchDB.plugin(require('pouchdb-authentication'));

    this.room = environment.ROOM;
    console.log(environment.DB);

    this.dbRemote = new PouchDB(`${environment.URL_DB}${environment.PORT_DB}/${environment.DB}`, {
      auth: {
        username: `${environment.USERNAME_DB}`,
        password: `${environment.PASSWORD_DB}`
      },
    });

    /*this.dbRemote.compact();*/
    this.db = new PouchDB(environment.DB);

    /*
    this.db.replicate.to(this.dbRemote).on('change', changes => {
      console.log(`sync 1 change ${changes}`);
    }).on('paused', function (info) {
      console.log('pause: ', info);
    }).on('active', function (info) {
      console.log('active: ', info);
    }).on('error', err => {
      console.log(`sync error ${err}`);
    });
    */

    this.dbList.push('user_list');

    this.options = {
      live: true,
      retry: true,
      continuous: true,
    {ajax: {timeout: 10000}}
      //since: 'now'
      //since: 0,
      //revs_limit: 2,
      //filter: 'appFilters/by_db_name',
      //query_params: { 'dbNames': ['user_list'] }
    };

    this.optionsReplication = this.options;
    this.optionsReplication.live = false;
    this.optionsReplication.continuous = false;

    /*
    this.db.sync(this.dbRemote).on('change', changes => {
      console.log(`sync change ${changes}`);
    }).on('paused', function (info) {
      console.log('pause: ', info);
    }).on('active', function (info) {
      console.log('active: ', info);
    }).on('error', err => {
      console.log(`sync error ${err}`);
    });
    */

    const tempOptions = this.options;

    this.db.compact().then((res) => {
    console.log(this.db);
      //return this.db.replicate.to(this.dbRemote, this.optionsReplication).on('complete', () => {
      //  console.log("begin sync");
      //  return this.db.replicate.from(this.dbRemote).on('complete', () => {
      //    console.log("sync complete");
      let tmpthis = this;
      this.dbRemote.sync(this.db, this.options).on('change', changes => {
        console.log(`sync change ${changes}`);
      }).on('paused', function (info) {
        tmpthis.changes.emit({type: 'CONNEXION_DONE'})
        console.log('pause: ', info);
      }).on('active', function (info) {
        console.log('active: ', info);
      }).on('error', err => {
        console.log(`sync error ${err}`);
      });
          /**this.dbSync = this.db.sync(this.dbRemote, this.options);
           this.dbSync.on('change', changes => {
            console.log(`sync change ${changes}`);
          }).on('paused', function (info) {
            console.log('pause: ', info);
          }).on('active', function (info) {
            console.log('active: ', info);
          }).on('error', err => {
            console.log(`sync error ${err}`);
          });
           **/
          /*this.dbSync = this.db.sync(this.dbRemote, this.options).on('change', changes => {
            console.log(`sync change : ${changes}`);
          }).on('paused', function (info) {
            console.log('pause: ', info);
          }).on('active', function (info) {
            console.log('active: ', info);
          }).on('error', err => {
            console.log(`sync error ${err}`);
          });*/
          /*
          this.db.sync(this.dbRemote, this.options).on('change', changes => {
            console.log(`sync in change ${changes}`);
          }).on('paused', function (info) {
            console.log('pause in: ', info);
          }).on('active', function (info) {
            console.log('active in : ', info);
          }).on('error', err => {
            console.log(`sync error in ${err}`);
          });*/

          //this.sync();
        /*}).on('change', changes => {
          console.log(`sync change ${changes}`);
        }).on('paused', function (info) {
          console.log('pause: ', info);
        }).on('active', function (info) {
          console.log('active: ', info);
        }).on('error', err => {
          console.log(`sync error ${err}`);
        });
      });*/
    })
      .catch(err => {
        console.log(`error with call to databaseService initialisation : ${err}`);
        this.changes.emit({type: 'CONNEXION_IMPOSSIBLE'});
      });


    this.db.changes({
      live: true,
      include_docs: true,
      retry: true,
      timeout: false,
      heartbeat: false,
      //filter: 'appFilters/by_db_name',
      //query_params: { 'dbNames': ['user_list'] }
    }).on('change', change => {
      this.handleChange(change);
      console.log("change on local");
    }).on('paused', function (info) {
      console.log('pause: ', info);
      this.changes.emit({type: 'CONNEXION_DONE'});
    }).on('active', function (info) {
      console.log('active: ', info);
    }).on('error', function (err) {
      console.log('activities: ', err);
    }).catch(err => {
      console.log(err);
    });


    this.dbRemote.changes({
      live: true,
      include_docs: true,
      retry: true,
      timeout: false,
      heartbeat: false,
      //filter: 'appFilters/by_db_name',
      //query_params: { 'dbNames': ['user_list'] }
    }).on('change', change => {
      this.handleChangeRemote(change);
      console.log('change_on_remote');
    }).on('paused', function (info) {
      this.changes.emit({type: 'CONNEXION_DONE'});
      console.log('pause: ', info);
    }).on('active', function (info) {
      console.log('active: ', info);
    }).on('error', function (err) {
      console.log('activities: ', err);
    }).catch(err => {
      console.log(err);
    });

  }

  sync() {
    console.log('sync');
    //this.dbSync.cancel();
    const options = {
      live: true,
      retry: true,
      continuous: true,
      //revs_limit: 2,
      //filter: 'appFilters/by_db_name',
      //query_params: {'dbNames': this.dbList}
    };
    //console.log(options.query_params);
    /*
    this.dbSync = this.db.sync(this.dbRemote, options).on('change', change => {
      console.log(`Change : ${change}`);
    }).on('error', function (err) {
      console.log(err);
    }
    */

    /*
    this.db.replicate.to(this.dbRemote, options)
      .on('change', change => {
        console.log(`Change remote`);
      }).on('error', function (err) {
      console.log(err);
    });
    this.db.replicate.from(this.dbRemote, this.options).on('change', change => {
      console.log(`Change local`);
    }).on('error', function (err) {
      console.log(err);
    });
    */
  }

  /**
   *
   * Handle changes
   * @param change change that occurs
   */
  handleChange(change) {
    //console.log(change.doc);
    console.log(change);
    this.changes.emit({type: change.doc.documentType, doc: change.doc});
  }

  handleChangeRemote(change) {
    return this.getDocument(change.doc._id)
      .then(() => {
        this.forceUpdateDocument(change.doc);
      })
      .catch(function (err) {
      console.log(err);
    });
  }

  forceUpdateDocument(doc) {
    const tmp_this = this;
    return this.db.get(doc._id).then((origDoc, tmp_this) => {
      doc._rev = origDoc._rev;
      return tmp_this.db.put(doc);
    }).catch(function (err) {
      if (err.status === 409) {
        return tmp_this.updateDocument(doc);
      } else { // new doc
        return tmp_this.db.put(doc);
      }
    });
  }


  /**
   * Add a new external database to the local databse
   * @param {string} databaseName The new database to add
   * @param {any} options Options of replication
   * @returns {Promise<any>} Return the database
   */
  addDatabase(databaseName: string, options = this.options) {
    return new Promise(resolve => {
      if (this.dbList.indexOf(databaseName) !== -1) {
        resolve(databaseName);
      } else {
        console.log("Add database : ", databaseName)
        this.dbList.push(databaseName);
        //this.options.query_params.dbNames.push(databaseName);
        //this.optionsReplication.query_params.dbNames.push(databaseName);
        /*
        this.db.replicate.from(this.dbRemote, this.optionsReplication)
          .on('change', change => {
            if (change.docs[0].dbName === databaseName) {
              console.log(this.options);
              /**this.dbSync.cancel();
               this.dbSync = this.db.sync(this.dbRemote, this.options);
               this.dbSync.on('change', changes => {
                console.log(`sync change ${changes}`);
              }).on('paused', function (info) {
                console.log('pause: ', info);
              }).on('active', function (info) {
                console.log('active: ', info);
              }).on('error', err => {
                console.log(`sync error ${err}`);
              });**/
        /*
              this.sync();
              resolve(databaseName);
            }
          })
          .on('complete', () => {
            console.log(this.options);
            /**this.dbSync.cancel();
             this.dbSync = this.db.sync(this.dbRemote, this.options);
             this.dbSync.on('change', changes => {
              console.log(`sync change ${changes}`);
            }).on('paused', function (info) {
              console.log('pause: ', info);
            }).on('active', function (info) {
              console.log('active: ', info);
            }).on('error', err => {
              console.log(`sync error ${err}`);
            });
             **/
        /*
            this.sync();
            resolve(databaseName);
          });


      }*/
        //this.sync();
        resolve(databaseName);
      }
    });
    }


  /**
   * Definitive supression of document
   * @param documentId The document to remove
   * @returns {Promise<any>}
   */
  ereaseDocument(documentId) {
    return new Promise(resolve => {
      return this.dbRemote.remove(documentId);
    });
  }

  /**
   * Create a new database
   * @param {string} databaseName The name of the database to create
   * @param {any} options Otpions of replication
   * @returns {Promise<any>} The created database
   */
  createDatabase(databaseName: string, options = this.options) {
    console.log(databaseName);
    return new Promise(resolve => {
      const guid = this.guid();
      const newDbName = `${databaseName}_${guid}`;
      this.dbList.push(databaseName);
      //this.options.query_params.dbNames.push(databaseName);
      //this.optionsReplication.query_params.dbNames.push(databaseName);
      //this.dbSync.cancel();
      //this.dbSync = this.db.sync(this.dbRemote, this.options);
      //this.sync();
      resolve(newDbName);
    });
  }

  /**
   * add document to a database
   * @param document The document to add
   * @returns {Promise<any>} The document added
   */
  addDocument(document: any) {
    return new Promise((resolve, reject) => {
      this.dbRemote.put(document)
        .then(response => {
          resolve(response);
        })
        .catch(err => {
          console.log(`Error in database service whith call to addDocument:
          ${err}`);
          reject(err);
        });
    });
  }

  /**
   * Erase a database
   * @param dbName The database to erase
   * @returns {Promise<any>} The cofirmation of database deletion
   */
  ereaseDatabase(dbName) {
    return new Promise(resolve => {
      return this.dbRemote.allDocs({include_docs: true}).then(docs => {
        const promises = docs.rows.map((doc) => {
          if (doc.doc.dbName === dbName) {
            console.log('deleted_doc :', doc.doc);
            doc.doc._deleted = true;
            return this.updateDocument(doc.doc);
          }
        });
        return Promise.all(promises);
      }).then(res => {
        resolve(res);
      });
    });
  }

  /**
   * Get a document from a database
   * @param {string} docId The Id of the document to retrieve
   * @returns {Promise<any>} The document
   */
  getDocument(docId: string) {
    return new Promise((resolve, reject) => {
      return this.dbRemote.allDocs().then(res => {
      })
        .then(() => {
          return this.dbRemote.get(docId);
        })
        .then(result => {
          if (!isNullOrUndefined(result['_conflict'])) {
            console.log(result);
          }
          resolve(result);
        })
        .catch(err => {
          console.log(`Error in database service whith call to getDocument ${docId}:
          ${err}`);
          reject(err);
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
   * @param {any} doc The document to update
   */
  /**updateDocument(doc: any) {
    return new Promise((resolve, reject) => {
      this.db.get(doc._id).then(docu => {
        doc['_rev'] = docu['_rev'];
        this.db.put(doc)
          .then(res => {
            console.log(res);
            resolve(res);
          })
          .catch(err => {
            resolve(doc);
            console.log(`Error in database service whith call to updateDocument:
          ${err}. Document: ${doc['_id']}; Revision: ${doc['_rev']}`);
            //reject(err);
          });
      });
    });
  }**/

  updateDocument(doc) {
    const tmp_this = this;
    return this.dbRemote.get(doc._id).then((origDoc, tmp_this) => {
      doc._rev = origDoc._rev;
      return tmp_this.dbRemote.put(doc);
    }).catch(function (err) {
      if (err.status === 409) {
        return tmp_this.updateDocument(doc);
      } else { // new doc
        return tmp_this.dbRemote.put(doc);
      }
    });
  }

  /**
   * Remove the specified document
   * @param id The document to remove
   */
  removeDocument(documentId) {
    return new Promise(resolve => {
      this.dbRemote.get(documentId).then(document => {
        if (document.documentType === 'Resource' || document.documentType === 'Application') {
          const changes = [];
          this.db.find({
            selector: {documentType: 'Activity', dbName: document.dbName},
            sort: ['_id']
          }).then(function (result) {
            for (const element of result.docs){
              if (document.documentType === 'Resource') {
                const index1 = element.resourceList.indexOf(document._id);
                if (index1 !== -1) {
                  element.resourceList.splice(index1, 1);
                  changes.push(element);
                }
              } else if (document.documentType === 'Application') {
                const index2 = element.applicationList.indexOf(document._id);
                if (index2 !== -1) {
                  element.applicationList.splice(index2, 1);
                  changes.push(element);
                }
              }
            }
          }).catch(function (err) {
          });
          this.db.bulkDocs(changes).then( () => {
            document._deleted = true;

            this.db.put(document).then(res => {
              resolve(res);
            })
              .catch(err => {
                console.log(`Error in database service whith call to deleteDocument:
          ${err}`);
              });
          });
        } else {
          this.db.remove(document).then(res => {
            resolve(res);
          });
        }
      });
    });
  }

  /**
   * Retrieve all documents of database
   * @param dbName The name of the database where to retrieve al documents
   */
  getAllDocs(dbName) {
    return this.db.find({
      selector: {
        dbName: dbName
      }
    }).then(res => {
      return res;
    })
      ;
  }
}
