import { Component } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';

@Component({
    selector: 'app-christmas',
    templateUrl: './christmas.component.html',
    styleUrls: ['./christmas.component.css']
})
export class ChristmasComponent {

    navigationSubscription;

    data: {name: string, link?: string}[] = [
        {
            name: 'Harry Potter 3 Minalima book',
            link: 'https://www.amazon.com/Harry-Potter-Prisoner-Azkaban-MinaLima/dp/1338815288'
        },
        {
            name: 'Set of new plates (dinner plates, small plates, bowls)'
        },
        {
            name: 'Pajamas - Fangzhuo (regular small)',
            link: 'https://www.llbean.com/llb/shop/118952?page=womens-1912-flannel-pajamas-plaid-misses-regular&bc=12-27-613&feat=613-GN1&csp=f&attrValue_0=Black%20Watch&pos=1'
        },
        {
            name: 'Portable washing machine',
            link: 'https://www.amazon.com/dp/B0CD7DKXLF?ref_=cm_sw_r_apin_dp_8VMNWW8AV09ENVKYQRY5&language=en-US&th=1'
        },
        {
            name: 'Gift cards - Costco, Target, Amazon, Nintendo eShop, Steam'
        }
    ]

    constructor(private router: Router) {
        this.navigationSubscription = this.router.events.subscribe(async (e: any) => {

        });
    }
}
