import {EventEmitter, Inject, Injectable, Output} from '@angular/core';
import {Http} from '@angular/http';
import {DatabaseService} from './database.service';

@Injectable()
export class AppsService {
  applications: any;

  @Output()
  changes = new EventEmitter();

  /**
   * Construct the service for applications management
   * @param {Http} http
   * @param {DatabaseService} databaseService The service for database management
   */
  constructor(@Inject(Http) public http: Http, public databaseService: DatabaseService) {
    this.databaseService.changes.subscribe(
      (change) => {
        if (change.type === 'Application') {
          this.changes.emit({doc: change.doc, type: change.doc.type});
        } else if (change.type === 'Ressource application') {
          this.changes.emit({doc: change.doc, type: change.doc.applicationType});
        }
      }
    );
  }

  /**
   * Get all applications of the current activity
   * @param activityId The activity Id
   * @returns {Promise<any>} The list of all application of the activity
   */
  public getApplications(activityId) {
    return new Promise(resolve => {
      return this.databaseService.getDocument(activityId)
        .then(activity => {
          this.applications = activity['applicationList'];
          this.databaseService.getDocument(activityId).then( act => {
            this.databaseService.getDocument( act['dbName']).then( parent => {
              if (parent['applicationList'].length > 0) {
                this.applications = this.applications.concat(parent['applicationList']);
              }
              resolve(this.applications);
            });
          });
        });
    });
  }

  /**
   * Create an application to add to the current activity
   * @param app The application to ceate
   * @param dbName The name of the activity database
   * @returns {Promise<any>} The created applications
   */
  public createApp(app, activityId, dbName) {
    console.log('debug : ', app, dbName);
    const guid = this.databaseService.guid();
    const application = {
      _id: `application_${app.provider}_${guid}`,
      name: app.name,
      documentType: 'Application',
      type: app.type,
      status: 'unloaded',
      url: '',
      dbName: dbName,
    };

    if (app.type === 'Chronomètre') {
      application['running'] = false;
      application['initialTime'] = app.options.time;
      application['timeLeft'] = app.options.time;
      application['startedAt'] = '';
    }

    if (app.provider === 'Feuille de calcul') {
      application.url = `https://framacalc.org/${guid}`;
    } else if (app.provider === 'Editeur de texte') {
      application.url = `https://annuel2.framapad.org/p/${guid}`;
    }

    return new Promise(resolve => {
      return this.databaseService.getDocument(activityId).then(activity => {
        activity['applicationList'].push(application._id);
        return this.databaseService.addDocument(activity);
      })
        .then(() => {
          return this.databaseService.addDocument(application).then(res => {
            resolve(res);
          });
        }).catch(err => {
          console.log(`Error in apps service whith call to createApp:
          ${err}`);
        });
    });
  }

  /**
   * Get informations about a specific application
   * @param applicationId The application Id
   */
  getApplicationInfos(applicationId: any) {
    console.log(applicationId);
    return new Promise(resolve => {
      return this.databaseService.getDocument(applicationId).then(application => {
        resolve({
          name: application['name'],
          id: application['_id'],
          type: application['type'],
          status: application['status']
        });
      }).catch(err => {
        console.log(`Error in apps service whith call to getApplicationInfos : 
          ${err}`);
      });
    });
  }

  /**
   * Unload a specified application
   * @param appId The application to unload
   * @returns {number}
   */
  public unloadApp(appId) {
    return 0;
  }

  /**
   * Load a specified application
   * @param appId The application to load
   * @returns {number}
   */
  public loadApp(appId) {
    return 0;
  }

  /**
   * Get an application
   * @param appId The application to get
   * @returns {number}
   */
  public getApp(appId) {
    return 0;
  }

  /**
   * Delete a specified application
   * @param appId The application to delete
   * @returns {Promise<any>} The dleted application
   */
  public deleteApp(appId) {
    return new Promise( resolve => {
      return this.databaseService.removeDocument(appId);
    });
  }

  /**
   * Remove an activity
   * @param activityId The activity to remove
   * @returns {number}
   */
  remove_activity(activityId) {
    return 0;
  }

  /**
   * Duplicate all application from an activity
   * @param inputActivity The input activity
   * @param outputActivity The output activity
   * @returns {number}
   */
  duplicateAppsFromActivity(inputActivity, outputActivity) {
    return 0;
  }

  /**
   * Flush applications when user disconnect
   */
  logout() {
    this.applications = [];
  }

  /**
   * Get ressources of an application
   * @param appId Application Id
   * @returns {Promise<any>} The list of resources
   */
  getRessources(appId) {
    return new Promise(resolve => {
      this.databaseService.db.find({
        selector: {
          'documentType': 'Ressource application',
          'application': appId
        }
      }).then(function (result) {
        resolve(result);
      }).catch(function (err) {
        console.log(`Error in apps service whith call to getRessources : 
          ${err}`);
      });
    });
  }

  /**
   * Switch the status of the application
   * @param applicationId The application Id
   */
  switchApplicationStatus(applicationId: any) {
    return new Promise(resolve => {
      return this.databaseService.getDocument(applicationId).then(application => {
          let status = application['status'];
          if (status === 'unloaded') {
            status = 'loaded';
          } else {
            status = 'unloaded';
          }
          application['status'] = status;
          return this.databaseService.updateDocument(application);
        }
      ).then(() => {
        return this.getApplicationInfos(applicationId);
      })
        .then(appInfos => {
          resolve(appInfos);
        })
        .catch(function (err) {
          console.log(`Error in apps service whith call to getRessources : 
          ${err}`);
        });
    });
  }

  /**
   * Get a specified application
   * @param appId The application Id
   * @returns {Promise<any>} The retreived application
   */
  getApplication(appId: any) {
    console.log(appId);
    return new Promise(resolve => {
      return this.databaseService.getDocument(appId).then(app => {
        resolve(app);
      })
        .catch(function (err) {
          console.log(`Error in apps service whith call to getApplication : 
          ${err}`);
        });
    });
  }

  /**
   * update a specified application
   * @param app The application to update
   * @returns {Promise<any>} The updated application
   */
  updateApplication(app: any) {
    return new Promise(resolve => {
      this.databaseService.updateDocument(app).then(res => {
        resolve(res);
      })
        .catch(function (err) {
          console.log(`Error in apps service whith call to getApplication : 
          ${err}`);
        });
    });
  }

  /**
   * Close a specified application
   * @param appId The application to close
   * @returns {Promise<any>} The closed application
   */
  closeApplication(appId: any) {
    return new Promise(resolve => {
      return this.databaseService.getDocument(appId).then(application => {
          application['status'] = 'unloaded';
          return this.databaseService.updateDocument(application);
        }
      ).then(() => {
        return this.getApplicationInfos(appId);
      })
        .then(appInfos => {
          resolve(appInfos);
        })
        .catch(function (err) {
          console.log(`Error in apps service whith call to closeApplication : 
          ${err}`);
        });
    });
  }

  /**
   * Open a specified application
   * @param appId The application to open
   * @returns {Promise<any>} The opened application
   */
  openApplication(appId: any) {
    return new Promise(resolve => {
      return this.databaseService.getDocument(appId).then(application => {
          application['status'] = 'loaded';
          return this.databaseService.updateDocument(application);
        }
      ).then(() => {
        return this.getApplicationInfos(appId);
      })
        .then(appInfos => {
          resolve(appInfos);
        })
        .catch(function (err) {
          console.log(`Error in apps service whith call to openApplication : 
          ${err}`);
        });
    });
  }
}
