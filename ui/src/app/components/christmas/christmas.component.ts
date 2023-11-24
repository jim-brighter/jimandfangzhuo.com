import { Component } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';

@Component({
    selector: 'app-christmas',
    templateUrl: './christmas.component.html',
    styleUrls: ['./christmas.component.css']
})
export class ChristmasComponent {

    navigationSubscription;

    constructor(private router: Router) {
        this.navigationSubscription = this.router.events.subscribe(async (e: any) => {

        });
    }
}
