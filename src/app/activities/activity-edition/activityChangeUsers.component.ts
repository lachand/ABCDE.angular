import {Component, OnInit} from '@angular/core';
import {ActivityService} from '../../services/activity.service';
import {Router} from '@angular/router';
import {MdDialogRef} from '@angular/material';

@Component({
  selector: 'app-activity-change-users',
  templateUrl: './activityChangeUsers.component.html'
})

export class ActivityChangeUsersComponent {

  dialogRef: MdDialogRef<ActivityChangeUsersComponent>;
  userChecked: Array<any>;
  userCheckedInitially: Array<any>;
  usersToChange: Array<any>;

  constructor(private activityService: ActivityService, private router: Router) {
    this.userChecked = [];
    this.userCheckedInitially = []
    for (let user of this.activityService.user.allUsers) {
      if (user.activites.indexOf(this.activityService.activity_loaded._id) !== -1) {
        this.userChecked.push({'user': user, 'checked': true});
        this.userCheckedInitially.push({'user': user, 'checked': true});
      } else {
        this.userChecked.push({'user': user, 'checked': false});
        this.userCheckedInitially.push({'user': user, 'checked': false});
      }
    }
  }

  changeUsers() {
    this.usersToChange = [];
    for (let i = 0; i < this.userChecked.length; i++) {
      if (this.userChecked[i].checked !== this.userCheckedInitially[i].checked) {
        let user = this.userChecked[i].user;
        if (this.userChecked[i].checked) {
          user.activites.push(this.activityService.activity_loaded._id);
          this.activityService.activity_loaded.participants.push(user._id);
        } else {
          this.activityService.activity_loaded.participants.splice(this.activityService.activity_loaded.participants.indexOf(user._id),1);
          user.activites.splice(user.activites.indexOf(this.activityService.activity_loaded._id), 1);
        }
        this.usersToChange.push(user);
      }
    }
    this.activityService.user.db.bulkDocs(this.usersToChange).then( res2 => {
      this.activityService.db.put(this.activityService.activity_loaded).then( res3 => {
        this.dialogRef.close();
      });
    });
  }

  changeValue(event) {
    for (const user of this.userChecked) {
      if (user.user.name === event.source.name) {
        user.checked = !user.checked;
      }
    }
  }
}
