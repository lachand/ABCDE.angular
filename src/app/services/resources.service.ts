import {DatabaseService} from './database.service';
import {EventEmitter, Injectable, Output} from '@angular/core';
import {LoggerService} from './logger.service';
import {ActivityService} from 'app/services/activity.service';
import {UserService} from "./user.service";

@Injectable()
export class ResourcesService {

  resources: any;

  @Output()
  changes = new EventEmitter();

  /**
   * Construct the service to edit resources
   * @param {DatabaseService} The database where resources are
   * @param {LoggerService} A logger for research purpose
   */
  constructor(public database: DatabaseService, private logger: LoggerService, private userService: UserService) {
    this.resources = {};

    this.database.changes.subscribe(
      (change) => {
        if (change.type === 'Resource') {
          this.changes.emit({doc: change.doc, type: change.doc.type});
        }
      }
    );
  }

  /**
   * Get all resources of the current activity
   * @param activityId The Id of the activity to get resources
   * @returns {Promise<any>}
   */
  public getResources(activityId) {
    return new Promise(resolve => {
      return this.database.getDocument(activityId)
        .then(activity => {
          this.resources = activity['resourceList'];
          this.database.getDocument(activityId).then( act => {
            if (act['dbName'] !== act['_id']) {
              this.database.getDocument(act['dbName']).then(parent => {
                if (parent['resourceList'].length > 0) {
                  this.resources = this.resources.concat(parent['resourceList']);
                  this.resources = this.resources.filter(this.onlyUnique);
                }
              });
            }
            resolve(this.resources);
          });
        });
    });
  }

  /**
   * Create a new resource and upload it
   * @param resource The resource content to create
   * @param activityId The activity where to add the resource
   */
  createResource(resource, activityId) {
    return new Promise(resolve => {
      let activity;
      let resourceToAdd;
      return this.database.getDocument(activityId).then(res => {
        activity = res;
        if (activity['resourceList'].indexOf(resource.name) > -1) {
          resolve('error');
        } else {
        if (resource.type === 'url') {
          resourceToAdd = {
            _id: `resource_${resource.name}`,
            name: resource.name,
            activity: activityId,
            documentType: 'Resource',
            type: resource.type,
            url: resource.value,
            creator: this.userService.id,
            dbName: activity['dbName']
          };
        } else {
          resourceToAdd = {
            _id: `resource_${resource.name}`,
            name: resource.name,
            activity: activityId,
            documentType: 'Resource',
            type: resource.type,
            creator: this.userService.id,
            dbName: activity['dbName'],
            _attachments: {
              filename: {
                content_type: resource.type,
                data: resource
              }
            }
          };
        }
        this.logger.log('CREATE', activityId, `resource_${resource.name}`, 'create ressource');
        return this.database.addDocument(resourceToAdd);
      }})
        .then(res => {
          activity['resourceList'].push(`resource_${resource.name}`);
          this.resources.push(`resource_${resource.name}`);
          return this.database.updateDocument(activity);
        })
        .then(() => resolve(resourceToAdd))
        .catch(err => {
          console.log(`Error in resource service whith call to createResource : 
          ${err}`);
        });
    });
  }

  /**
   * Get informations about a specific resource
   * @param resourceId The resource to get
   */
  getResourceInfos(resourceId: any) {
    return new Promise(resolve => {
      return this.database.getDocument(resourceId).then(resource => {
        if (resource['type'] === 'url') {
          resolve({
            name: resource['name'],
            id: resource['_id'],
            type: resource['type'],
            status: resource['status'],
            url: resource['url'],
            creator: resource['creator']
          });
        } else {
          resolve({
            name: resource['name'],
            id: resource['_id'],
            type: resource['type'],
            status: resource['status'],
            creator: resource['creator']
          });
        }
      }).catch(err => {
        console.log(`Error in apps service whith call to getResourceInfos : 
          ${err}`);
      });
    });
  }

  /**
   * Delete a specified resource
   * @param resourceId The Id of the resource to delete
   * @returns {Promise<any>}
   */
  deleteResource(resourceId) {
    return new Promise( resolve => {
      this.logger.log('DELETE', 'na', `resource_${resourceId}`, 'delete ressource');
      return this.database.removeDocument(resourceId);
    });
  }

  /**
   * Get a resource
   * @param resource The resource to get from the database
   * @returns {Promise<any>} The resource obtained
   */
  getResource(resource) {
    return new Promise(resolve => {
      return this.database.getDocument(resource).then(res => {
        resolve(res);
      });
    });
  }

  /**
   * Get data of a specified resource
   * @param resourceId The resource Id of data to get
   * @param attachmentId The attachement Id linked to resource
   * @returns {Promise<any>} The raw attachement of a resource
   */
  getResourceData(resourceId: any, attachmentId: any) {
    return new Promise(resolve => {
      return this.database.db.getAttachment(resourceId, attachmentId).then(res => {
        resolve(res);
      });
    });
  }

  /**
   * Open a specified resource
   * @param resourceId The Id of the resource to open
   * @returns {Promise<any>} The opened resource
   */
  openResource(resourceId: any) {
    return new Promise(resolve => {
      return this.database.getDocument(resourceId).then(resource => {
          resource['status'] = 'loaded';
          return this.database.updateDocument(resource);
        }
      ).then(() => {
        return this.getResourceInfos(resourceId);
      })
        .then(resourceInfos => {
          this.logger.log('OPEN', resourceInfos['dbName'], `resource_${resourceId}`, 'open ressource');
          resolve(resourceInfos);
        })
        .catch(function (err) {
          console.log(`Error in apps service whith call to openResource : 
          ${err}`);
        });
    });
  }

  /**
   * Close a specified resource
   * @param resourceId The resource to close
   * @returns {Promise<any>} The closed resource
   */
  closeResource(resourceId: any) {
    return new Promise(resolve => {
      return this.database.getDocument(resourceId).then(resource => {
          resource['status'] = 'unloaded';
          return this.database.updateDocument(resource);
        }
      ).then(() => {
        return this.getResourceInfos(resourceId);
      })
        .then(resourceInfos => {
          this.logger.log('CLOSE', resourceInfos['dbName'], `resource_${resourceId}`, 'close ressource');
          resolve(resourceInfos);
        })
        .catch(function (err) {
          console.log(`Error in apps service whith call to closeResource : 
          ${err}`);
        });
    });
  }

  onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  /**
   * Change the name of the resource
   * @param resourceId The resource to edit
   * @param name The new name
   */
  editName(resourceId: any, name: any) {
    return this.getResource(resourceId).then( (res) => {
      console.log(res);
        res['name'] = name;
        this.logger.log('EDIT', 'na', `resource_${resourceId}`, 'edit ressource');
        return this.database.updateDocument(res);
      }
    );
  }
}
