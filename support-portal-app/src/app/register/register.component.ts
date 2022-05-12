import { NotificationType } from './../enum/notification-type.enum';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from './../model/user';
import { NotificationService } from './../service/notification.service';
import { AuthenticationService } from './../service/authentication.service';
import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy  {

  showLoading: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, 
    private authenticationService: AuthenticationService,
    private notifier: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isUserLoggedIn()){
      this.router.navigateByUrl('/user/management');
    }
  }

  public onRegister(user: User){
    this.showLoading = true;
    this.subscriptions.push(
      this.authenticationService.register(user).subscribe(
        (response: User) => {
          this.showLoading = false;
          this.sendErrorNotification(NotificationType.SUCCESS, `A new account was created for ${response.fistName}.
          Please chack your email for password to log in.`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendErrorNotification(NotificationType.ERROR, errorResponse.error.message);
          this.showLoading = false;
        }
      )
    )
    
  }
  
  sendErrorNotification(notificationType: NotificationType, message: any): void {
    message ? this.notifier.showNotification(notificationType, message) : 
    this.notifier.showNotification(notificationType, 'Usuário ou senha incorretos, tente novamente!')
  }

  ngOnDestroy(): void {
      this.subscriptions.forEach(sub => sub.unsubscribe());
  }


}
