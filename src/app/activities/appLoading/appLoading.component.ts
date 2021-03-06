import { Component } from "@angular/core";
import { ActivityService } from "../../services/activity.service";
import { Router } from "@angular/router";
import { MatDialogRef } from "@angular/material";

@Component({
  selector: "app-app-loading",
  templateUrl: "./appLoading.component.html"
})
export class AppLoadingComponent {
  activity: any;
  appToLoad: any;
  dialogRef: MatDialogRef<AppLoadingComponent>;

  constructor(public activityService: ActivityService, public router: Router) {
    this.activity = activityService.activityLoaded;
  }

  loadApp() {
    const appId = this.appToLoad;
    if (appId != null) {
      //this.activityService.apps.loadApp(appId);
      this.dialogRef.close();
    }
  }
}
