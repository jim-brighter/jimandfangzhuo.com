import { Component, OnInit, Input } from '@angular/core';
import { Comment } from '../../types/comment';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-comment-item',
    templateUrl: './comment-item.component.html',
    styleUrls: ['./comment-item.component.css'],
    imports: [DatePipe]
})
export class CommentItemComponent implements OnInit {

  @Input() comment: Comment = new Comment();

  constructor() { }

  ngOnInit() {
  }

}
