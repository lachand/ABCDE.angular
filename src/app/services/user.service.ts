import {EventEmitter, Injectable, Output} from '@angular/core';
import {User} from '../../models/user.model';
import * as config from 'variables';
import PouchDB from 'pouchdb';

@Injectable()
export class UserService {
  loggedIn = false;
  db: any;
  dbRemote: any;
  user: any;
  name: any;
  id: any;
  avatar: any;
  fonction: any;
  participants: any = null;
  allUsers: Array<any>;
  userSync: any;

  @Output()
  change = new EventEmitter();

  constructor() {
    this.loggedIn = false;
    this.db = new PouchDB(config.HOST + config.PORT + '/users');
    this.dbRemote = new PouchDB(config.HOST + config.PORT + '/users');
    const options = {
      live: true,
      retry: true,
      continuous: true,
      timeout: false,
      heartbeat: false,
      ajax: {
        timeout: false,
        hearbeat: false
      }
    };
    this.userSync = this.db.sync(this.dbRemote, options);
    this.getAllusers();
  }

  public login(username, password) {
    return new Promise((resolve, reject) => {
      this.db.login(username, password, function (err, response) {
        if (err) {
          if (err.name === 'unauthorized') {
            console.log('name or password incorrect');
            reject(err);
          } else {
            console.log(err);
            reject(err);
          }
        }
      }).then((result) => {
        this.loggedIn = result['ok'];
        console.log('logged');
        this.db.getUser(username, function (err, response) {
          if (err) {
            if (err.name === 'not_found') {
              console.log('user not found');
              reject(err);
            } else {
              console.log(err);
              reject(err);
            }
          }}).then( (res) => {
          console.log(res);
          this.name = res['name'];
          this.id = res['_id'];
          this.avatar = res['avatar'];
          this.fonction = res['fonction'];
          resolve(this.loggedIn);
          });
          }
        ).catch(console.log.bind(console));
        }
      );
  }

  getAllusers() {
    return new Promise(resolve => {
      this.db.allDocs({
        include_docs: true,
        attachments: true
      }).then(result => {
        this.allUsers = [];
        const docs = result.rows.map((row) => {
          if (row.id !== '_design/byActivity') {
            this.allUsers.push(row.doc);
          }
        });
        resolve(this.allUsers);
      }).catch(console.log.bind(console));
      this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => {
        this.handleChangeAllUsers(change);
        this.handleChangeParticipants(change);
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  getParticipants(activityId) {
    return new Promise(resolve => {
      this.db.query('byActivity/by-activity',
        { startkey: activityId, endkey: activityId}).then(result => {
        this.participants = [];
        const docs = result.rows.map((row) => {
          this.participants.push(row.value);
        });
        resolve(this.participants);
      }).catch(console.log.bind(console));
      //this.db.changes({live: true, since: 'now', include_docs: true}).once('change', (change) => {
        //this.handleChangeParticipants(change);
        //this.handleChangeAllUsers(change);
      //});
    }).catch((error) => {
      console.log(error);
    });
  }

  remove_activity(activityId) {
    return new Promise( resolve => {
      const usersToChange = [];
      for (const user of this.allUsers) {
        user.activites.splice(user.activites.indexOf(activityId), 1);
        usersToChange.push(user);
      }
      this.db.bulkDocs(usersToChange).then(result => {
        resolve(result);
      });
    }
  );
  }

  addActivity(activityId, userId) {
    this.db.get(userId).then( userSelected => {
      console.log(userSelected);
      userSelected.activites[activityId] = {'status' : 'paused'};
      console.log(userSelected.activites);
      this.db.put(userSelected).thne(result => {
        console.log('result : ', result);
      });
    });
  }

  private handleChangeParticipants(change) {
    if (this.participants != null) {
      this.db.get(change.doc._id).then(user => {
        console.log(user);
        const document = user;
        let changedDoc = null;
        let changedIndex = null;
        if (!document._deleted) {
          this.participants.forEach((doc, index) => {
            if (doc._id === document._id) {
              changedDoc = doc;
              changedIndex = index;
            }
          });
          if (changedDoc) {
            // = delete des participants de l'activité chargée
            this.participants.splice(changedIndex, 1);
            this.change.emit({changeType: 'delete', value: changedIndex});
          } else {
            this.participants.push(document);
            this.change.emit({changeType: 'create', value: document});
          }
        } else {
          this.participants.splice(changedIndex, 1);
          this.change.emit({changeType: 'delete', value: changedIndex});
        }
      });
    }
  }

  private handleChangeAllUsers(change) {
    for (const document of change.doc){
    let changedDoc = null;
    let changedIndex = null;
    if (!document._deleted) {
      this.allUsers.forEach((doc, index) => {
        if (doc._id === document._id) {
          changedDoc = doc;
          changedIndex = index;
        }
      });
      if (changedDoc) {
        this.allUsers[changedIndex] = document;
        this.change.emit({changeType: 'modification', value: document});
      } else {
        this.allUsers.push(document);
        this.change.emit({changeType: 'create', value: document});
      }
    } else {
      this.allUsers.splice(changedIndex, 1);
      this.change.emit({changeType: 'delete', value: changedIndex});
    }
  }
  }

  setActivityStatusByTeacher(activityId, status) {
    return new Promise( (resolve, reject) => {
      const users = [];
      this.db.query('byActivity/by-activity',
        {startkey: activityId, endkey: activityId})
        .then(result => {
          console.log(result);
          const docs = result.rows.map((row) => {
            users.push(row.value);
            console.log(row.value);
          });
          for (const user of users) {
            for (const activity of user.activites) {
              if (activity.id === activityId) {
                activity.status = status;
              }
            }
          }
          console.log(users);
          this.db.bulkDocs(users).then(result2 => { console.log(resolve(result2)); });
        });
    });
  }

  setActivityStatusByStudent(activityId, status) {
    return new Promise( (resolve, reject) => {
      return this.db.get(this.id)
        .then( user => {
          for (const activity of user.activites){
            if (activity.id === activityId){
              activity.status = status;
            }
          }
          return this.db.put(user);
        });
    });
  }

  logout() {
    this.loggedIn = false;
    this.name = null;
    this.id = null;
    this.avatar = null;
    this.fonction = null;
    this.participants = null;
  }

  isLoggedIn() {
    return this.loggedIn;
  }
}
