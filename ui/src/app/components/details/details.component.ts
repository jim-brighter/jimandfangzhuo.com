import { Component, OnDestroy, OnInit } from '@angular/core'

import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { Location, NgClass, NgFor, NgIf } from '@angular/common'
import { AuthenticationService } from '../../services/authentication.service'
import { ErrorService } from '../../services/error.service'
import { faSignOutAlt, faTimes } from '@fortawesome/free-solid-svg-icons'
import { NavbarComponent } from '../navbar/navbar.component'
import { ListsComponent } from '../lists/lists.component'
import { CommentsComponent } from '../comments/comments.component'
import { LoginComponent } from '../login/login.component'


const MIN_WIDTH = 768

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],
  imports: [NavbarComponent, NgFor, NgIf, NgClass, ListsComponent, CommentsComponent, LoginComponent]
})
export class DetailsComponent implements OnInit, OnDestroy {

  list: string = ''

  navigationSubscription

  isAuthenticated = false

  hideLists = false
  hideComments = false

  faSignOutAlt = faSignOutAlt
  faTimes = faTimes

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private authenticator: AuthenticationService,
    public errors: ErrorService) {

    this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
      if (e instanceof NavigationEnd && await this.authenticated()) {
        this.getList()
      }
    })
  }

  ngOnInit() {
    this.getList()
    if (window.innerWidth <= MIN_WIDTH) {
      this.hideComments = true
      this.hideLists = false
    }
  }

  async authenticated(): Promise<boolean> {
    const authStatus = await this.authenticator.authenticated()
    this.isAuthenticated = authStatus
    return authStatus
  }

  getList(): void {
    const list = this.enumify(this.route.snapshot.paramMap.get('list') || '')
    this.list = list
  }

  goToDetails(): void {
    this.hideComments = true
    this.hideLists = false
  }

  goToComments(): void {
    this.hideLists = true
    this.hideComments = false
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe()
    }
  }

  private enumify(listname: string): string {
    return listname.replace('-', '_').toUpperCase()
  }

}
