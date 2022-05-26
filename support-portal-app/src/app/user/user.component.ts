import { AuthenticationService } from './../service/authentication.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './../service/notification.service';
import { UserService } from './../service/user.service';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { NotificationType } from '../enum/notification-type.enum';
import { NgForm } from '@angular/forms';
import { Role } from '../enum/role.enum';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Profile');
  private subscriptions: Subscription[] = [];
  titleAction$ = this.titleSubject.asObservable();
  users?: User[];
  refreshing: boolean = false;
  selectedUser?: User;
  fileName?: string;
  profileImage: any;

  
  constructor(private userService: UserService, private notifier: NotificationService,
              private authenticationService: AuthenticationService) { }
  
  ngOnInit(): void {
    this.getUsers(true);
  }

  changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
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
  
  saveNewUser(): void {
    document.getElementById('new-user-save')?.click();
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId)?.click();
  }
  
  onProfileImageChange(fileName: any, profileImage: any): void { //fileName = string com o nome da imagem
    fileName = fileName.target.files[0].name;                     // profileImage = File com os dados do arquivo
    profileImage = profileImage.target.files[0];
    
    this.fileName = fileName;
    this.profileImage = profileImage;
  }

  onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFromDate('', userForm.value, this.profileImage);
    this.subscriptions?.push(
      this.userService.addUser(formData).subscribe(
        (response: any) => {
          this.getUsers(false);
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
          userForm.onReset();
          this.profileImage = null;
          this.fileName = undefined;

        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, "Erro ao cadastrar um novo usuário no sisitema");
          this.profileImage = null;
        }
      ));
  }

  searchUsers(searchTerm: string): void {
    const results: User[] = [];
    for (const user of this.userService.getUsersToLocalCache()) {
      if (user.firstName.toLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1 ||
          user.lastName.toLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1 || 
          user.username.toLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1 || 
          user.userId.toLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1) {
          results.push(user);
      }
    }
    this.users = results;
    if (results.length === 0 || !searchTerm) {
      this.users = this.userService.getUsersToLocalCache();
    }
  }

  private getUserRole(): string {
    return this.authenticationService.getUserFromLocalCache().role;
  }

  public get isAdmin(): boolean {
    return this.getUserRole() === Role.USER || this.getUserRole() === Role.SUPER_ADMIN;
  }

  public get isManager(): boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }

  public get isAdminOrManager(): boolean {
    return this.isAdmin || this.isManager;
  }


  sendNotification(notificationType: NotificationType, message: any): void {
    message ? this.notifier.showNotification(notificationType, message) : 
    this.notifier.showNotification(notificationType, 'Usuário ou senha incorretos, tente novamente!')
  }


}
