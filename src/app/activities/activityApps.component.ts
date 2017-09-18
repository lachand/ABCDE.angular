import { Component} from '@angular/core';
import {UserService} from '../services/user.service';
import {ActivityService} from '../services/activity.service';
import {Router} from '@angular/router';
import {MdDialog} from '@angular/material';
import {AppLoadingComponent} from './appLoading.component';

@Component({
  selector: 'app-activity-apps',
  templateUrl: './activityApps.component.html',
  styleUrls: ['./activityApps.component.scss']
})

export class ActivityAppsComponent {
  user: UserService;
  dialog: any;

  constructor(private activityService: ActivityService, private router: Router,
              dialog: MdDialog) {
    this.dialog = dialog;
  }

  loadApp() {
    const dialogRef = this.dialog.open(AppLoadingComponent);
    dialogRef.componentInstance.dialogRef = dialogRef;
  }

  unloadApp(appId) {
    return this.activityService.apps.unloadApp(appId);
  }

}
