import { Router } from '@angular/router';
import { AuthenticationService } from './../service/authentication.service';
import { HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { NotificationService } from './../service/notification.service';
import { UserService } from './../service/user.service';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { NotificationType } from '../enum/notification-type.enum';
import { NgForm } from '@angular/forms';
import { Role } from '../enum/role.enum';
import { CustomHttpResponse } from '../model/custom-http-response';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  private titleSubject = new BehaviorSubject<string>('Profile');
  private subscriptions: Subscription[] = [];
  private currentUsername: string = "";
  titleAction$ = this.titleSubject.asObservable();
  users?: User[];
  user = new User();
  refreshing: boolean = false;
  selectedUser?: User;
  fileName?: string;
  profileImage: any;
  editUser = new User();

  
  constructor(private userService: UserService, private notifier: NotificationService,
              private authenticationService: AuthenticationService, private router: Router) { }
  
  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
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
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} register successfully`);
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
  
  
  onEditUser(editUser: User): void{
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit');
  }

  onUpdateUser(): void{
    const formData = this.userService.createUserFromDate(this.currentUsername, this.editUser, this.profileImage);
    this.subscriptions?.push(
      this.userService.updateUser(formData).subscribe(
        (response: any) => {
          this.clickButton('closeEditUserModelButton');
          this.getUsers(false);
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
          this.profileImage = null;
          this.fileName = undefined;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, "Erro ao cadastrar um novo usuário no sisitema");
          this.profileImage = null;
        }
      ));
  }

  onDeleteUser(userId: number): void{
    this.subscriptions.push(
      this.userService.deleteUser(userId).subscribe(
        (response: any) => {
          this.getUsers(true);
          this.sendNotification(NotificationType.SUCCESS, response.message);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      ));
  }

  onResetPassword(email: NgForm): void{
    const emailAddress = email.value['reset-password-email'];
    this.refreshing = true;

    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, errorResponse.error.message);
          this.refreshing = false;
        },
        () => email.reset()
      )
    )
  }

  onUpdateCurrentUser(user: User): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFromDate(this.currentUsername, user, this.profileImage);
    this.subscriptions?.push(
      this.userService.updateUser(formData).subscribe(
        (response: any) => {
          this.authenticationService.addUserToLocalCache(response);
          this.clickButton('closeEditUserModelButton');
          this.getUsers(false);
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
          this.profileImage = null;
          this.fileName = undefined;
          this.refreshing = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, "Erro ao cadastrar um novo usuário no sisitema");
          this.profileImage = null;
          this.refreshing = false;
        }
      ));
  }

  onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESS, "Deslogado com sucesso");
  }
  
  updateProfileImage(): void{
    this.clickButton('profile-image-input');
  }

  ondateProfileImage(): void{
    const formData = new FormData();
    formData.append('username', this.user?.username);
    formData.append('profileImage', this.profileImage);
    this.subscriptions?.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.sendNotification(NotificationType.SUCCESS, `profile image updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      ));
  }
  

  sendNotification(notificationType: NotificationType, message: any): void {
    message ? this.notifier.showNotification(notificationType, message) : 
    this.notifier.showNotification(notificationType, 'Usuário ou senha incorretos, tente novamente!')
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




}
