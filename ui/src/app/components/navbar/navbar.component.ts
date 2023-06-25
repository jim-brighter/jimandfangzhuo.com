import { KeyValue } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  @Input() linkColor: string = '';

  faSignOutAlt = faSignOutAlt;

  routerMapping = {
    "/details/to-do": "Doing!",
    "/details/to-eat": "Eating!",
    "/details/to-cook": "Cooking!",
    "/details/to-go": "Going!",
    "/details/to-watch": "Watching!",
    "/details/to-buy": "Buying!",
    "/photos": "Photos!"
  }

  constructor(private authenticator: AuthenticationService, private router: Router) { }

  ngOnInit() {
  }

  onCompare(_left: KeyValue<any, any>, _right: KeyValue<any, any>): number {
    return 1;
  }

  showLogout(): boolean {
    return this.router.url !== '/';
  }

  logout(): void {
    this.authenticator.logout();
    this.router.navigateByUrl('/');
  }

}
