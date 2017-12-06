import {Component, Input, OnInit} from '@angular/core';
import {ActivityService} from '../../services/activity.service';
import {Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {LoggerService} from "../../services/logger.service";

@Component({
  selector: 'app-activity-infos',
  templateUrl: './activityInfos.component.html',
  styleUrls: ['./activityInfos.component.scss']
})

export class ActivityInfosComponent implements OnInit {

  @Input() activityId;
  activityInfos: any;

  constructor(public user: UserService,
              public activityService: ActivityService,
              public router: Router,
              private logger: LoggerService) {
  }

  ngOnInit(): void {
    this.activityService.getActivityInfos(this.activityId).then(activityInfos => {
      this.activityInfos = activityInfos;
      console.log(activityInfos);
    });
    this.activityService.changes.subscribe((change) => {
      if (change.type === 'Main') {
        this.activityService.getActivityInfos(this.activityId).then(activityInfos => {
          this.activityInfos = activityInfos;
        });
      }
    });
  }

  /**
   * Load a specific activity
   * @param activity_id
   */
  load_activity(activity_id) {
    this.logger.log('OPEN', activity_id, 'open activity view');
    this.activityService.load_activity(activity_id).then(res => {
      this.router.navigate(['activity_apps/' + activity_id]);
    });
  }

  /**
   * Show a specific activity
   * @param activity_id
   */
  show_activity(activity_id) {
    this.logger.log('OPEN', activity_id, 'open activity view');
    this.activityService.load_activity(activity_id).then(res => {
      this.router.navigate(['activity_view/' + activity_id]);
    });
  }

  /**
   * Edit a specific activity
   * @param activity_id
   */
  edit_activity(activity_id) {
    this.logger.log('OPEN', activity_id, 'open activity edition');
    this.activityService.load_activity(activity_id).then(res => {
      this.router.navigate(['activity_edit/' + activity_id]);
    });
  }

  /**
   * Select if we load the view or the edition of a specific activity
   * @param activityId
   */
  view_or_edit(activityId) {
    console.log(this.user.fonction);
    if (this.user.fonction === 'Enseignant') {
      this.edit_activity(activityId);
    } else {
      this.show_activity(activityId);
    }
  }

  activity_change_status(activityId, status) {
    if (this.user.fonction === 'Enseignant') {
      //return this.user.setActivityStatusByTeacher(activityId, status);
    } else {
      //return this.user.setActivityStatusByStudent(activityId, status);
    }
  }

  duplicate_activity(activityId) {
    this.logger.log('CREATE', activityId, 'duplicate activity');
    this.activityService.duplicateActivity(activityId);
  }

  show_duplicates(activityId) {
    this.logger.log('OPEN', activityId, 'open activity duplicates');
    this.router.navigate(['duplicates/' + activityId]);
  }
}
