import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';
import { AuthenticationService } from "src/app/services/authentication.service";
import { ChristmasService } from "src/app/services/christmas.service";
import { ChristmasItem } from "src/app/types/christmas";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: 'app-christmas',
    templateUrl: './christmas.component.html',
    styleUrls: ['./christmas.component.css']
})
export class ChristmasComponent implements OnDestroy, OnInit {

    faEdit = faEdit;

    navigationSubscription;

    isLoading = true;
    isAuthenticated = false;

    year = new Date().getFullYear();

    data: ChristmasItem[] = [];

    newItem: ChristmasItem = new ChristmasItem();

    screenWidth = 0;

    editing: number = -1;

    constructor(private christmasService: ChristmasService, private router: Router,
        private authenticator: AuthenticationService) {
        this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
            if (e instanceof NavigationEnd) {
                await this.authenticated();
                this.retrieveItems();
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

    retrieveItems(): void {
        this.christmasService.getItems().subscribe(data => {
            this.data = data;
            this.isLoading = false;
        });
    }

    saveNewItem(): void {
        this.christmasService.createItem(this.newItem).subscribe(data => {
            this.data.push(data);
            this.newItem.clear();
        })
    }

    editItem(i: number): void {
        this.editing = i;
    }

    cancelEdit(): void {
        this.editing = -1;
    }

    saveEditItem(item: ChristmasItem): void {
        this.christmasService.updateItem(item).subscribe(data => {
            this.editing = -1;
            this.retrieveItems();
        });
    }

    ngOnDestroy() {
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }
}
