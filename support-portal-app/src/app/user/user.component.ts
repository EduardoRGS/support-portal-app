import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './../service/notification.service';
import { UserService } from './../service/user.service';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { NotificationType } from '../enum/notification-type.enum';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Profile');
  private subscriptions?: Subscription[];
  titleAction$ = this.titleSubject.asObservable();
  users?: User[];
  refreshing: boolean = false;
  selectedUser?: User;
  fileName?: string;
  profileImage: File = new File([""], "");

  
  constructor(private userService: UserService, private notifier: NotificationService) { }
  
  ngOnInit(): void {
    this.getUsers(true);
  }

  changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions?.push(
      this.userService.getUsers().subscribe(
        (response: any) => {        
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

  onSelectUser(selectedUser: User): void {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId)?.click();
  }

  onProfileImageChange(fileName: string, profileImage: File): void {
    this.fileName = fileName;
    this.profileImage = profileImage;
  }

  onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFromDate('', userForm.value, this.profileImage);
    this.subscriptions?.push(
      this.userService.addUser(formData).subscribe(
        (response: any) => {
          this.clickButton('new-user-save');
          this.getUsers(false);
          this.fileName = undefined;
          this.profileImage;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS, `${response.fistName} ${response.lastName} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      ));
    
  }

  saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  sendNotification(notificationType: NotificationType, message: any): void {
    message ? this.notifier.showNotification(notificationType, message) : 
    this.notifier.showNotification(notificationType, 'Usuário ou senha incorretos, tente novamente!')
  }


}
