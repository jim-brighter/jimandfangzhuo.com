import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  faSignOutAlt = faSignOutAlt;

  constructor(
    private authenticator: AuthenticationService,
    private router: Router) { }

  ngOnInit() {
  }

  logout(): void {
    this.authenticator.logout();
    this.router.navigateByUrl('/');
  }

}
