import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { User } from './user.model';

import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession
} from 'amazon-cognito-identity-js';

var poolData = {
        UserPoolId : 'us-east-1_EUKt36Qg2', // Your user pool id here
        ClientId : '4oipadee9ac4fpf2hoa9l96r32' // Your client id here
    };
var userPool = new CognitoUserPool(poolData);

@Injectable()
export class AuthService {
  authIsLoading = new BehaviorSubject<boolean>(false);
  authDidFail = new BehaviorSubject<boolean>(false);
  authStatusChanged = new Subject<boolean>();
  registeredUser: CognitoUser;

  constructor(private router: Router) {}
  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true);
    const user: User = {
      username: username,
      email: email,
      password: password
    };
    const emailAttribute = {
      Name: 'email',
      Value: user.email
    };

    var attributeList: CognitoUserAttribute[] = [];
    //var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(emailAttribute);
    //var attributeUsername = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(user);
    attributeList.push(new CognitoUserAttribute(emailAttribute));
    //attributeList.push(new CognitoUserAttribute(attributeUsername));

    userPool.signUp(user.username, user.password, attributeList, null, (err, result) => {
        if (err) {
            this.authDidFail.next(true);
            this.authIsLoading.next(false);
            alert(err);
            return;
        }
        var cognitoUser = result.user;

        this.authDidFail.next(false);
        this.authIsLoading.next(false);
        this.registeredUser = cognitoUser;

        console.log('user name is ' + cognitoUser.getUsername());
    });

    return;
  }
  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true);
    const userData = {
      Username: username,
      Pool: userPool
    };
    const cognitUser = new CognitoUser(userData);
    cognitUser.confirmRegistration(code, true, (err, result) => {
      if (err){
        this.authDidFail.next(true);
        this.authIsLoading.next(false);
        alert(err);
        return;
      }
      this.authDidFail.next(false);
      this.authIsLoading.next(false);
      this.router.navigate(['/']);
    });
  }
  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);
    const authData = {
      Username: username,
      Password: password
    };
    const authDetails = new AuthenticationDetails(authData);
    const userData = {
      Username: username,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);
    const that = this;
    cognitoUser.authenticateUser(authDetails, {
      onSuccess(result: CognitoUserSession){
        that.authStatusChanged.next(true);
        that.authDidFail.next(false);
        that.authIsLoading.next(false);
        console.log(result);
      },
      onFailure(err){
        that.authDidFail.next(true);
        that.authIsLoading.next(false);
        console.log(err);
      }
    });
    this.authStatusChanged.next(true);
    return;
  }
  getAuthenticatedUser() {
    return userPool.getCurrentUser();
  }
  logout() {
    this.getAuthenticatedUser().signOut();
    this.authStatusChanged.next(false);
  }
  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser();
    const obs = Observable.create((observer) => {
      if (!user) {
        observer.next(false);
      } else {
        user.getSession((err, session) => {
          if (err) {
            observer.next(false);
          } else {
            if (session.isValid()){
              observer.next(true);
            } else {
              observer.next(false);
            }
          }
        });
        observer.next(false);
      }
      observer.complete();
    });
    return obs;
  }
  initAuth() {
    this.isAuthenticated().subscribe(
      (auth) => this.authStatusChanged.next(auth)
    );
  }
}
