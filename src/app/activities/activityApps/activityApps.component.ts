import { ChangeDetectorRef, Component } from "@angular/core";
import { UserService } from "../../services/user.service";
import { ActivityService } from "../../services/activity.service";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material";
import { AppLoadingComponent } from "../appLoading/appLoading.component";

@Component({
  selector: "app-activity-apps",
  templateUrl: "./activityApps.component.html",
  styleUrls: ["./activityApps.component.scss"]
})
export class ActivityAppsComponent {
  user: UserService;
  dialog: any;

  constructor(
    public activityService: ActivityService,
    public router: Router,
    dialog: MatDialog,
    private ref: ChangeDetectorRef
  ) {
    this.dialog = dialog;
    this.activityService.changes.subscribe(change => {
      if (!this.ref["destroyed"]) {
        this.ref.detectChanges();
      }
    });
  }

  loadApp() {
    const dialogRef = this.dialog.open(AppLoadingComponent);
    dialogRef.componentInstance.dialogRef = dialogRef;
  }

  unloadApp(appId) {
    //return this.activityService.apps.unloadApp(appId);
  }
}
