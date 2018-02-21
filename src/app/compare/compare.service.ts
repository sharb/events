import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

import { CompareData } from './compare-data.model';
import { AuthService } from '../user/auth.service';

@Injectable()
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false);
  dataIsLoading = new BehaviorSubject<boolean>(false);
  dataLoaded = new Subject<CompareData[]>();
  dataLoadFailed = new Subject<boolean>();
  userData: CompareData;
  constructor(private http: Http,
              private authService: AuthService) {
  }

  onStoreData(data: CompareData) {
    this.dataLoadFailed.next(false);
    this.dataIsLoading.next(true);
    this.dataEdited.next(false);
    this.userData = data;
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err){
        return;
      }
      this.http.post('https://8m8ztt5ame.execute-api.us-east-1.amazonaws.com/dev/compare-yourselves', data, {
        headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
      })
        .subscribe(
          (result) => {
            this.dataLoadFailed.next(false);
            this.dataIsLoading.next(false);
            this.dataEdited.next(true);
          },
          (error) => {
            this.dataIsLoading.next(false);
            this.dataLoadFailed.next(true);
            this.dataEdited.next(false);
          }
        );
    });

  }
  onRetrieveData(all = true) {
    this.dataLoaded.next(null);
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.log(err);
        return;
      } else {
        const queryParam = '?accessToken=' + session.getAccessToken().getJwtToken();
        let urlParam = 'all';
        if (!all) {
          urlParam = 'single';
        }
        console.log("api-gateway/" + urlParam + queryParam )
        //console.log("JWT session is: " + session.getAccessToken().getJwtToken());
        this.http.get('https://8m8ztt5ame.execute-api.us-east-1.amazonaws.com/dev/compare-yourselves/' + urlParam + queryParam, {
          headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
        })
        //session.getIdToken().getJwtToken()
          .map(
            (response: Response) => response.json()
          )
          .subscribe(
            (data) => {
              if (all) {
                this.dataLoaded.next(data);
              } else {
                console.log("data recieved: ");
                console.log(data);
                let age = data.age;
                console.log(age);
                if (!data) {
                  this.dataLoadFailed.next(true);
                  return;
                }
                this.userData = data;
                let obj = {};
                // console.log("data[0]/this.userData is: ");
                // console.log(JSON.stringify(data[0].age));
                this.dataEdited.next(true);
              }
            },
            (error) => {
              console.log(error);
              this.dataLoadFailed.next(true);
              this.dataLoaded.next(null);
            }
          );
      }
    });
  }
  onDeleteData() {
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      this.http.delete('https://8m8ztt5ame.execute-api.us-east-1.amazonaws.com/dev/compare-yourselves', {
        headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
      })
        .subscribe(
          (data) => {
            console.log(data);
          },
          (error) => this.dataLoadFailed.next(true)
        );
      });

  }
}
