import { KeyValue } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { faSignOutAlt,
  faPersonSkiing,
  faUtensils,
  faKitchenSet,
  faPlaneDeparture,
  faTv,
  faMoneyBillWave,
  faImage } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: false
})
export class NavbarComponent implements OnInit {

  @Input() linkColor: string = '';

  faSignOutAlt = faSignOutAlt;

  routerMapping = {
    "/details/to-do": {
      text: "Doing!",
      icon: faPersonSkiing
    },
    "/details/to-eat": {
      text: "Eating!",
      icon: faUtensils
    },
    "/details/to-cook": {
      text: "Cooking!",
      icon: faKitchenSet
    },
    "/details/to-go": {
      text: "Going!",
      icon: faPlaneDeparture
    },
    "/details/to-watch": {
      text: "Watching!",
      icon: faTv
    },
    "/details/to-buy": {
      text: "Buying!",
      icon: faMoneyBillWave
    },
    "/photos": {
      text: "Photos!",
      icon: faImage
    }
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
