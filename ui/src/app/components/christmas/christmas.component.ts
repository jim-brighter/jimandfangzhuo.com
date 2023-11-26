import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';
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

    year = new Date().getFullYear();

    data: ChristmasItem[] = [];

    newItem: ChristmasItem = new ChristmasItem();

    screenWidth = 0;

    constructor(private christmasService: ChristmasService, private router: Router) {
        this.navigationSubscription = this.router.events.subscribe(async (e: any) => {
            if (e instanceof NavigationEnd) {
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
