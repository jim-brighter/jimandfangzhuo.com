import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';
import { ErrorService } from '../../services/error.service';
import { faSignOutAlt, faTimes } from '@fortawesome/free-solid-svg-icons';


const MIN_WIDTH = 768;

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit, OnDestroy {

  list: string = '';

  navigationSubscription;

  isAuthenticated = false;

  hideLists = false;
  hideComments = false;

  faSignOutAlt = faSignOutAlt;
  faTimes = faTimes;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private authenticator: AuthenticationService,
    public errors: ErrorService) {

      this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
        if (e instanceof NavigationEnd && await this.authenticated()) {
          this.getList();
        }
      });
    }

  ngOnInit() {
    this.getList();
    if (window.innerWidth <= MIN_WIDTH) {
      this.hideComments = true;
      this.hideLists = false;
    }
  }

  async authenticated(): Promise<boolean> {
    const authStatus = await this.authenticator.authenticated();
    this.isAuthenticated = authStatus;
    return authStatus;
  }

  getList(): void {
    const list = this.enumify(this.route.snapshot.paramMap.get('list') || '');
    this.list = list;
  }

  private enumify(listname: string): string {
    return listname.replace('-', '_').toUpperCase();
  }

  goToDetails(): void {
    this.hideComments = true;
    this.hideLists = false;
  }

  goToComments(): void {
    this.hideLists = true;
    this.hideComments = false;
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

}
