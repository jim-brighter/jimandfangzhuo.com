import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';
import { AuthenticationService } from "src/app/services/authentication.service";
import { ChristmasService } from "src/app/services/christmas.service";
import { ChristmasItem } from "src/app/types/christmas";

@Component({
    selector: 'app-christmas',
    templateUrl: './christmas.component.html',
    styleUrls: ['./christmas.component.css']
})
export class ChristmasComponent implements OnDestroy, OnInit {

    navigationSubscription;

    isLoading = true;
    isAuthenticated = false;

    year = new Date().getFullYear();

    data: ChristmasItem[] = [];

    newItem: ChristmasItem = new ChristmasItem();

    screenWidth = 0;

    constructor(private christmasService: ChristmasService, private router: Router,
        private authenticator: AuthenticationService) {
        this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
            if (e instanceof NavigationEnd) {
                await this.authenticated();
                this.christmasService.getItems().subscribe(data => {
                    this.data = data;
                    this.isLoading = false;
                });
            }
        });
    }

    ngOnInit() {
        this.screenWidth = window.screen.width;
    }

    async authenticated(): Promise<boolean> {
        const authStatus = await this.authenticator.authenticated();
        this.isAuthenticated = authStatus;
        return authStatus;
    }

    saveNewItem(): void {
        this.christmasService.createItem(this.newItem).subscribe(data => {
            this.data.push(data);
            this.newItem.clear();
        })
    }

    ngOnDestroy() {
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }
}
