import { NotificationType } from './../enum/notification-type.enum';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { User } from './../model/user';
import { NotificationService } from './../service/notification.service';
import { AuthenticationService } from './../service/authentication.service';
import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  showLoading: boolean = true;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, 
    private authenticationService: AuthenticationService,
    private notifier: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isUserLoggedIn()){
      this.router.navigateByUrl('/user/management');
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  public onLogin(user: User){
    this.showLoading;
    console.log(user);
    this.subscriptions.push(
      this.authenticationService.login(user).subscribe(
        (response: HttpResponse<User>) => {
          const token = response.headers.get('Jwt-Token');
          this.authenticationService.saveToken(token || '');
          this.authenticationService.addUserToLocalCache(response.body ? response.body : user);
          this.router.navigateByUrl('/user/management');
          this.showLoading = false;
        },
        (errorResponse: HttpErrorResponse) => {
          console.log(errorResponse);
          this.sendErrorNotification(NotificationType.ERROR, errorResponse.error.message);
          this.showLoading = false;
        }
      )
    )
    
  }
  sendErrorNotification(notificationType: NotificationType, message: any) {
    if (message) {
      this.notifier.showNotification(notificationType, message);
    }else{
      this.notifier.showNotification(notificationType, 'Erro Login, tente novamente!');
    }
  }

  ngOnDestroy(): void {
      this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
