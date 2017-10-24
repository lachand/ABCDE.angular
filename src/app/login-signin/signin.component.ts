import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder} from '@angular/forms';
import PouchDB from 'pouchdb';

// Dirty
declare const require: any;
PouchDB.plugin(require('pouchdb-authentication'));

import { UserService } from '../services/user.service';
import {Http, Headers} from '@angular/http';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {

  signinForm: FormGroup;
  db: any;
  teacher: any;

  constructor(public user: UserService,
              public router: Router,
              public formBuilder: FormBuilder,
              public http: Http) {
    this.db = this.user.db;
  }

  ngOnInit() {
    this.signinForm = this.formBuilder.group({
      username: '',
      password: '',
      avatar: 'http://mondesfrancophones.com/wp-content/Cimy_User_Extra_Fields/clarouche/Christian%20Larouche.JPG'
    });
    this.teacher = false;
  }

  signup(): void {
    if (this.signinForm.valid) {

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const credential = {
        username: this.signinForm.value.username,
        password: this.signinForm.value.password
      }

      this.http.post('http://localhost:3000/auth/login', JSON.stringify(credential), {headers: headers})
        .subscribe(res => {
          console.log(res);
        }, (err) => {
          console.log(err);
        });

      /**this.db.signup(this.signinForm.value.username, this.signinForm.value.password, function (err, response) {
        if (err) {
          if (err.name === 'conflict') {
            console.log('user already exists, choose another username');
          } else if (err.name === 'forbidden') {
            console.log('invalid username');
          } else {
            console.log(err);
          }
        }
      }).then((res) => {
        console.log(res);
        let fonct = 'Eleve';
        if (this.teacher) {
          fonct = 'Enseignant';
        }
        return this.db.putUser(this.signinForm.value.username, {
          metadata: {
            avatar: this.signinForm.value.avatar,
            fonction: fonct
          }
        }, function (err, response) {
        }).then( userCreated => {
          const user = {
            _id: userCreated.id,
            avatar: this.signinForm.value.avatar,
            fonction: fonct
          };
          return this.db.put(user);
          }
        ).then((res2) => {
          console.log(res2);
        });
      });**/
    }
  }

  isTeacher() {
    this.teacher = !this.teacher;
  }

}
