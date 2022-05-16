import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './../service/notification.service';
import { UserService } from './../service/user.service';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { NotificationType } from '../enum/notification-type.enum';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Profile');
  titleAction$ = this.titleSubject.asObservable();
  users: User[] = [];
  refreshing: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private userService: UserService, private notifier: NotificationService) { }

  changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response) => {
          response = [];;
          this.userService.addUsersToLocalCache(response);
          this.users = response;
          this.refreshing = false;
          if(showNotification)
            this.sendNotification(NotificationType.SUCCESS, `${response.length} users(s) loaded successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  sendNotification(notificationType: NotificationType, message: any): void {
    message ? this.notifier.showNotification(notificationType, message) : 
    this.notifier.showNotification(notificationType, 'Usuário ou senha incorretos, tente novamente!')
  }

  ngOnInit(): void {
  }

}
