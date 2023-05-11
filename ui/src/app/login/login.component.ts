import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  @Input() endpoint: string = '';

  credentials = {
    username: '',
    password: ''
  };

  constructor(private authenticator: AuthenticationService, private router: Router) { }

  ngOnInit() {
  }

  login(): boolean {
    this.authenticator.authenticate(this.credentials, () => {
      if (this.endpoint === 'photos' || this.endpoint === 'admin') {
        this.router.navigateByUrl(`/${this.endpoint}`);
      }
      else {
        this.router.navigateByUrl(`/details/${this.endpoint.toLowerCase().replace('_', '-')}`);
      }
    });
    return false;
  }

}
